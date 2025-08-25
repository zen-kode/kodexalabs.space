/**
 * Security Configuration for SPARKS Application
 * 
 * Centralized security settings and constants used throughout the application.
 */

export const SECURITY_CONFIG = {
  // Session Configuration
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60,   // 24 hours in seconds
    strategy: 'jwt' as const,
    cookieName: 'sparks-session',
    secureCookie: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },

  // Rate Limiting Configuration
  rateLimit: {
    // API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,                  // requests per window
      message: 'Too many API requests, please try again later.',
    },
    
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,                    // login attempts per window
      message: 'Too many authentication attempts, please try again later.',
    },
    
    // AI/Prompt generation endpoints
    ai: {
      windowMs: 60 * 1000,      // 1 minute
      max: 10,                   // AI requests per minute
      message: 'Too many AI requests, please wait before trying again.',
    },
    
    // File upload endpoints
    upload: {
      windowMs: 60 * 1000,      // 1 minute
      max: 5,                    // uploads per minute
      message: 'Too many upload attempts, please wait before trying again.',
    },
    
    // Password reset endpoints
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,                    // password reset attempts per hour
      message: 'Too many password reset attempts, please try again later.',
    },
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    tokenLength: 32,
    cookieName: 'sparks-csrf-token',
    headerName: 'x-csrf-token',
    excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
    excludedPaths: [
      '/api/auth',
      '/api/webhooks',
    ],
  },

  // Security Headers
  headers: {
    // Content Security Policy
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'",   // Required for development
        'https://vercel.live',
        'https://va.vercel-scripts.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        'https://fonts.googleapis.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      'connect-src': [
        "'self'",
        'https://api.openai.com',
        'https://generativelanguage.googleapis.com',
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      ].filter(Boolean),
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    },

    // Other Security Headers
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      'payment': [],
    },
  },

  // Input Validation
  validation: {
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    maxFieldSize: 1024 * 1024,        // 1MB
    maxFields: 100,
    maxFiles: 10,
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/json',
    ],
    sanitization: {
      stripTags: true,
      trimWhitespace: true,
      normalizeUnicode: true,
    },
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  // Password Requirements
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // OAuth Security
  oauth: {
    stateLength: 32,
    nonceLength: 32,
    pkceCodeLength: 128,
    maxAge: 10 * 60, // 10 minutes
  },

  // Monitoring and Logging
  monitoring: {
    logSecurityEvents: true,
    logFailedAttempts: true,
    logSuspiciousActivity: true,
    alertThresholds: {
      failedLogins: 10,
      rateLimitHits: 50,
      suspiciousRequests: 25,
    },
  },
} as const

/**
 * Environment-specific security overrides
 */
export const getSecurityConfig = () => {
  const config = { ...SECURITY_CONFIG }
  
  // Development environment adjustments
  if (process.env.NODE_ENV === 'development') {
    // Relax CSP for development
    config.headers.contentSecurityPolicy['script-src'].push(
      "'unsafe-eval'",
      'http://localhost:*'
    )
    config.headers.contentSecurityPolicy['connect-src'].push(
      'http://localhost:*',
      'ws://localhost:*'
    )
    
    // Disable secure cookie requirement
    config.session.secureCookie = false
  }
  
  // Production environment adjustments
  if (process.env.NODE_ENV === 'production') {
    // Stricter rate limits
    config.rateLimit.api.max = 50
    config.rateLimit.auth.max = 3
    config.rateLimit.ai.max = 5
    
    // Enable all security features
    config.csrf.enabled = true
    config.session.secureCookie = true
  }
  
  return config
}

/**
 * Security utility functions
 */
export const SecurityUtils = {
  /**
   * Generate a secure random string
   */
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const randomArray = new Uint8Array(length)
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomArray)
      for (let i = 0; i < length; i++) {
        result += chars[randomArray[i] % chars.length]
      }
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
    }
    
    return result
  },

  /**
   * Validate password strength
   */
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const config = SECURITY_CONFIG.password
    
    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`)
    }
    
    if (password.length > config.maxLength) {
      errors.push(`Password must be no more than ${config.maxLength} characters long`)
    }
    
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * Sanitize user input
   */
  sanitizeInput: (input: string): string => {
    const config = SECURITY_CONFIG.validation.sanitization
    let sanitized = input
    
    if (config.trimWhitespace) {
      sanitized = sanitized.trim()
    }
    
    if (config.stripTags) {
      sanitized = sanitized.replace(/<[^>]*>/g, '')
    }
    
    if (config.normalizeUnicode) {
      sanitized = sanitized.normalize('NFC')
    }
    
    return sanitized
  },

  /**
   * Check if request is from a trusted origin
   */
  isTrustedOrigin: (origin: string): boolean => {
    const trustedOrigins = [
      process.env.NEXTAUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'https://localhost:3000',
    ].filter(Boolean)
    
    return trustedOrigins.includes(origin)
  },
}