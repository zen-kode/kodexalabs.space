import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
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
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, confirmPassword } = body

    // Input validation
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, password, and password confirmation are required' },
        { status: 400 }
      )
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
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
          details: passwordValidation.errors,
          requirements: {
            minLength: securityConfig.password.minLength,
            requireUppercase: securityConfig.password.requireUppercase,
            requireLowercase: securityConfig.password.requireLowercase,
            requireNumbers: securityConfig.password.requireNumbers,
            requireSpecialChars: securityConfig.password.requireSpecialChars
          }
        },
        { status: 400 }
      )
    }

    // Attempt sign up
    const result = await signUp(sanitizedEmail, password)

    if (result.error) {
      // Log failed attempt (without sensitive data)
      console.warn('Failed sign-up attempt:', {
        email: sanitizedEmail,
        error: result.error.message,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })

      // Handle specific error cases
      if (result.error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 400 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: result.data?.user
    })

  } catch (error) {
    console.error('Sign-up error:', error)
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