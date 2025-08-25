import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { rateLimiter } from '@/lib/rate-limit'
import { sanitizeInput, generateSecureToken } from '@/lib/security-utils'
import { securityConfig } from '@/config/security'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for OAuth callbacks
    const rateLimitResult = await rateLimiter.limit(
      request,
      'auth',
      securityConfig.rateLimits.auth.requests
    )

    if (!rateLimitResult.success) {
      console.warn('Rate limit exceeded for OAuth callback:', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(new URL('/login?error=rate_limit', request.url))
    }

    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // Sanitize the next parameter to prevent open redirects
    let next = requestUrl.searchParams.get('next') ?? '/dashboard'
    next = sanitizeInput(next)
    
    // Validate redirect URL to prevent open redirect attacks
    const allowedRedirects = ['/dashboard', '/profile', '/settings', '/playground']
    if (!allowedRedirects.includes(next) && !next.startsWith('/')) {
      next = '/dashboard'
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', {
        error,
        errorDescription,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      
      const errorParam = error === 'access_denied' ? 'oauth_cancelled' : 'oauth_error'
      return NextResponse.redirect(new URL(`/login?error=${errorParam}`, requestUrl.origin))
    }

    // Validate state parameter for CSRF protection
    if (state) {
      // In a production app, you would validate the state parameter
      // against a stored value to prevent CSRF attacks
      console.info('OAuth callback with state:', {
        state: state.substring(0, 8) + '...', // Log only first 8 chars for security
        timestamp: new Date().toISOString()
      })
    }

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          throw exchangeError
        }

        // Log successful OAuth authentication
        console.info('OAuth authentication successful:', {
          userId: data.user?.id,
          email: data.user?.email,
          provider: data.user?.app_metadata?.provider,
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        })

        // Generate CSRF token for the session
        const csrfToken = generateSecureToken(32)
        
        // Create response with security headers
        const response = NextResponse.redirect(new URL(next, requestUrl.origin))
        
        // Set secure session cookie
        response.cookies.set('csrf-token', csrfToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: securityConfig.session.maxAge,
          path: '/'
        })

        return response
        
      } catch (error) {
        console.error('Error exchanging code for session:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        })
        
        return NextResponse.redirect(new URL('/login?error=oauth_error', requestUrl.origin))
      }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_error', new URL(request.url).origin))
  }
}