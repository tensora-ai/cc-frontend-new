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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get token from cookies
  const token = request.cookies.get('tensora_count_access_token')?.value;
  const isAuthenticated = token && !isTokenExpired(token);
  
  // If accessing login page while authenticated, redirect to home
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Role-based route protection for authenticated users
  if (isAuthenticated) {
    const user = getUserFromCookies(request);
    
    // Check for project-specific routes
    const projectRouteMatch = pathname.match(/^\/project\/([^\/]+)(?:\/(.*))?$/);
    
    if (projectRouteMatch) {
      const projectId = projectRouteMatch[1];
      const subPath = projectRouteMatch[2] || '';
      
      // Check if user has access to this project
      if (!hasProjectAccess(user, projectId)) {
        // User doesn't have access to this project, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // If it's a project settings route (not dashboard), check permissions
      if (!subPath || (subPath && !subPath.startsWith('dashboard'))) {
        // This is a project settings route
        if (!canViewProjectSettings(user, projectId)) {
          // PROJECT_OPERATOR trying to access settings, redirect to dashboard
          const dashboardUrl = new URL(`/project/${projectId}/dashboard`, request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      }
      
      // For dashboard routes, just ensure project access (already checked above)
      if (subPath && subPath.startsWith('dashboard')) {
        // User has project access, allow dashboard access
        return NextResponse.next();
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|tensora_logo.png).*)'
  ]
};