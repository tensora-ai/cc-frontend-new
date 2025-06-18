// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Get token from cookies
  const token = request.cookies.get('tensora_count_access_token')?.value;
  
  // If accessing login page while authenticated, redirect to home
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|tensora_logo.png).*)'
  ]
};