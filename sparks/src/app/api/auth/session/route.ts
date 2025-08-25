import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentSession } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { securityConfig } from '@/config/security'

// GET current session status
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.limit(
      request,
      'api',
      securityConfig.rateLimits.api.requests
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    // Get current user and session
    const [userResult, sessionResult] = await Promise.all([
      getCurrentUser(),
      getCurrentSession()
    ])

    const { user, error: userError } = userResult
    const { session, error: sessionError } = sessionResult

    // Check for authentication errors
    if (userError || sessionError || !user || !session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        session: null
      })
    }

    // Check session expiration
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    if (expiresAt <= now) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        session: null,
        expired: true
      })
    }

    // Return authenticated session info
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      },
      session: {
        access_token: session.access_token ? '[REDACTED]' : null,
        refresh_token: session.refresh_token ? '[REDACTED]' : null,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type
      },
      expiresIn: expiresAt - now
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        user: null,
        session: null,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// POST refresh session
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.limit(
      request,
      'auth',
      securityConfig.rateLimits.auth.requests
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    // Get current session
    const { session, error } = await getCurrentSession()

    if (error || !session) {
      return NextResponse.json(
        { error: 'No active session to refresh' },
        { status: 401 }
      )
    }

    // Session refresh is handled automatically by Supabase
    // This endpoint mainly validates the current session
    const { user: currentUser } = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session refresh failed' },
        { status: 401 }
      )
    }

    // Log session refresh
    console.info('Session refreshed:', {
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      user: {
        id: currentUser.id,
        email: currentUser.email,
        email_confirmed_at: currentUser.email_confirmed_at,
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at,
        user_metadata: currentUser.user_metadata
      }
    })

  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}