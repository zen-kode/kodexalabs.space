import { NextRequest, NextResponse } from 'next/server';
import { configValidator, getConfigSummary } from '@/lib/config-validator';
import { logger } from '@/lib/logger';
import { asyncHandler, createAuthError } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth';
import { RateLimiter } from '@/lib/rate-limit';

const rateLimiter = new RateLimiter();

// Configuration status endpoint - requires authentication
export const GET = asyncHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limitApi(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '0'
        }
      }
    );
  }

  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    throw createAuthError('Authentication required for configuration status');
  }

  // Check if user has admin role (implement your own logic)
  // For now, we'll check if user email contains 'admin' (not secure, just for demo)
  const isAdmin = user.email?.includes('admin') || false;
  
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true' && isAdmin;
  const category = url.searchParams.get('category');
  const includeEnv = url.searchParams.get('env') === 'true' && isAdmin;

  try {
    // Get configuration validation results
    const validationResult = configValidator.validateAll();
    const summary = getConfigSummary();

    // Filter by category if specified
    let filteredErrors = validationResult.errors;
    let filteredWarnings = validationResult.warnings;
    
    if (category) {
      filteredErrors = validationResult.errors.filter(e => e.category === category);
      filteredWarnings = validationResult.warnings.filter(w => w.category === category);
    }

    // Prepare response data
    const responseData: any = {
      status: validationResult.valid ? 'healthy' : 'unhealthy',
      score: validationResult.score,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      summary: {
        valid: validationResult.valid,
        totalIssues: filteredErrors.length + filteredWarnings.length,
        criticalErrors: filteredErrors.filter(e => e.severity === 'critical').length,
        highErrors: filteredErrors.filter(e => e.severity === 'high').length,
        mediumErrors: filteredErrors.filter(e => e.severity === 'medium').length,
        lowErrors: filteredErrors.filter(e => e.severity === 'low').length,
        warnings: filteredWarnings.length
      },
      categories: summary.categories
    };

    // Add detailed information for admins
    if (detailed) {
      responseData.details = {
        errors: filteredErrors.map(error => ({
          category: error.category,
          severity: error.severity,
          field: error.field,
          message: error.message,
          suggestion: error.suggestion
        })),
        warnings: filteredWarnings.map(warning => ({
          category: warning.category,
          field: warning.field,
          message: warning.message,
          suggestion: warning.suggestion
        }))
      };
    } else {
      // Non-admin users get limited information
      responseData.issues = {
        hasErrors: filteredErrors.length > 0,
        hasCritical: filteredErrors.some(e => e.severity === 'critical'),
        categories: Array.from(new Set([
          ...filteredErrors.map(e => e.category),
          ...filteredWarnings.map(w => w.category)
        ]))
      };
    }

    // Add environment information for admins
    if (includeEnv) {
      const envInfo: any = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };

      // Add non-sensitive environment variables
      const safeEnvVars = [
        'NODE_ENV',
        'NEXTAUTH_URL',
        'SUPABASE_URL',
        'FIREBASE_PROJECT_ID',
        'GOOGLE_CLIENT_ID',
        'GITHUB_CLIENT_ID',
        'DISCORD_CLIENT_ID'
      ];

      envInfo.variables = {};
      safeEnvVars.forEach(key => {
        const value = process.env[key];
        if (value) {
          // Mask sensitive parts of URLs and IDs
          if (key.includes('URL')) {
            envInfo.variables[key] = value.replace(/\/\/([^@]+@)?([^.]+)/, '//***@$2');
          } else if (key.includes('ID')) {
            envInfo.variables[key] = value.substring(0, 8) + '***';
          } else {
            envInfo.variables[key] = value;
          }
        } else {
          envInfo.variables[key] = null;
        }
      });

      responseData.environment_info = envInfo;
    }

    // Add recommendations
    responseData.recommendations = generateRecommendations(validationResult, isAdmin);

    const duration = Date.now() - startTime;

    // Log configuration status request
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
        isAdmin,
        detailed,
        category,
        includeEnv,
        configScore: validationResult.score,
        issueCount: filteredErrors.length + filteredWarnings.length
      }
    });

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': duration.toString(),
        'X-Config-Score': validationResult.score.toString(),
        'X-Config-Status': validationResult.valid ? 'valid' : 'invalid'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Configuration status request failed:', error, {
      duration,
      url: request.url,
      userId: user?.id,
      isAdmin,
      detailed,
      category
    });

    throw error; // Let asyncHandler handle it
  }
});

