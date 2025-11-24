import { NextRequest, NextResponse } from 'next/server'
import { sessionOptions } from '@/lib/sessionLib'

// Public routes that don't require a session
const PUBLIC_PATHS = ['/login','/signout','/civil.webp', '/forgot-password', '/favicon.ico', '/images', '/android', '/ios', '/windows11', '/service-worker.js', '/manifest.webmanifest', '/api/firebase-messaging-config', '/firebase-messaging-sw.js','/logo.png']

// Cookie name used by iron-session (defined in sessionLib)
const SESSION_COOKIE_NAME = sessionOptions.cookieName || 'auth-token'

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

  // Check presence of session cookie. Middleware runs at edge; avoid heavy session decoding here.
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!cookie) {
    // No session cookie — redirect to signin with original url as redirect param
    const host = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const signInUrl = new URL('/login', host)

    const redirectUrl = host + request.nextUrl.pathname
    // If the redirect URL contains the main domain (root), don't set redirect parameter, just go to signin
    if (redirectUrl === host + '/' || redirectUrl === host) {
      return NextResponse.redirect(signInUrl)
    } else {
      signInUrl.searchParams.set('redirect', redirectUrl)
      return NextResponse.redirect(signInUrl)
    }
  }

  if(pathname === '/') {
    const dashboardURL = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardURL)
  }


  // Add security headers on successful pass-through
  const response = NextResponse.next()
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'same-origin')

  return response
}

// Apply middleware to application routes (exclude Next internals and static assets)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/service-worker|api|static|images).*)'],
}