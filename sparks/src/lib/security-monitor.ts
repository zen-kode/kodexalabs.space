import { NextRequest } from 'next/server'
import { securityConfig } from '@/config/security'

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SIGNUP_SUCCESS = 'signup_success',
  SIGNUP_FAILURE = 'signup_failure',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  PASSWORD_CHANGE = 'password_change',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  
  // Security violations
  CSRF_VIOLATION = 'csrf_violation',
  INVALID_TOKEN = 'invalid_token',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  
  // Access control
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  FORBIDDEN_ACCESS = 'forbidden_access',
  
  // Data events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT = 'data_export',
  
  // System events
  SECURITY_CONFIG_CHANGE = 'security_config_change',
  ADMIN_ACTION = 'admin_action'
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  timestamp: Date
  userId?: string
  sessionId?: string
  ip: string
  userAgent: string
  endpoint: string
  method: string
  details: Record<string, any>
  metadata?: Record<string, any>
}

// Threat detection patterns
interface ThreatPattern {
  name: string
  description: string
  pattern: RegExp | ((event: SecurityEvent) => boolean)
  severity: SecuritySeverity
  action: 'log' | 'alert' | 'block'
}

// Built-in threat patterns
const THREAT_PATTERNS: ThreatPattern[] = [
  {
    name: 'SQL Injection Attempt',
    description: 'Potential SQL injection in request parameters',
    pattern: /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    severity: SecuritySeverity.HIGH,
    action: 'alert'
  },
  {
    name: 'XSS Attempt',
    description: 'Potential cross-site scripting attempt',
    pattern: /<script[^>]*>.*?<\/script>/gi,
    severity: SecuritySeverity.HIGH,
    action: 'alert'
  },
  {
    name: 'Path Traversal',
    description: 'Potential directory traversal attempt',
    pattern: /\.\.[\/\\]/,
    severity: SecuritySeverity.MEDIUM,
    action: 'log'
  },
  {
    name: 'Brute Force Login',
    description: 'Multiple failed login attempts from same IP',
    pattern: (event: SecurityEvent) => {
      return event.type === SecurityEventType.LOGIN_FAILURE
    },
    severity: SecuritySeverity.HIGH,
    action: 'alert'
  },
  {
    name: 'Suspicious User Agent',
    description: 'Suspicious or automated user agent detected',
    pattern: /(bot|crawler|spider|scraper|curl|wget|python|java)/i,
    severity: SecuritySeverity.LOW,
    action: 'log'
  }
]

// In-memory event store (use database in production)
const eventStore: SecurityEvent[] = []
const MAX_EVENTS = 10000 // Keep last 10k events in memory

// Threat detection cache
const threatCache = new Map<string, { count: number; lastSeen: Date }>()

export class SecurityMonitor {
  private static instance: SecurityMonitor
  private alertCallbacks: Array<(event: SecurityEvent) => void> = []

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  // Log a security event
  async logEvent(
    type: SecurityEventType,
    request: NextRequest,
    details: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity: this.getSeverityForEventType(type),
      timestamp: new Date(),
      userId,
      sessionId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details,
      metadata: {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        acceptLanguage: request.headers.get('accept-language')
      }
    }

    // Store event
    this.storeEvent(event)

