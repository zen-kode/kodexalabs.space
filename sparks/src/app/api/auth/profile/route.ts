import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, updateProfile } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { sanitizeInput, validatePassword } from '@/lib/security-utils'
import { securityConfig } from '@/config/security'

// GET user profile
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

    // Get current user
    const { user, error } = await getCurrentUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return user profile (excluding sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
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

    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, user_metadata } = body

    const updates: any = {}

    // Handle email update
    if (email && email !== user.email) {
      const sanitizedEmail = sanitizeInput(email)
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      updates.email = sanitizedEmail
    }

    // Handle password update
    if (password) {
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
      
      updates.password = password
    }

    // Handle metadata update
    if (user_metadata) {
      // Sanitize metadata values
      const sanitizedMetadata: any = {}
      for (const [key, value] of Object.entries(user_metadata)) {
        if (typeof value === 'string') {
          sanitizedMetadata[key] = sanitizeInput(value)
        } else {
          sanitizedMetadata[key] = value
        }
      }
      
      updates.data = {
        ...user.user_metadata,
        ...sanitizedMetadata
      }
    }

    // If no updates, return current user
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to update',
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          user_metadata: user.user_metadata
        }
      })
    }

    // Attempt profile update
    const result = await updateProfile(updates)

    if (result.error) {
      console.error('Profile update error:', {
        userId: user.id,
        error: result.error.message,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { error: 'Profile update failed' },
        { status: 400 }
      )
    }

    // Log successful update
    console.info('Profile updated:', {
      userId: user.id,
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    })

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
        email_confirmed_at: result.data?.user?.email_confirmed_at,
        created_at: result.data?.user?.created_at,
        updated_at: result.data?.user?.updated_at,
        user_metadata: result.data?.user?.user_metadata
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}