// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
import { env } from '@/config/env';

// Define constants
const LOGIN_PATH = '/login';
const DASHBOARD_PATH = '/dashboard';

// Middleware function
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the refresh token cookie exists
  const hasRefreshToken = request.cookies.has(env.auth.refreshCookieName);

  // 2. Define routes that require login
  const protectedRoutes = ['/dashboard', '/profile', '/user', '/application', '/application-offer', '/funding', '/syndication-offer', '/syndication', 
    '/funder', '/iso', '/representative', '/contact', '/document', '/merchant', ];
  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // 3. Redirect to /login if trying to access protected routes without a refresh token
  if (isProtected && !hasRefreshToken) {
    console.log('Middleware: Refresh token missing. Redirecting to login.');
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // 4. (Optional) Block access to /login if refresh token exists (user is likely logged in)
  // if (pathname === LOGIN_PATH && hasRefreshToken) {
  //   return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  // }

  return NextResponse.next();
}

// Apply to these routes only
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/profile/:path*', '/application/:path*'],
};
