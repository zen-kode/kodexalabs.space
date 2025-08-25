import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { asyncHandler, createAuthError, createValidationError } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth';
import { RateLimiter } from '@/lib/rate-limit';

const rateLimiter = new RateLimiter();

// Logs API endpoint - requires admin authentication
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
    throw createAuthError('Authentication required for logs access');
  }

  // Check if user has admin role
  const isAdmin = user.email?.includes('admin') || false;
  if (!isAdmin) {
    throw createAuthError('Admin access required for logs');
  }

  const url = new URL(request.url);
  const level = url.searchParams.get('level');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end');
  const search = url.searchParams.get('search');
  const format = url.searchParams.get('format') || 'json';
  const category = url.searchParams.get('category');

  // Validate parameters
  if (level && !['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(level.toUpperCase())) {
    throw createValidationError('Invalid log level. Must be one of: DEBUG, INFO, WARN, ERROR, FATAL');
  }

  if (format && !['json', 'text', 'csv'].includes(format.toLowerCase())) {
    throw createValidationError('Invalid format. Must be one of: json, text, csv');
  }

  try {
    // Get logs from logger (this would typically query a database or log files)
    const logs = await getLogs({
      level: level?.toUpperCase(),
      limit,
      offset,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      category
    });

    const duration = Date.now() - startTime;

    // Log the logs access
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
        isAdmin: true,
        level,
        limit,
        offset,
        search,
        category,
        format,
        resultCount: logs.data.length
      }
    });

    // Format response based on requested format
    if (format === 'text') {
      const textLogs = logs.data.map(log => 
        `[${log.timestamp}] ${log.level} ${log.message} ${log.metadata ? JSON.stringify(log.metadata) : ''}`
      ).join('\n');
      
      return new NextResponse(textLogs, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'X-Response-Time': duration.toString(),
          'X-Total-Count': logs.total.toString()
        }
      });
    }

    if (format === 'csv') {
      const csvHeader = 'timestamp,level,message,category,userId,clientIp,metadata\n';
      const csvRows = logs.data.map(log => 
        `"${log.timestamp}","${log.level}","${log.message.replace(/"/g, '""')}","${log.category || ''}","${log.userId || ''}","${log.clientIp || ''}","${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ''}"`
      ).join('\n');
      
      return new NextResponse(csvHeader + csvRows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Response-Time': duration.toString(),
          'X-Total-Count': logs.total.toString()
        }
      });
    }

    // Default JSON format
    return NextResponse.json({
      logs: logs.data,
      pagination: {
        total: logs.total,
        limit,
        offset,
        hasMore: logs.total > offset + limit
      },
      filters: {
        level,
        startDate,
        endDate,
        search,
        category
      },
      metadata: {
        requestTime: duration,
        timestamp: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'X-Response-Time': duration.toString(),
        'X-Total-Count': logs.total.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to retrieve logs:', error, {
      duration,
      url: request.url,
      userId: user.id,
      level,
      limit,
      offset,
      search,
      category,
      format
    });

    throw error;
  }
});

// Clear logs endpoint - admin only
export const DELETE = asyncHandler(async (request: NextRequest) => {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    throw createAuthError('Authentication required');
  }

  // Check admin permissions
  const isAdmin = user.email?.includes('admin') || false;
  if (!isAdmin) {
    throw createAuthError('Admin access required for log management');
  }

  const url = new URL(request.url);
  const olderThan = url.searchParams.get('olderThan'); // ISO date string
  const level = url.searchParams.get('level');
  const category = url.searchParams.get('category');
  const confirm = url.searchParams.get('confirm') === 'true';

  if (!confirm) {
    throw createValidationError('Confirmation required. Add ?confirm=true to proceed with log deletion.');
  }

  try {
    const deletedCount = await clearLogs({
      olderThan: olderThan ? new Date(olderThan) : undefined,
      level: level?.toUpperCase(),
      category
    });

    logger.info('Logs cleared by admin', {
      userId: user.id,
      userEmail: user.email,
      deletedCount,
      olderThan,
      level,
      category,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Logs cleared successfully',
      deletedCount,
      clearedBy: user.email,
      timestamp: new Date().toISOString(),
      filters: {
        olderThan,
        level,
        category
      }
    });

  } catch (error) {
    logger.error('Failed to clear logs:', error, {
      userId: user.id,
      userEmail: user.email,
      olderThan,
      level,
      category
    });
    
    throw error;
  }
});

// Mock function to get logs (replace with actual implementation)
async function getLogs(filters: {
  level?: string;
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  category?: string;
}): Promise<{ data: any[]; total: number }> {
  // This is a mock implementation
  // In a real application, you would query your log storage (database, files, etc.)
  
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'User logged in successfully',
      category: 'auth',
      userId: 'user123',
      clientIp: '192.168.1.1',
      metadata: { userAgent: 'Mozilla/5.0...' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'ERROR',
      message: 'Database connection failed',
      category: 'database',
      metadata: { error: 'Connection timeout', retryCount: 3 }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'WARN',
      message: 'Rate limit approaching for user',
      category: 'security',
      userId: 'user456',
      clientIp: '192.168.1.2',
      metadata: { requestCount: 95, limit: 100 }
    }
  ];

  // Apply filters
  let filteredLogs = mockLogs;

  if (filters.level) {
    filteredLogs = filteredLogs.filter(log => log.level === filters.level);
  }

  if (filters.category) {
    filteredLogs = filteredLogs.filter(log => log.category === filters.category);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(searchLower) ||
      log.category?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= filters.startDate!
    );
  }

  if (filters.endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= filters.endDate!
    );
  }

  const total = filteredLogs.length;
  const paginatedLogs = filteredLogs.slice(filters.offset, filters.offset + filters.limit);

  return {
    data: paginatedLogs,
    total
  };
}

// Mock function to clear logs (replace with actual implementation)
async function clearLogs(filters: {
  olderThan?: Date;
  level?: string;
  category?: string;
}): Promise<number> {
  // This is a mock implementation
  // In a real application, you would delete logs from your storage
  
  // Simulate deletion count
  let deletedCount = 0;
  
  if (filters.olderThan) {
    deletedCount += 150; // Mock: deleted 150 old logs
  }
  
  if (filters.level) {
    deletedCount += 25; // Mock: deleted 25 logs of specific level
  }
  
  if (filters.category) {
    deletedCount += 10; // Mock: deleted 10 logs of specific category
  }
  
  if (!filters.olderThan && !filters.level && !filters.category) {
    deletedCount = 500; // Mock: deleted all logs
  }
  
  return deletedCount;
}