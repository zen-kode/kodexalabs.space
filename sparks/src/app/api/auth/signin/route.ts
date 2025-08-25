import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { validatePassword, sanitizeInput } from '@/lib/security-utils'
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
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email)
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Attempt sign in
    const result = await signIn(sanitizedEmail, password)

    if (result.error) {
      // Log failed attempt (without sensitive data)
      console.warn('Failed sign-in attempt:', {
        email: sanitizedEmail,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      user: result.data?.user,
      session: result.data?.session
    })

  } catch (error) {
    console.error('Sign-in error:', error)
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