// Refresh configuration validation
export const POST = asyncHandler(async (request: NextRequest) => {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    throw createAuthError('Authentication required');
  }

  // Check admin permissions
  const isAdmin = user.email?.includes('admin') || false;
  if (!isAdmin) {
    throw createAuthError('Admin access required for configuration refresh');
  }

  try {
    // Force re-validation
    const validationResult = configValidator.validateAll();
    const summary = getConfigSummary();

    logger.info('Configuration validation refreshed by admin', {
      userId: user.id,
      userEmail: user.email,
      score: validationResult.score,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Configuration validation refreshed successfully',
      timestamp: new Date().toISOString(),
      refreshedBy: user.email,
      result: {
        valid: validationResult.valid,
        score: validationResult.score,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length
      }
    });

  } catch (error) {
    logger.error('Failed to refresh configuration validation:', error, {
      userId: user.id,
      userEmail: user.email
    });
    
    throw error;
  }
});

// Generate recommendations based on validation results
function generateRecommendations(validationResult: any, isAdmin: boolean): any[] {
  const recommendations: any[] = [];

  // Critical errors
  const criticalErrors = validationResult.errors.filter((e: any) => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    recommendations.push({
      priority: 'critical',
      type: 'error',
      message: `Fix ${criticalErrors.length} critical configuration error(s) immediately`,
      action: 'Review and fix critical configuration issues',
      category: 'immediate'
    });
  }

  // High priority errors
  const highErrors = validationResult.errors.filter((e: any) => e.severity === 'high');
  if (highErrors.length > 0) {
    recommendations.push({
      priority: 'high',
      type: 'error',
      message: `Address ${highErrors.length} high priority configuration issue(s)`,
      action: 'Review and fix high priority configuration issues',
      category: 'urgent'
    });
  }

  // Security recommendations
  const securityIssues = validationResult.errors.filter((e: any) => e.category === 'security').length +
                        validationResult.warnings.filter((w: any) => w.category === 'security').length;
  if (securityIssues > 0) {
    recommendations.push({
      priority: 'high',
      type: 'security',
      message: `Review ${securityIssues} security configuration issue(s)`,
      action: 'Strengthen security configuration',
      category: 'security'
    });
  }

  // Database configuration
  const dbIssues = validationResult.errors.filter((e: any) => e.category === 'database').length;
  if (dbIssues > 0) {
    recommendations.push({
      priority: 'high',
      type: 'database',
      message: 'Database configuration needs attention',
      action: 'Verify database connection and credentials',
      category: 'infrastructure'
    });
  }

  // External services
  const externalIssues = validationResult.errors.filter((e: any) => e.category === 'external').length;
  if (externalIssues > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'external',
      message: 'External service configuration incomplete',
      action: 'Configure missing external services (OAuth, AI, etc.)',
      category: 'features'
    });
  }

  // Performance optimizations
  const perfIssues = validationResult.warnings.filter((w: any) => w.category === 'performance').length;
  if (perfIssues > 0) {
    recommendations.push({
      priority: 'low',
      type: 'performance',
      message: 'Performance optimizations available',
      action: 'Consider enabling Redis caching and other performance features',
      category: 'optimization'
    });
  }

  // General health score recommendations
  if (validationResult.score < 70) {
    recommendations.push({
      priority: 'medium',
      type: 'general',
      message: 'Configuration health score is below recommended threshold',
      action: 'Review and address configuration issues to improve stability',
      category: 'maintenance'
    });
  } else if (validationResult.score < 90) {
    recommendations.push({
      priority: 'low',
      type: 'general',
      message: 'Configuration can be improved',
      action: 'Address remaining warnings to optimize configuration',
      category: 'optimization'
    });
  }

  // Production-specific recommendations
  if (process.env.NODE_ENV === 'production') {
    recommendations.push({
      priority: 'medium',
      type: 'monitoring',
      message: 'Enable monitoring and alerting',
      action: 'Set up error tracking, performance monitoring, and health checks',
      category: 'monitoring'
    });
  }

  // Limit recommendations for non-admin users
  if (!isAdmin) {
    return recommendations
      .filter(r => r.priority === 'critical' || r.priority === 'high')
      .slice(0, 3)
      .map(r => ({
        priority: r.priority,
        message: r.message,
        category: r.category
      }));
  }

  return recommendations;
}