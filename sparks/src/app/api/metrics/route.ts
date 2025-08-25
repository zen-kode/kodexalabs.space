import { NextRequest, NextResponse } from 'next/server';
import { monitor, getMetrics, getAppMetrics, getSystemInfo } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { asyncHandler, createAuthError } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth';

// Metrics endpoint - requires authentication
export const GET = asyncHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  
  // Check authentication for metrics access
  const user = await getCurrentUser();
  if (!user) {
    throw createAuthError('Authentication required for metrics access');
  }

  // Check if user has admin role (you might want to implement role-based access)
  // For now, we'll allow any authenticated user
  
  const format = url.searchParams.get('format') || 'json';
  const metricName = url.searchParams.get('name');
  const timeRange = url.searchParams.get('range') || '1h';
  const includeSystem = url.searchParams.get('system') === 'true';
  const includeApp = url.searchParams.get('app') !== 'false'; // Default true

  try {
    let response: any = {};

    // Get application metrics
    if (includeApp) {
      const appMetrics = getAppMetrics();
      response.application = {
        requests: {
          total: appMetrics.requests.total,
          success: appMetrics.requests.success,
          errors: appMetrics.requests.errors,
          rate: Math.round(appMetrics.requests.rate * 100) / 100,
          errorRate: appMetrics.requests.total > 0 
            ? Math.round((appMetrics.requests.errors / appMetrics.requests.total) * 10000) / 100
            : 0
        },
        response: {
          averageTime: Math.round(appMetrics.response.averageTime * 100) / 100,
          p95Time: Math.round(appMetrics.response.p95Time * 100) / 100,
          p99Time: Math.round(appMetrics.response.p99Time * 100) / 100
        },
        database: {
          queries: appMetrics.database.queries,
          errors: appMetrics.database.errors,
          connections: appMetrics.database.connections,
          errorRate: appMetrics.database.queries > 0
            ? Math.round((appMetrics.database.errors / appMetrics.database.queries) * 10000) / 100
            : 0
        },
        cache: {
          hits: appMetrics.cache.hits,
          misses: appMetrics.cache.misses,
          hitRate: Math.round(appMetrics.cache.hitRate * 10000) / 100
        },
        security: {
          threats: appMetrics.security.threats,
          blocked: appMetrics.security.blocked,
          alerts: appMetrics.security.alerts
        }
      };
    }

    // Get system metrics
    if (includeSystem) {
      const systemInfo = getSystemInfo();
      response.system = {
        nodeVersion: systemInfo.nodeVersion,
        platform: systemInfo.platform,
        arch: systemInfo.arch,
        uptime: Math.round(systemInfo.uptime),
        memory: {
          used: Math.round(systemInfo.memory.used / 1024 / 1024), // MB
          total: Math.round(systemInfo.memory.total / 1024 / 1024), // MB
          percentage: Math.round(systemInfo.memory.percentage * 100) / 100
        },
        cpu: {
          usage: Math.round(systemInfo.cpu.usage * 100) / 100
        }
      };
    }

    // Get raw metrics if specific name requested
    if (metricName) {
      const rawMetrics = getMetrics(metricName);
      
      // Filter by time range
      const now = Date.now();
      const timeRangeMs = parseTimeRange(timeRange);
      const filteredMetrics = rawMetrics.filter(metric => 
        now - new Date(metric.timestamp).getTime() <= timeRangeMs
      );

      response.metrics = {
        name: metricName,
        timeRange,
        count: filteredMetrics.length,
        data: filteredMetrics
      };
    }

    // Add metadata
    response.metadata = {
      timestamp: new Date().toISOString(),
      timeRange,
      format,
      generatedBy: 'sparks-monitoring',
      version: '1.0.0'
    };

    const duration = Date.now() - startTime;

    // Log metrics request
    logger.logRequest({
      method: 'GET',
      url: request.url,
      statusCode: 200,
      duration,
      requestId: request.headers.get('x-request-id') || undefined,
      userId: user.id,
      clientIp: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        format,
        metricName,
        timeRange,
        includeSystem,
        includeApp
      }
    });

    // Handle different response formats
    if (format === 'prometheus') {
      const prometheusMetrics = convertToPrometheus(response);
      return new NextResponse(prometheusMetrics, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': duration.toString()
        }
      });
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': duration.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Metrics request failed:', error, {
      duration,
      url: request.url,
      userId: user?.id,
      format,
      metricName,
      timeRange
    });

    throw error; // Let asyncHandler handle it
  }
});

