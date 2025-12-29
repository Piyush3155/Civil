import { NextRequest, NextResponse } from 'next/server'
import { unsealData, sealData } from 'iron-session'
import { ironSessionOptions } from '@/lib/sessionLib'
import * as jwt from 'jsonwebtoken'

// Public routes that don't require a session
const PUBLIC_PATHS = ['/login','/signout','/hero.png','/civil.webp', '/forgot-password', '/favicon.ico', '/images', '/android', '/ios', '/windows11', '/service-worker.js', '/manifest.webmanifest', '/api/firebase-messaging-config', '/firebase-messaging-sw.js','/logo.png']

interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  accessToken?: string;
  username?: string;
  name?: string;
  email?: string;
  roles?: string[];
}

/**
 * Safely decodes a JWT token without throwing errors
 */
function safeDecodeToken(token: string): jwt.JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object') {
      return decoded as jwt.JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired
 */
function isTokenExpired(token: string): boolean {
  const decoded = safeDecodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block Chrome DevTools helper request in development to avoid spurious traffic
  if (process.env.NODE_ENV !== 'production' && pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new NextResponse('Not found', { status: 404 })
  }

  // Allow public/internal paths to pass through
  if (
    PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/')) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    // Public assets placed in the `public/` folder are served from the root, e.g. /images/...
    pathname === '/service-worker.js' ||
    pathname === '/api/service-worker' ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  // Check session validity
  const cookieName = ironSessionOptions.cookieName;
  const cookieValue = request.cookies.get(cookieName)?.value;

  if (!cookieValue) {
    // No session cookie — redirect to signin
    const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const signInUrl = new URL('/login', host);
    const redirectUrl = host + request.nextUrl.pathname;
    if (redirectUrl === host + '/' || redirectUrl === host) {
      return NextResponse.redirect(signInUrl);
    } else {
      signInUrl.searchParams.set('redirect', redirectUrl);
      return NextResponse.redirect(signInUrl);
    }
  }

  try {
    const sessionData = await unsealData(cookieValue, ironSessionOptions);
    const session = sessionData as SessionData;

    if (!session.isLoggedIn || !session.accessToken) {
      // No session or token — redirect to signin
      const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
      const signInUrl = new URL('/login', host);
      const redirectUrl = host + request.nextUrl.pathname;
      if (redirectUrl === host + '/' || redirectUrl === host) {
        return NextResponse.redirect(signInUrl);
      } else {
        signInUrl.searchParams.set('redirect', redirectUrl);
        return NextResponse.redirect(signInUrl);
      }
    }

    // Redirect root to dashboard if logged in
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isTokenExpired(session.accessToken)) {
      // Token expired, try to refresh
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      try {
        const refreshResponse = await fetch(`${backendUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: session.accessToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Update session with new token
          session.accessToken = refreshData.access_token;
          // Re-seal the session
          const sealed = await sealData(session, ironSessionOptions);
          const response = NextResponse.next();
          response.cookies.set(ironSessionOptions.cookieName, sealed, ironSessionOptions.cookieOptions);
          // Continue with the request
          return response;
        } else {
          // Refresh failed, redirect to login
          const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
          const signInUrl = new URL('/login', host);
          const redirectUrl = host + request.nextUrl.pathname;
          if (redirectUrl === host + '/' || redirectUrl === host) {
            return NextResponse.redirect(signInUrl);
          } else {
            signInUrl.searchParams.set('redirect', redirectUrl);
            return NextResponse.redirect(signInUrl);
          }
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // On refresh error, redirect to login
        const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        const signInUrl = new URL('/login', host);
        return NextResponse.redirect(signInUrl);
      }
    }
  } catch (error) {
    console.error('Error unsealing session in middleware:', error);
    // On error, redirect to login
    const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const signInUrl = new URL('/login', host);
    return NextResponse.redirect(signInUrl);
  }

  if(pathname === '/') {
    const dashboardURL = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardURL)
  }


  // Add comprehensive security headers on successful pass-through
  const response = NextResponse.next()

  // Security headers
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy (adjust as needed for your app)
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https: wss: blob: data:; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none';"
  )

  return response
}

// Apply middleware to application routes (exclude Next internals and static assets)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/service-worker|api|static|images).*)'],
}