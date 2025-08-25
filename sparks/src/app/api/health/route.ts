import { NextRequest, NextResponse } from 'next/server';
import { monitor, getHealthStatus, getAppMetrics, getSystemInfo } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { asyncHandler } from '@/lib/error-handler';

// Health check endpoint
export const GET = asyncHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  const component = url.searchParams.get('component');

  try {
    // Run health checks
    const healthResult = await getHealthStatus();
    const duration = Date.now() - startTime;

    // Log health check request
    logger.logRequest({
      method: 'GET',
      url: request.url,
      statusCode: 200,
      duration,
      requestId: request.headers.get('x-request-id') || undefined,
      clientIp: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        healthStatus: healthResult.status,
        checksCount: healthResult.checks.length,
        detailed,
        component
      }
    });

    // Filter by component if specified
    let filteredChecks = healthResult.checks;
    if (component) {
      filteredChecks = healthResult.checks.filter(check => 
        check.name.toLowerCase() === component.toLowerCase()
      );
      
      if (filteredChecks.length === 0) {
        return NextResponse.json(
          {
            error: {
              message: `Component '${component}' not found`,
              code: 'COMPONENT_NOT_FOUND'
            }
          },
          { status: 404 }
        );
      }
    }

    // Basic response
    const response: any = {
      status: healthResult.status,
      timestamp: healthResult.timestamp,
      checks: filteredChecks.map(check => ({
        name: check.name,
        status: check.status,
        message: check.message,
        duration: check.duration
      }))
    };

    // Add detailed information if requested
    if (detailed) {
      const appMetrics = getAppMetrics();
      const systemInfo = getSystemInfo();

      response.metrics = {
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
          average: Math.round(appMetrics.response.averageTime * 100) / 100,
          p95: Math.round(appMetrics.response.p95Time * 100) / 100,
          p99: Math.round(appMetrics.response.p99Time * 100) / 100
        },
        database: {
          queries: appMetrics.database.queries,
          errors: appMetrics.database.errors,
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

      response.system = {
        nodeVersion: systemInfo.nodeVersion,
        platform: systemInfo.platform,
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

      // Include full check details
      response.checks = filteredChecks.map(check => ({
        ...check,
        metadata: check.metadata
      }));
    }

    // Set appropriate status code based on health
    let statusCode = 200;
    switch (healthResult.status) {
      case 'degraded':
        statusCode = 200; // Still OK, but with warnings
        break;
      case 'unhealthy':
        statusCode = 503; // Service Unavailable
        break;
      case 'critical':
        statusCode = 503; // Service Unavailable
        break;
    }

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthResult.status,
        'X-Response-Time': duration.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Health check failed:', error, {
      duration,
      url: request.url,
      detailed,
      component
    });

    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: {
          message: 'Health check system failure',
          code: 'HEALTH_CHECK_FAILURE'
        }
      },
      { 
        status: 503,
        headers: {
          'X-Health-Status': 'critical',
          'X-Response-Time': duration.toString()
        }
      }
    );
  }
});

// Liveness probe - simple endpoint for container orchestration
export async function liveness() {
  return NextResponse.json(
    { 
      status: 'alive',
      timestamp: new Date().toISOString()
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// Readiness probe - checks if service is ready to handle requests
export async function readiness() {
  try {
    // Quick health check without full monitoring
    const systemInfo = getSystemInfo();
    
    // Check if system is in acceptable state
    const memoryOk = systemInfo.memory.percentage < 95;
    const ready = memoryOk;

    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not-ready',
        timestamp: new Date().toISOString(),
        checks: {
          memory: memoryOk ? 'ok' : 'critical'
        }
      },
      { 
        status: ready ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      },
      { status: 503 }
    );
  }
}