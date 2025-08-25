import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { securityConfig } from '@/config/security'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for authentication
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

    // Attempt sign out
    const result = await signOut()

    if (result.error) {
      console.error('Sign-out error:', result.error)
      return NextResponse.json(
        { error: 'Sign-out failed' },
        { status: 500 }
      )
    }

    // Success response with security headers
    const response = NextResponse.json({
      success: true,
      message: 'Successfully signed out'
    })

    // Clear any authentication cookies
    response.cookies.set('sb-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Sign-out error:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}