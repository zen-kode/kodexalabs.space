/**
 * Rate Limiting Implementation for SPARKS Application
 * 
 * This module provides rate limiting functionality using Redis or in-memory storage
 * to prevent abuse and ensure fair usage of the application.
 */

import { Redis } from '@upstash/redis'

// Rate limit configuration
interface RateLimitConfig {
  requests: number // Number of requests allowed
  window: number   // Time window in milliseconds
  prefix?: string  // Key prefix for storage
}

// Rate limit result
interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Default configurations for different endpoints
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // General API rate limiting
  api: {
    requests: 100,
    window: 60 * 1000, // 1 minute
    prefix: 'rl:api',
  },
  
  // Authentication endpoints (more restrictive)
  auth: {
    requests: 10,
    window: 60 * 1000, // 1 minute
    prefix: 'rl:auth',
  },
  
  // AI/Prompt generation (very restrictive)
  ai: {
    requests: 20,
    window: 60 * 1000, // 1 minute
    prefix: 'rl:ai',
  },
  
  // File uploads
  upload: {
    requests: 5,
    window: 60 * 1000, // 1 minute
    prefix: 'rl:upload',
  },
  
  // Password reset attempts
  password: {
    requests: 3,
    window: 15 * 60 * 1000, // 15 minutes
    prefix: 'rl:password',
  },
}

/**
 * Redis-based rate limiter (for production)
 */
class RedisRateLimiter {
  private redis: Redis
  
  constructor() {
    // Initialize Redis client
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  
  async limit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIGS.api
  ): Promise<RateLimitResult> {
    const key = `${config.prefix || 'rl'}:${identifier}`
    const window = Math.floor(Date.now() / config.window)
    const windowKey = `${key}:${window}`
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      pipeline.incr(windowKey)
      pipeline.expire(windowKey, Math.ceil(config.window / 1000))
      
      const results = await pipeline.exec()
      const count = results[0] as number
      
      const remaining = Math.max(0, config.requests - count)
      const reset = (window + 1) * config.window
      
      return {
        success: count <= config.requests,
        limit: config.requests,
        remaining,
        reset,
        retryAfter: count > config.requests ? Math.ceil(config.window / 1000) : undefined,
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fail open - allow request if Redis is unavailable
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests,
        reset: Date.now() + config.window,
      }
    }
  }
  
  async reset(identifier: string, config: RateLimitConfig = DEFAULT_CONFIGS.api): Promise<void> {
    const key = `${config.prefix || 'rl'}:${identifier}`
    const pattern = `${key}:*`
    
    try {
      // Get all keys matching the pattern
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis rate limit reset error:', error)
    }
  }
  
  async getStatus(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIGS.api
  ): Promise<RateLimitResult | null> {
    const key = `${config.prefix || 'rl'}:${identifier}`
    const window = Math.floor(Date.now() / config.window)
    const windowKey = `${key}:${window}`
    
    try {
      const count = await this.redis.get(windowKey) || 0
      const remaining = Math.max(0, config.requests - Number(count))
      const reset = (window + 1) * config.window
      
      return {
        success: Number(count) <= config.requests,
        limit: config.requests,
        remaining,
        reset,
      }
    } catch (error) {
      console.error('Redis rate limit status error:', error)
      return null
    }
  }
}

/**
 * In-memory rate limiter (for development)
 */
class MemoryRateLimiter {
  private store = new Map<string, { count: number; reset: number }>()
  
  async limit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIGS.api
  ): Promise<RateLimitResult> {
    const key = `${config.prefix || 'rl'}:${identifier}`
    const now = Date.now()
    const window = Math.floor(now / config.window)
    const windowKey = `${key}:${window}`
    
    // Clean up expired entries
    this.cleanup()
    
    const entry = this.store.get(windowKey)
    const reset = (window + 1) * config.window
    
    if (!entry) {
      // First request in this window
      this.store.set(windowKey, { count: 1, reset })
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - 1,
        reset,
      }
    }
    
    // Increment count
    entry.count++
    const remaining = Math.max(0, config.requests - entry.count)
    
    return {
      success: entry.count <= config.requests,
      limit: config.requests,
      remaining,
      reset,
      retryAfter: entry.count > config.requests ? Math.ceil(config.window / 1000) : undefined,
    }
  }
  
  async reset(identifier: string, config: RateLimitConfig = DEFAULT_CONFIGS.api): Promise<void> {
    const prefix = `${config.prefix || 'rl'}:${identifier}:`
    
    // Remove all entries for this identifier
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }
  
  async getStatus(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIGS.api
  ): Promise<RateLimitResult | null> {
    const key = `${config.prefix || 'rl'}:${identifier}`
    const window = Math.floor(Date.now() / config.window)
    const windowKey = `${key}:${window}`
    
    const entry = this.store.get(windowKey)
    const reset = (window + 1) * config.window
    
    if (!entry) {
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests,
        reset,
      }
    }
    
    const remaining = Math.max(0, config.requests - entry.count)
    
    return {
      success: entry.count <= config.requests,
      limit: config.requests,
      remaining,
      reset,
    }
  }
  
  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.reset < now) {
        this.store.delete(key)
      }
    }
  }
}

