/**
 * Main Middleware for SPARKS Application
 * 
 * This middleware integrates NextAuth.js authentication with custom security measures
 * including rate limiting, CSRF protection, and security headers.
 */

import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware } from '@/middleware/security'

/**
 * Main middleware function that combines NextAuth with security middleware
 */
export default withAuth(
  async function middleware(req: NextRequest) {
    try {
      // Apply security middleware first
      const securityResponse = await securityMiddleware(req)
      
      // If security middleware returns an error response, return it immediately
      if (securityResponse.status !== 200) {
        return securityResponse
      }
      
      // Continue with normal request processing
      return NextResponse.next({
        headers: securityResponse.headers
      })
    } catch (error) {
      console.error('Middleware error:', error)
      
      // Return error response with security headers
      const errorResponse = new NextResponse('Internal Server Error', { status: 500 })
      
      // Apply basic security headers even on error
      errorResponse.headers.set('X-Frame-Options', 'DENY')
      errorResponse.headers.set('X-Content-Type-Options', 'nosniff')
      errorResponse.headers.set('X-XSS-Protection', '1; mode=block')
      
      return errorResponse
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow access to public routes
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/auth/callback',
          '/api/auth',
          '/_next',
          '/favicon.ico',
        ]
        
        // Check if current path is public
        const isPublicRoute = publicRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        if (isPublicRoute) {
          return true
        }
        
        // For protected routes, require authentication
        const protectedRoutes = [
          '/dashboard',
          '/prompts',
          '/profile',
          '/settings',
          '/api/prompts',
          '/api/user',
        ]
        
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        if (isProtectedRoute) {
          return !!token
        }
        
        // Admin routes require admin role
        const adminRoutes = [
          '/admin',
          '/api/admin',
        ]
        
        const isAdminRoute = adminRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        if (isAdminRoute) {
          return !!token && (token.role === 'admin' || token.role === 'superadmin')
        }
        
        // Default: allow access
        return true
      }
    }
  }
)

/**
 * Middleware configuration
 * 
 * This matcher ensures the middleware runs on all routes except:
 * - API routes that handle their own authentication
 * - Static files
 * - Next.js internal files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}