    // Check for threats
    await this.detectThreats(event)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${type}:`, {
        ip: event.ip,
        endpoint: event.endpoint,
        details: event.details
      })
    }

    return event
  }

  // Detect potential threats
  private async detectThreats(event: SecurityEvent): Promise<void> {
    for (const pattern of THREAT_PATTERNS) {
      let isMatch = false

      if (pattern.pattern instanceof RegExp) {
        // Check URL, user agent, and request details
        const checkStrings = [
          event.endpoint,
          event.userAgent,
          JSON.stringify(event.details)
        ]
        isMatch = checkStrings.some(str => pattern.pattern.test(str))
      } else if (typeof pattern.pattern === 'function') {
        isMatch = pattern.pattern(event)
      }

      if (isMatch) {
        await this.handleThreatDetection(event, pattern)
      }
    }
  }

  // Handle detected threats
  private async handleThreatDetection(
    event: SecurityEvent,
    pattern: ThreatPattern
  ): Promise<void> {
    const threatKey = `${pattern.name}:${event.ip}`
    const cached = threatCache.get(threatKey)
    const now = new Date()

    // Update threat cache
    if (cached) {
      cached.count++
      cached.lastSeen = now
    } else {
      threatCache.set(threatKey, { count: 1, lastSeen: now })
    }

    // Create threat event
    const threatEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      severity: pattern.severity,
      details: {
        ...event.details,
        threatPattern: pattern.name,
        threatDescription: pattern.description,
        threatCount: cached ? cached.count : 1
      }
    }

    this.storeEvent(threatEvent)

    // Handle based on action
    switch (pattern.action) {
      case 'alert':
        await this.sendAlert(threatEvent)
        break
      case 'block':
        // In a real implementation, you might add IP to blocklist
        await this.sendAlert(threatEvent)
        break
      case 'log':
      default:
        // Already logged above
        break
    }
  }

  // Send security alert
  private async sendAlert(event: SecurityEvent): Promise<void> {
    // Call registered alert callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(event)
      } catch (error) {
        console.error('Alert callback error:', error)
      }
    }

    // Log critical events
    if (event.severity === SecuritySeverity.CRITICAL) {
      console.error('[SECURITY ALERT]', {
        type: event.type,
        ip: event.ip,
        endpoint: event.endpoint,
        details: event.details
      })
    }
  }

  // Register alert callback
  onAlert(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback)
  }

  // Get security events
  getEvents(
    filters?: {
      type?: SecurityEventType
      severity?: SecuritySeverity
      ip?: string
      userId?: string
      since?: Date
      limit?: number
    }
  ): SecurityEvent[] {
    let events = [...eventStore]

    if (filters) {
      if (filters.type) {
        events = events.filter(e => e.type === filters.type)
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity)
      }
      if (filters.ip) {
        events = events.filter(e => e.ip === filters.ip)
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId)
      }
      if (filters.since) {
        events = events.filter(e => e.timestamp >= filters.since!)
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply limit
    if (filters?.limit) {
      events = events.slice(0, filters.limit)
    }

    return events
  }

  // Get security statistics
  getStats(since?: Date): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
    threatCount: number
  } {
    const events = since ? eventStore.filter(e => e.timestamp >= since) : eventStore

    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    const ipCounts: Record<string, number> = {}

    let threatCount = 0

    for (const event of events) {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1

      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1

      // Count by IP
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1

      // Count threats
      if (event.type === SecurityEventType.SUSPICIOUS_REQUEST) {
        threatCount++
      }
    }

    // Get top IPs
    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      threatCount
    }
  }

  // Clear old events
  cleanup(olderThan?: Date): number {
    const cutoff = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    const initialLength = eventStore.length
    
    // Remove old events
    for (let i = eventStore.length - 1; i >= 0; i--) {
      if (eventStore[i].timestamp < cutoff) {
        eventStore.splice(i, 1)
      }
    }

    // Clean threat cache
    const now = new Date()
    for (const [key, value] of threatCache.entries()) {
      if (now.getTime() - value.lastSeen.getTime() > 60 * 60 * 1000) { // 1 hour
        threatCache.delete(key)
      }
    }

    return initialLength - eventStore.length
  }

  // Helper methods
  private storeEvent(event: SecurityEvent): void {
    eventStore.push(event)

    // Keep only recent events in memory
    if (eventStore.length > MAX_EVENTS) {
      eventStore.splice(0, eventStore.length - MAX_EVENTS)
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIp) {
      return realIp
    }
    if (remoteAddr) {
      return remoteAddr
    }
    
    return 'unknown'
  }

  private getSeverityForEventType(type: SecurityEventType): SecuritySeverity {
    switch (type) {
      case SecurityEventType.LOGIN_FAILURE:
      case SecurityEventType.SIGNUP_FAILURE:
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        return SecuritySeverity.MEDIUM
      
      case SecurityEventType.CSRF_VIOLATION:
      case SecurityEventType.INVALID_TOKEN:
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
        return SecuritySeverity.HIGH
      
      case SecurityEventType.SUSPICIOUS_REQUEST:
      case SecurityEventType.SECURITY_CONFIG_CHANGE:
        return SecuritySeverity.CRITICAL
      
      default:
        return SecuritySeverity.LOW
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()

// Convenience functions
export const logSecurityEvent = (
  type: SecurityEventType,
  request: NextRequest,
  details?: Record<string, any>,
  userId?: string,
  sessionId?: string
) => securityMonitor.logEvent(type, request, details, userId, sessionId)

export const getSecurityEvents = (filters?: Parameters<typeof securityMonitor.getEvents>[0]) => 
  securityMonitor.getEvents(filters)

export const getSecurityStats = (since?: Date) => 
  securityMonitor.getStats(since)

// Auto-cleanup every hour
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    const cleaned = securityMonitor.cleanup()
    if (cleaned > 0) {
      console.log(`[SECURITY] Cleaned up ${cleaned} old security events`)
    }
  }, 60 * 60 * 1000) // 1 hour
}