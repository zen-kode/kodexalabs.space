import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { securityConfig } from '@/config/security'
import { generateSecureToken, hashPassword, verifyPassword } from './security-utils'
import { rateLimiter } from './rate-limit'

// Auth types
export type { User, Session, AuthError }

// Enhanced auth types
export interface SecureSession extends Session {
  csrfToken?: string
  lastActivity?: number
  ipAddress?: string
}

export interface AuthResult {
  user?: User | null
  session?: SecureSession | null
  error?: AuthError | null
  rateLimited?: boolean
}

// Session validation
export const validateSession = async (session: Session | null): Promise<boolean> => {
  if (!session) return false
  
  const now = Date.now()
  const sessionAge = now - new Date(session.expires_at || 0).getTime()
  
  // Check if session is expired
  if (sessionAge > securityConfig.session.maxAge) {
    await signOut()
    return false
  }
  
  // Check if session needs refresh
  if (sessionAge > securityConfig.session.refreshThreshold) {
    const { error } = await supabase.auth.refreshSession()
    if (error) {
      await signOut()
      return false
    }
  }
  
  return true
}

// Sign up with email and password (with rate limiting and validation)
export const signUp = async (email: string, password: string, ipAddress?: string): Promise<AuthResult> => {
  // Rate limiting
  if (ipAddress) {
    const rateLimitResult = await rateLimiter.limit('auth', ipAddress)
    if (!rateLimitResult.success) {
      return { error: { message: 'Too many attempts. Please try again later.' } as AuthError, rateLimited: true }
    }
  }
  
  // Validate password strength
  const passwordValidation = securityConfig.validation.password
  if (password.length < passwordValidation.minLength) {
    return { error: { message: `Password must be at least ${passwordValidation.minLength} characters long` } as AuthError }
  }
  
  if (passwordValidation.requireUppercase && !/[A-Z]/.test(password)) {
    return { error: { message: 'Password must contain at least one uppercase letter' } as AuthError }
  }
  
  if (passwordValidation.requireLowercase && !/[a-z]/.test(password)) {
    return { error: { message: 'Password must contain at least one lowercase letter' } as AuthError }
  }
  
  if (passwordValidation.requireNumbers && !/\d/.test(password)) {
    return { error: { message: 'Password must contain at least one number' } as AuthError }
  }
  
  if (passwordValidation.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { error: { message: 'Password must contain at least one special character' } as AuthError }
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (data.session) {
    const secureSession: SecureSession = {
      ...data.session,
      csrfToken: generateSecureToken(32),
      lastActivity: Date.now(),
      ipAddress
    }
    return { user: data.user, session: secureSession, error }
  }
  
  return { user: data.user, error }
}

// Sign in with email and password (with rate limiting and security)
export const signIn = async (email: string, password: string, ipAddress?: string): Promise<AuthResult> => {
  // Rate limiting
  if (ipAddress) {
    const rateLimitResult = await rateLimiter.limit('auth', ipAddress)
    if (!rateLimitResult.success) {
      return { error: { message: 'Too many attempts. Please try again later.' } as AuthError, rateLimited: true }
    }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (data.session) {
    const secureSession: SecureSession = {
      ...data.session,
      csrfToken: generateSecureToken(32),
      lastActivity: Date.now(),
      ipAddress
    }
    return { user: data.user, session: secureSession, error }
  }
  
  return { user: data.user, error }
}

// Sign out (with session cleanup)
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  
  // Clear any client-side session data
  if (typeof window !== 'undefined') {
    // Clear localStorage/sessionStorage if used
    localStorage.removeItem('supabase.auth.token')
    sessionStorage.clear()
  }
  
  return { error }
}

// Get current user (with session validation)
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (user) {
    const { session } = await getCurrentSession()
    const isValid = await validateSession(session)
    if (!isValid) {
      return { user: null, error: { message: 'Session expired' } as AuthError }
    }
  }
  
  return { user, error }
}

// Get current session (with validation)
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (session) {
    const isValid = await validateSession(session)
    if (!isValid) {
      return { session: null, error: { message: 'Session expired' } as AuthError }
    }
    
    // Return enhanced session
    const secureSession: SecureSession = {
      ...session,
      lastActivity: Date.now()
    }
    return { session: secureSession, error }
  }
  
  return { session, error }
}

// Listen to auth changes
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Reset password (with rate limiting)
export const resetPassword = async (email: string, ipAddress?: string) => {
  // Rate limiting for password reset
  if (ipAddress) {
    const rateLimitResult = await rateLimiter.limit('password-reset', ipAddress)
    if (!rateLimitResult.success) {
      return { data: null, error: { message: 'Too many password reset attempts. Please try again later.' } as AuthError }
    }
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
  })
  return { data, error }
}

// Update password
export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password })
  return { data, error }
}

// Update user profile
export const updateProfile = async (updates: { email?: string; data?: any }) => {
  const { data, error } = await supabase.auth.updateUser(updates)
  return { data, error }
}