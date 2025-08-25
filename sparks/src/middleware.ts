import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_CONFIG } from '@/config/security'
import { TokenUtils, ValidationUtils } from '@/lib/security-utils'
import { analyticsMiddleware } from '@/lib/analytics-middleware'
import { logger } from '@/lib/logger'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/auth/profile',
  '/api/protected'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/about',
  '/contact',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/reset-password',
  '/api/auth/session',
  '/auth/callback'
]

// Define API routes that need CSRF protection
const csrfProtectedRoutes = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/profile',
  '/api/protected'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  try {
    // 1. Handle CORS preflight requests first
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request)
    }

    // 2. Apply rate limiting
    const rateLimitResult = await handleRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // 3. Process analytics tracking
    let response: NextResponse
    if (shouldTrackAnalytics(pathname)) {
      response = await analyticsMiddleware.process(request)
    } else {
      response = NextResponse.next()
    }

    // 4. Apply security headers to all responses
    applySecurityHeaders(response)

    // 5. Handle CSRF protection for state-changing operations
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      const csrfResult = await handleCSRFProtection(request, pathname)
      if (csrfResult) {
        return csrfResult
      }
    }

    // 6. Handle authentication for protected routes
    if (isProtectedRoute(pathname)) {
      const authResult = await handleAuthentication(request)
      if (authResult) {
        return authResult
      }
    }

    // 7. Sanitize query parameters
    sanitizeQueryParams(request)

    // 8. Add CORS headers to successful responses
    addCORSHeaders(response, request)

    return response
  } catch (error) {
    logger.error('Middleware error', { error, pathname })
    
    // Return a generic error response
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

function applySecurityHeaders(response: NextResponse) {
  const headers = SECURITY_CONFIG.headers

  // Content Security Policy
  if (headers.contentSecurityPolicy.enabled) {
    response.headers.set('Content-Security-Policy', headers.contentSecurityPolicy.policy)
  }

  // X-Frame-Options
  if (headers.frameOptions.enabled) {
    response.headers.set('X-Frame-Options', headers.frameOptions.policy)
  }

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection
  if (headers.xssProtection.enabled) {
    response.headers.set('X-XSS-Protection', headers.xssProtection.policy)
  }

  // Referrer-Policy
  if (headers.referrerPolicy.enabled) {
    response.headers.set('Referrer-Policy', headers.referrerPolicy.policy)
  }

  // Permissions-Policy
  if (headers.permissionsPolicy.enabled) {
    response.headers.set('Permissions-Policy', headers.permissionsPolicy.policy)
  }

  // Strict-Transport-Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
}

async function handleCSRFProtection(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  if (!SECURITY_CONFIG.csrf.enabled || !csrfProtectedRoutes.some(route => pathname.startsWith(route))) {
    return null
  }

  const csrfToken = request.headers.get('X-CSRF-Token') || request.headers.get('x-csrf-token')
  const sessionCsrfToken = request.cookies.get('csrf-token')?.value

  if (!csrfToken || !sessionCsrfToken || csrfToken !== sessionCsrfToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return null
}

async function handleAuthentication(request: NextRequest): Promise<NextResponse | null> {
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  if (!accessToken && !refreshToken) {
    // Redirect to login page for protected routes
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For API routes, return 401 instead of redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  return null
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // requests per window
const RATE_LIMIT_API_MAX_REQUESTS = 60 // API requests per window

async function handleRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting in development unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_RATE_LIMIT !== 'true') {
    return null
  }

  const ip = getClientIP(request)
  const key = `rate_limit:${ip}`
  const now = Date.now()
  
  // Get current rate limit data
  let rateLimitData = rateLimitStore.get(key)
  
  // Reset if window has expired
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    }
  }

  // Increment request count
  rateLimitData.count++
  rateLimitStore.set(key, rateLimitData)

  // Determine rate limit based on route type
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const maxRequests = isApiRoute ? RATE_LIMIT_API_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS

  // Check if rate limit exceeded
  if (rateLimitData.count > maxRequests) {
    logger.warn('Rate limit exceeded', {
      ip,
      path: request.nextUrl.pathname,
      count: rateLimitData.count,
      maxRequests
    })

    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} requests per minute.`,
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString()
        }
      }
    )
  }

  return null
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function sanitizeQueryParams(request: NextRequest) {
  const url = request.nextUrl
  const searchParams = url.searchParams
  
  // Sanitize each query parameter
  for (const [key, value] of searchParams.entries()) {
    const sanitizedValue = ValidationUtils.sanitizeUserInput(value)
    if (sanitizedValue !== value) {
      searchParams.set(key, sanitizedValue)
    }
  }
}

function shouldTrackAnalytics(pathname: string): boolean {
  // Skip analytics for static files and internal routes
  const skipPaths = [
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health'
  ]
  
  return !skipPaths.some(path => pathname.startsWith(path))
}

function handleCORSPreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Session-ID, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  })
}

function addCORSHeaders(response: NextResponse, request: NextRequest): void {
  response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(request))
  response.headers.set('Access-Control-Allow-Credentials', 'true')
}

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://sparks-ai.vercel.app',
    process.env.NEXTAUTH_URL
  ].filter(Boolean)

  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  return allowedOrigins[0] || '*'
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || cfIP || 'unknown'
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}