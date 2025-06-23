// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to decode JWT payload (basic decode without verification)
function decodeJWTPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
}

// Helper function to check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

// Helper function to get user data from cookies
function getUserFromCookies(request: NextRequest): any {
  try {
    const userDataCookie = request.cookies.get('tensora_count_user_data')?.value;
    if (!userDataCookie) return null;
    
    return JSON.parse(userDataCookie);
  } catch (error) {
    console.error('Error parsing user data from cookies:', error);
    return null;
  }
}

// Helper function to check if user has project access
function hasProjectAccess(user: any, projectId: string): boolean {
  if (!user) return false;
  
  // Super admin has access to all projects
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Check if project is in user's access list
  return user.project_access?.includes(projectId) ?? false;
}

// Helper function to check if user can view project settings
function canViewProjectSettings(user: any, projectId: string): boolean {
  if (!user) return false;
  
  // PROJECT_OPERATOR cannot view project settings - dashboard only!
  if (user.role === 'PROJECT_OPERATOR') return false;
  
  // Super admin can view all project settings
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Project admin can view settings for their assigned projects
  return user.role === 'PROJECT_ADMIN' && hasProjectAccess(user, projectId);
}

// Helper function to check if user can view dashboard
function canViewDashboard(user: any, projectId: string): boolean {
  if (!user) return false;
  
  // All roles can view dashboard if they have project access
  return hasProjectAccess(user, projectId);
}

// Helper function to log access attempts for debugging
function logAccessAttempt(
  pathname: string, 
  user: any, 
  projectId?: string, 
  action?: string
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Access attempt:`, {
      pathname,
      user: user ? {
        username: user.username,
        role: user.role,
        project_access: user.project_access
      } : 'none',
      projectId,
      action
    });
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Static asset routes that should be allowed
  const staticRoutes = ['/_next', '/favicon.ico', '/tensora_logo.png'];
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route));
  
  if (isStaticRoute) {
    return NextResponse.next();
  }
  
  // Get token and user data from cookies
  const token = request.cookies.get('tensora_count_access_token')?.value;
  const isAuthenticated = token && !isTokenExpired(token);
  const user = isAuthenticated ? getUserFromCookies(request) : null;
  
  // If accessing login page while authenticated, redirect to home
  if (isPublicRoute && isAuthenticated) {
    logAccessAttempt(pathname, user, undefined, 'redirect_from_login');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing protected route without valid token, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    logAccessAttempt(pathname, null, undefined, 'redirect_to_login');
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Enhanced role-based route protection for authenticated users
  if (isAuthenticated && user) {
    // Check for project-specific routes
    const projectRouteMatch = pathname.match(/^\/project\/([^\/]+)(?:\/(.*))?$/);
    
    if (projectRouteMatch) {
      const projectId = projectRouteMatch[1];
      const subPath = projectRouteMatch[2] || '';
      
      logAccessAttempt(pathname, user, projectId, `access_project_${subPath || 'settings'}`);
      
      // First check: Does user have any access to this project?
      if (!hasProjectAccess(user, projectId)) {
        console.log(`[Middleware] User ${user.username} denied access to project ${projectId} - no project access`);
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Second check: Route-specific permissions
      if (!subPath || (subPath && !subPath.startsWith('dashboard'))) {
        // This is a project settings route (e.g., /project/abc or /project/abc/anything-not-dashboard)
        if (!canViewProjectSettings(user, projectId)) {
          console.log(`[Middleware] User ${user.username} (${user.role}) redirected from project settings to dashboard for project ${projectId}`);
          // PROJECT_OPERATOR or users without settings access get redirected to dashboard
          const dashboardUrl = new URL(`/project/${projectId}/dashboard`, request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } else if (subPath.startsWith('dashboard')) {
        // This is a dashboard route
        if (!canViewDashboard(user, projectId)) {
          console.log(`[Middleware] User ${user.username} denied dashboard access to project ${projectId}`);
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
      
      // If we get here, user has appropriate access
      logAccessAttempt(pathname, user, projectId, 'access_granted');
    }
    
    // For non-project routes, just ensure user is authenticated (already checked above)
    logAccessAttempt(pathname, user, undefined, 'general_access');
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except API routes and static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - tensora_logo.png (logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|tensora_logo.png).*)',
  ],
};