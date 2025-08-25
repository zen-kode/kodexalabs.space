/**
 * Security Utilities for SPARKS Application
 * 
 * Provides encryption, hashing, and other security-related utility functions.
 */

import crypto from 'crypto'
import { SECURITY_CONFIG } from '@/config/security'

/**
 * Encryption utilities using AES-256-GCM
 */
export class EncryptionUtils {
  private static readonly algorithm = SECURITY_CONFIG.encryption.algorithm
  private static readonly keyLength = SECURITY_CONFIG.encryption.keyLength
  private static readonly ivLength = SECURITY_CONFIG.encryption.ivLength
  private static readonly tagLength = SECURITY_CONFIG.encryption.tagLength

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string, key: string): {
    encrypted: string
    iv: string
    tag: string
  } {
    try {
      // Ensure key is the correct length
      const keyBuffer = this.deriveKey(key)
      
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength)
      
      // Create cipher with proper GCM mode
      const cipher = crypto.createCipher(this.algorithm, keyBuffer, iv)
      cipher.setAAD(Buffer.from('sparks-app', 'utf8'))
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Get authentication tag
      const tag = cipher.getAuthTag()
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      throw new Error('Encryption failed: ' + (error as Error).message)
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: {
    encrypted: string
    iv: string
    tag: string
  }, key: string): string {
    try {
      // Ensure key is the correct length
      const keyBuffer = this.deriveKey(key)
      
      // Convert hex strings back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')
      
      // Create decipher with proper GCM mode
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer, iv)
      decipher.setAAD(Buffer.from('sparks-app', 'utf8'))
      decipher.setAuthTag(tag)
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error('Decryption failed: ' + (error as Error).message)
    }
  }

  /**
   * Derive a key of the correct length from a password
   */
  private static deriveKey(password: string): Buffer {
    return crypto.pbkdf2Sync(
      password,
      'sparks-salt', // In production, use a random salt stored securely
      100000, // iterations
      this.keyLength,
      'sha256'
    )
  }
}

/**
 * Hashing utilities for passwords and sensitive data
 */
export class HashUtils {
  /**
   * Hash a password using bcrypt-like algorithm
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // Generate salt
      const salt = crypto.randomBytes(16).toString('hex')
      
      // Hash password with salt
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
      
      // Return salt + hash
      return `${salt}:${hash}`
    } catch (error) {
      throw new Error('Password hashing failed: ' + (error as Error).message)
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split(':')
      
      if (!salt || !hash) {
        return false
      }
      
      // Hash the provided password with the stored salt
      const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
      
      // Compare hashes using timing-safe comparison
      return this.timingSafeEqual(hash, verifyHash)
    } catch (error) {
      return false
    }
  }

  /**
   * Generate a secure hash for data integrity
   */
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex')
  }

  /**
   * Generate HMAC for message authentication
   */
  static generateHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex')
  }

  /**
   * Verify HMAC
   */
  static verifyHMAC(data: string, secret: string, signature: string, algorithm: string = 'sha256'): boolean {
    const expectedSignature = this.generateHMAC(data, secret, algorithm)
    return this.timingSafeEqual(signature, expectedSignature)
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

/**
 * Token generation and validation utilities
 */
export class TokenUtils {
  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate a JWT-like token (simplified)
   */
  static generateJWT(payload: object, secret: string, expiresIn: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
    
    const signature = HashUtils.generateHMAC(
      `${encodedHeader}.${encodedPayload}`,
      secret,
      'sha256'
    )
    const encodedSignature = Buffer.from(signature, 'hex').toString('base64url')

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
  }

  /**
   * Verify and decode a JWT-like token
   */
  static verifyJWT(token: string, secret: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' }
      }

      const [encodedHeader, encodedPayload, encodedSignature] = parts
      
      // Verify signature
      const expectedSignature = HashUtils.generateHMAC(
        `${encodedHeader}.${encodedPayload}`,
        secret,
        'sha256'
      )
      const expectedEncodedSignature = Buffer.from(expectedSignature, 'hex').toString('base64url')
      
      if (!HashUtils.verifyHMAC(
        `${encodedHeader}.${encodedPayload}`,
        secret,
        Buffer.from(encodedSignature, 'base64url').toString('hex')
      )) {
        return { valid: false, error: 'Invalid signature' }
      }

      // Decode payload
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expired' }
      }

      return { valid: true, payload }
    } catch (error) {
      return { valid: false, error: 'Token verification failed' }
    }
  }

  /**
   * Generate a CSRF token
   */
  static generateCSRFToken(): string {
    return this.generateSecureToken(SECURITY_CONFIG.csrf.tokenLength)
  }

  /**
   * Generate OAuth state parameter
   */
  static generateOAuthState(): string {
    return this.generateSecureToken(SECURITY_CONFIG.oauth.stateLength)
  }

  /**
   * Generate OAuth nonce parameter
   */
  static generateOAuthNonce(): string {
    return this.generateSecureToken(SECURITY_CONFIG.oauth.nonceLength)
  }
}

/**
 * Input validation and sanitization utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Validate and sanitize user input
   */
  static sanitizeUserInput(input: string, options: {
    maxLength?: number
    allowHTML?: boolean
    trimWhitespace?: boolean
  } = {}): string {
    const {
      maxLength = 1000,
      allowHTML = false,
      trimWhitespace = true
    } = options

    let sanitized = input

    if (trimWhitespace) {
      sanitized = sanitized.trim()
    }

    if (!allowHTML) {
      sanitized = this.sanitizeHTML(sanitized)
    }

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
  }

  /**
   * Check for suspicious patterns in input
   */
  static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(input))
  }
}

/**
 * Security monitoring utilities
 */
export class SecurityMonitor {
  private static securityEvents: Array<{
    timestamp: Date
    type: string
    details: any
    severity: 'low' | 'medium' | 'high' | 'critical'
  }> = []

  /**
   * Log a security event
   */
  static logSecurityEvent(
    type: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const event = {
      timestamp: new Date(),
      type,
      details,
      severity
    }

    this.securityEvents.push(event)

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      console.warn('Security Event:', event)
      // TODO: Send to external logging service
    }

    // Keep only recent events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-500)
    }
  }

  /**
   * Get recent security events
   */
  static getRecentEvents(limit: number = 100): typeof SecurityMonitor.securityEvents {
    return this.securityEvents.slice(-limit)
  }

  /**
   * Check for suspicious activity patterns
   */
  static detectSuspiciousActivity(userId?: string, ip?: string): boolean {
    const recentEvents = this.getRecentEvents(50)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Filter events from the last hour
    const recentSuspiciousEvents = recentEvents.filter(event => 
      event.timestamp > oneHourAgo &&
      (event.severity === 'high' || event.severity === 'critical') &&
      (userId ? event.details.userId === userId : true) &&
      (ip ? event.details.ip === ip : true)
    )

    return recentSuspiciousEvents.length > 5
  }
}