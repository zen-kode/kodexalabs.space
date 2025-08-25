import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { securityMonitor, SecurityEventType, SecuritySeverity } from '@/lib/security-monitor'
import { securityConfig } from '@/config/security'

// GET security dashboard data
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.limitAPI(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    // Check authentication
    const { user, error: authError } = await getCurrentUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges (you may want to implement proper role checking)
    const isAdmin = user.user_metadata?.role === 'admin' || user.email === process.env.ADMIN_EMAIL
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = request.nextUrl
    const timeRange = searchParams.get('timeRange') || '24h'
    const eventType = searchParams.get('eventType') as SecurityEventType | null
    const severity = searchParams.get('severity') as SecuritySeverity | null
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate time range
    const now = new Date()
    let since: Date
    switch (timeRange) {
      case '1h':
        since = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        since = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Get security events
    const events = securityMonitor.getEvents({
      type: eventType || undefined,
      severity: severity || undefined,
      since,
      limit
    })

    // Get security statistics
    const stats = securityMonitor.getStats(since)

    // Get system health metrics
    const systemHealth = {
      rateLimitingEnabled: securityConfig.rateLimits.api.requests > 0,
      csrfProtectionEnabled: securityConfig.csrf.enabled,
      securityHeadersEnabled: securityConfig.headers.contentSecurityPolicy.enabled,
      sessionSecurityEnabled: securityConfig.session.secure,
      encryptionEnabled: securityConfig.encryption.algorithm === 'aes-256-gcm',
      monitoringActive: true,
      lastCleanup: new Date().toISOString()
    }

    // Calculate threat level
    const threatLevel = calculateThreatLevel(stats)

    // Get recent critical events
    const criticalEvents = securityMonitor.getEvents({
      severity: SecuritySeverity.CRITICAL,
      since: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
      limit: 10
    })

    // Get authentication metrics
    const authMetrics = {
      successfulLogins: stats.eventsByType[SecurityEventType.LOGIN_SUCCESS] || 0,
      failedLogins: stats.eventsByType[SecurityEventType.LOGIN_FAILURE] || 0,
      signups: stats.eventsByType[SecurityEventType.SIGNUP_SUCCESS] || 0,
      passwordResets: stats.eventsByType[SecurityEventType.PASSWORD_RESET_REQUEST] || 0,
      rateLimitHits: stats.eventsByType[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0
    }

    // Calculate success rate
    const totalAuthAttempts = authMetrics.successfulLogins + authMetrics.failedLogins
    const authSuccessRate = totalAuthAttempts > 0 
      ? (authMetrics.successfulLogins / totalAuthAttempts * 100).toFixed(2)
      : '100'

    return NextResponse.json({
      success: true,
      data: {
        timeRange,
        stats: {
          ...stats,
          authMetrics,
          authSuccessRate: parseFloat(authSuccessRate),
          threatLevel
        },
        events: events.map(event => ({
          ...event,
          // Sanitize sensitive data
          details: sanitizeEventDetails(event.details)
        })),
        criticalEvents: criticalEvents.map(event => ({
          ...event,
          details: sanitizeEventDetails(event.details)
        })),
        systemHealth,
        recommendations: generateSecurityRecommendations(stats, systemHealth)
      }
    })

  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST security action (e.g., clear events, reset rate limits)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.limitAPI(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    // Check authentication
    const { user, error: authError } = await getCurrentUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin privileges
    const isAdmin = user.user_metadata?.role === 'admin' || user.email === process.env.ADMIN_EMAIL
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, params } = body

    let result: any = { success: true }

    switch (action) {
      case 'cleanup_events':
        const olderThan = params?.olderThan ? new Date(params.olderThan) : undefined
        const cleaned = securityMonitor.cleanup(olderThan)
        result.message = `Cleaned up ${cleaned} old security events`
        break

      case 'export_events':
        const exportFilters = params?.filters || {}
        const exportEvents = securityMonitor.getEvents(exportFilters)
        result.data = exportEvents
        result.message = `Exported ${exportEvents.length} security events`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log admin action
    await securityMonitor.logEvent(
      SecurityEventType.ADMIN_ACTION,
      request,
      { action, params, result: result.message },
      user.id
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('Security dashboard action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateThreatLevel(stats: any): 'low' | 'medium' | 'high' | 'critical' {
  const criticalEvents = stats.eventsBySeverity[SecuritySeverity.CRITICAL] || 0
  const highEvents = stats.eventsBySeverity[SecuritySeverity.HIGH] || 0
  const threatCount = stats.threatCount || 0
  const failedLogins = stats.eventsByType[SecurityEventType.LOGIN_FAILURE] || 0
  const rateLimitHits = stats.eventsByType[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0

  if (criticalEvents > 5 || threatCount > 10) {
    return 'critical'
  }
  if (criticalEvents > 0 || highEvents > 10 || failedLogins > 20) {
    return 'high'
  }
  if (highEvents > 0 || failedLogins > 5 || rateLimitHits > 10) {
    return 'medium'
  }
  return 'low'
}

function sanitizeEventDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential']
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  // Truncate long values
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...'
    }
  }
  
  return sanitized
}

function generateSecurityRecommendations(
  stats: any, 
  systemHealth: any
): Array<{ type: 'warning' | 'info' | 'success'; message: string }> {
  const recommendations: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = []
  
  // Check failed login rate
  const failedLogins = stats.eventsByType[SecurityEventType.LOGIN_FAILURE] || 0
  const successfulLogins = stats.eventsByType[SecurityEventType.LOGIN_SUCCESS] || 0
  const totalLogins = failedLogins + successfulLogins
  
  if (totalLogins > 0) {
    const failureRate = (failedLogins / totalLogins) * 100
    if (failureRate > 20) {
      recommendations.push({
        type: 'warning',
        message: `High login failure rate (${failureRate.toFixed(1)}%). Consider implementing additional security measures.`
      })
    }
  }
  
  // Check threat count
  if (stats.threatCount > 5) {
    recommendations.push({
      type: 'warning',
      message: `${stats.threatCount} potential threats detected. Review security logs and consider blocking suspicious IPs.`
    })
  }
  
  // Check rate limiting
  const rateLimitHits = stats.eventsByType[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0
  if (rateLimitHits > 50) {
    recommendations.push({
      type: 'info',
      message: `Rate limiting is working effectively (${rateLimitHits} requests blocked).`
    })
  }
  
  // System health checks
  if (!systemHealth.csrfProtectionEnabled) {
    recommendations.push({
      type: 'warning',
      message: 'CSRF protection is disabled. Enable it for better security.'
    })
  }
  
  if (!systemHealth.securityHeadersEnabled) {
    recommendations.push({
      type: 'warning',
      message: 'Security headers are not fully configured. Review CSP and other security headers.'
    })
  }
  
  // Success messages
  if (systemHealth.encryptionEnabled && systemHealth.sessionSecurityEnabled) {
    recommendations.push({
      type: 'success',
      message: 'Encryption and session security are properly configured.'
    })
  }
  
  return recommendations
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}