/**
 * Rate limiter factory
 */
function createRateLimiter() {
  // Use Redis in production if available
  if (process.env.NODE_ENV === 'production' && 
      process.env.UPSTASH_REDIS_REST_URL && 
      process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new RedisRateLimiter()
  }
  
  // Fall back to memory-based rate limiter
  console.warn('Using in-memory rate limiter. Consider using Redis for production.')
  return new MemoryRateLimiter()
}

// Create singleton instance
const rateLimiter = createRateLimiter()

/**
 * Main rate limiting function
 */
export async function rateLimit(
  identifier: string,
  type: keyof typeof DEFAULT_CONFIGS = 'api'
): Promise<RateLimitResult> {
  const config = DEFAULT_CONFIGS[type]
  return rateLimiter.limit(identifier, config)
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(
  identifier: string,
  type: keyof typeof DEFAULT_CONFIGS = 'api'
): Promise<void> {
  const config = DEFAULT_CONFIGS[type]
  return rateLimiter.reset(identifier, config)
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  type: keyof typeof DEFAULT_CONFIGS = 'api'
): Promise<RateLimitResult | null> {
  const config = DEFAULT_CONFIGS[type]
  return rateLimiter.getStatus(identifier, config)
}

/**
 * Custom rate limit with specific configuration
 */
export async function customRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimiter.limit(identifier, config)
}

/**
 * Rate limit middleware helper
 */
export function createRateLimitMiddleware(
  type: keyof typeof DEFAULT_CONFIGS = 'api'
) {
  return async (identifier: string) => {
    const result = await rateLimit(identifier, type)
    
    if (!result.success) {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      ;(error as any).retryAfter = result.retryAfter
      ;(error as any).rateLimit = result
      throw error
    }
    
    return result
  }
}

/**
 * Express.js middleware (if needed)
 */
export function expressRateLimit(
  type: keyof typeof DEFAULT_CONFIGS = 'api'
) {
  return async (req: any, res: any, next: any) => {
    try {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown'
      const result = await rateLimit(identifier, type)
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      })
      
      if (!result.success) {
        if (result.retryAfter) {
          res.set('Retry-After', result.retryAfter.toString())
        }
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        })
      }
      
      next()
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // Fail open - allow request if rate limiting fails
      next()
    }
  }
}

// Export the rate limiter instance for direct use
export const ratelimit = rateLimiter

// Export configurations
export { DEFAULT_CONFIGS as RATE_LIMIT_CONFIGS }
export type { RateLimitConfig, RateLimitResult }

// NextJS-compatible rate limiter wrapper
import { NextRequest } from 'next/server'

export class RateLimiter {
  private getClientId(request: NextRequest): string {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    
    let ip = 'unknown'
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = forwarded.split(',')[0].trim()
    } else if (realIp) {
      ip = realIp
    } else if (remoteAddr) {
      ip = remoteAddr
    }
    
    // For authenticated users, also include user agent for better identification
    const userAgent = request.headers.get('user-agent') || ''
    const userAgentHash = this.simpleHash(userAgent)
    
    return `${ip}:${userAgentHash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async limit(
    request: NextRequest,
    type: keyof typeof DEFAULT_CONFIGS,
    customLimit?: number
  ): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    const clientId = this.getClientId(request)
    const config = DEFAULT_CONFIGS[type]
    
    // Use custom limit if provided
    const effectiveConfig = customLimit ? { ...config, requests: customLimit } : config
    
    const result = await rateLimiter.limit(clientId, effectiveConfig)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.reset,
      retryAfter: result.retryAfter
    }
  }

  async limitAPI(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    return this.limit(request, 'api')
  }

  async limitAuth(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    return this.limit(request, 'auth')
  }

  async limitAI(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    return this.limit(request, 'ai')
  }

  async limitUpload(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    return this.limit(request, 'upload')
  }

  async limitPasswordReset(request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number; retryAfter?: number }> {
    return this.limit(request, 'password')
  }
}

// Export singleton instance for NextJS routes
export const rateLimiter = new RateLimiter()