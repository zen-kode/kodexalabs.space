import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/security-utils'
import { securityConfig } from '@/config/security'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for password reset (more restrictive)
    const rateLimitResult = await rateLimiter.limit(
      request,
      'passwordReset',
      securityConfig.rateLimits.passwordReset.requests
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    // Input validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedEmail = sanitizeInput(email)
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Attempt password reset
    const result = await resetPassword(sanitizedEmail)

    // Always return success to prevent email enumeration attacks
    // Even if the email doesn't exist, we return success
    if (result.error && !result.error.message.includes('not found')) {
      console.error('Password reset error:', {
        email: sanitizedEmail,
        error: result.error.message,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
    }

    // Log successful password reset request
    console.info('Password reset requested:', {
      email: sanitizedEmail,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Always return success response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
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