// Reset metrics endpoint (admin only)
export const DELETE = asyncHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    throw createAuthError('Authentication required');
  }

  // Check admin permissions (implement your own logic)
  // For now, we'll check if user email contains 'admin' (not secure, just for demo)
  if (!user.email?.includes('admin')) {
    throw createAuthError('Admin access required');
  }

  try {
    monitor.resetMetrics();
    
    logger.info('Metrics reset by admin', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
      resetBy: user.email
    });

  } catch (error) {
    logger.error('Failed to reset metrics:', error, {
      userId: user.id,
      userEmail: user.email
    });
    
    throw error;
  }
});

// Helper function to parse time range
function parseTimeRange(range: string): number {
  const units: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  };

  const match = range.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return 60 * 60 * 1000; // Default 1 hour
  }

  const [, value, unit] = match;
  return parseInt(value) * (units[unit] || units.h);
}

// Convert metrics to Prometheus format
function convertToPrometheus(data: any): string {
  const lines: string[] = [];
  const timestamp = Date.now();

  // Add help and type comments
  lines.push('# HELP sparks_requests_total Total number of HTTP requests');
  lines.push('# TYPE sparks_requests_total counter');
  lines.push('# HELP sparks_request_duration_seconds HTTP request duration in seconds');
  lines.push('# TYPE sparks_request_duration_seconds histogram');
  lines.push('# HELP sparks_memory_usage_percent Memory usage percentage');
  lines.push('# TYPE sparks_memory_usage_percent gauge');
  lines.push('# HELP sparks_cpu_usage_seconds CPU usage in seconds');
  lines.push('# TYPE sparks_cpu_usage_seconds gauge');

  if (data.application) {
    const app = data.application;
    
    // Request metrics
    lines.push(`sparks_requests_total{status="success"} ${app.requests.success} ${timestamp}`);
    lines.push(`sparks_requests_total{status="error"} ${app.requests.errors} ${timestamp}`);
    lines.push(`sparks_request_rate ${app.requests.rate} ${timestamp}`);
    
    // Response time metrics
    lines.push(`sparks_request_duration_seconds{quantile="0.5"} ${app.response.averageTime / 1000} ${timestamp}`);
    lines.push(`sparks_request_duration_seconds{quantile="0.95"} ${app.response.p95Time / 1000} ${timestamp}`);
    lines.push(`sparks_request_duration_seconds{quantile="0.99"} ${app.response.p99Time / 1000} ${timestamp}`);
    
    // Database metrics
    lines.push(`sparks_database_queries_total ${app.database.queries} ${timestamp}`);
    lines.push(`sparks_database_errors_total ${app.database.errors} ${timestamp}`);
    lines.push(`sparks_database_connections ${app.database.connections} ${timestamp}`);
    
    // Cache metrics
    lines.push(`sparks_cache_hits_total ${app.cache.hits} ${timestamp}`);
    lines.push(`sparks_cache_misses_total ${app.cache.misses} ${timestamp}`);
    lines.push(`sparks_cache_hit_rate ${app.cache.hitRate / 100} ${timestamp}`);
    
    // Security metrics
    lines.push(`sparks_security_threats_total ${app.security.threats} ${timestamp}`);
    lines.push(`sparks_security_blocked_total ${app.security.blocked} ${timestamp}`);
    lines.push(`sparks_security_alerts_total ${app.security.alerts} ${timestamp}`);
  }

  if (data.system) {
    const sys = data.system;
    
    // System metrics
    lines.push(`sparks_memory_usage_percent ${sys.memory.percentage / 100} ${timestamp}`);
    lines.push(`sparks_memory_used_bytes ${sys.memory.used * 1024 * 1024} ${timestamp}`);
    lines.push(`sparks_memory_total_bytes ${sys.memory.total * 1024 * 1024} ${timestamp}`);
    lines.push(`sparks_cpu_usage_seconds ${sys.cpu.usage} ${timestamp}`);
    lines.push(`sparks_uptime_seconds ${sys.uptime} ${timestamp}`);
  }

  return lines.join('\n') + '\n';
}