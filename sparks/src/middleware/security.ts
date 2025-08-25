/**
 * Security Middleware for SPARKS Application
 * 
 * This middleware implements comprehensive security measures including:
 * - Session validation and management
 * - Security headers configuration
 * - Rate limiting and abuse prevention
 * - CSRF protection
 * - Request sanitization
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ratelimit } from '@/lib/rate-limit'

// Security configuration
const SECURITY_CONFIG = {
  // Session configuration
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // 24 hours in seconds
    cookieName: 'next-auth.session-token',
  },
  
  // Rate limiting configuration
  rateLimit: {
    requests: 100, // requests per window
    window: 60 * 1000, // 1 minute in milliseconds
  },
  
  // Protected routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/prompts',
    '/profile',
    '/settings',
    '/api/prompts',
    '/api/user',
  ],
  
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/callback',
    '/api/auth',
  ],
  
  // Admin routes that require elevated permissions
  adminRoutes: [
    '/admin',
    '/api/admin',
  ],
}

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://*.supabase.co https://*.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
  ].join(', '),
}

/**
 * Validate and sanitize session token
 */
export async function validateSession(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    if (!token) {
      return null
    }
    
    // Validate token structure
    if (!token.sub || !token.email) {
      console.warn('Invalid token structure:', { sub: !!token.sub, email: !!token.email })
      return null
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000)
    if (token.exp && token.exp < now) {
      console.warn('Token expired:', { exp: token.exp, now })
      return null
    }
    
    // Check if token was issued too long ago (additional security)
    if (token.iat && (now - token.iat) > SECURITY_CONFIG.session.maxAge) {
      console.warn('Token too old:', { iat: token.iat, now, maxAge: SECURITY_CONFIG.session.maxAge })
      return null
    }
    
    return token
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return SECURITY_CONFIG.protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Check if route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return SECURITY_CONFIG.publicRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Check if route requires admin permissions
 */
export function isAdminRoute(pathname: string): boolean {
  return SECURITY_CONFIG.adminRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add additional headers based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production-only headers
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  } else {
    // Development-only headers
    response.headers.set('X-Development-Mode', 'true')
  }
  
  return response
}

/**
 * Rate limiting implementation
 */
export async function checkRateLimit(request: NextRequest): Promise<boolean> {
  try {
    // Get client identifier (IP address or user ID)
    const identifier = getClientIdentifier(request)
    
    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
    
    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString())
    
    return success
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Allow request if rate limiting fails
    return true
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session first
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `ip:${ip}`
}

/**
 * Validate CSRF token
 */
export function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF validation for GET requests
  if (request.method === 'GET') {
    return true
  }
  
  // Check for CSRF token in header or body
  const csrfToken = request.headers.get('x-csrf-token') || 
                   request.headers.get('x-requested-with')
  
  // For API routes, require explicit CSRF protection
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return !!csrfToken
  }
  
  return true
}

/**
 * Sanitize request headers and parameters
 */
export function sanitizeRequest(request: NextRequest): NextRequest {
  // Remove potentially dangerous headers
  const dangerousHeaders = [
    'x-forwarded-host',
    'x-original-host',
    'x-rewrite-url',
  ]
  
  dangerousHeaders.forEach(header => {
    if (request.headers.has(header)) {
      console.warn(`Removed dangerous header: ${header}`)
      request.headers.delete(header)
    }
  })
  
  return request
}

/**
 * Log security events
 */
export function logSecurityEvent(
  type: 'auth_failure' | 'rate_limit' | 'csrf_failure' | 'suspicious_activity',
  request: NextRequest,
  details?: Record<string, any>
) {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent'),
    pathname: request.nextUrl.pathname,
    method: request.method,
    details,
  }
  
  console.warn('Security Event:', event)
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry, DataDog, or other monitoring service
  }
}

/**
 * Main security middleware function
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  // Sanitize request
  const sanitizedRequest = sanitizeRequest(request)
  
  // Create response
  let response = NextResponse.next()
  
  // Apply security headers
  response = applySecurityHeaders(response)
  
  // Check rate limiting
  const rateLimitPassed = await checkRateLimit(sanitizedRequest)
  if (!rateLimitPassed) {
    logSecurityEvent('rate_limit', sanitizedRequest)
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: response.headers 
    })
  }
  
  // Validate CSRF for non-GET requests
  if (!validateCSRF(sanitizedRequest)) {
    logSecurityEvent('csrf_failure', sanitizedRequest)
    return new NextResponse('CSRF Token Missing', { 
      status: 403,
      headers: response.headers 
    })
  }
  
  // Handle authentication for protected routes
  if (isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    const session = await validateSession(sanitizedRequest)
    
    if (!session) {
      logSecurityEvent('auth_failure', sanitizedRequest, { 
        reason: 'no_session',
        pathname 
      })
      
      // Redirect to sign-in page
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    // Check admin routes
    if (isAdminRoute(pathname)) {
      const isAdmin = session.role === 'admin' || session.role === 'superadmin'
      if (!isAdmin) {
        logSecurityEvent('auth_failure', sanitizedRequest, { 
          reason: 'insufficient_permissions',
          pathname,
          userRole: session.role 
        })
        
        return new NextResponse('Forbidden', { 
          status: 403,
          headers: response.headers 
        })
      }
    }
    
    // Add user context to request headers
    response.headers.set('x-user-id', session.user?.id || '')
    response.headers.set('x-user-email', session.user?.email || '')
    response.headers.set('x-user-role', session.user?.user_metadata?.role || session.user?.app_metadata?.role || 'user')
  }
  
  return response
}

// Export configuration for testing
export { SECURITY_CONFIG, SECURITY_HEADERS }