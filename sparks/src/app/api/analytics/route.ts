import { NextRequest, NextResponse } from 'next/server';
import { analytics, AnalyticsEventType } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';
import { rateLimit } from '@/lib/rate-limiter';

// Mock analytics data store (replace with real database)
interface StoredAnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  topEvents: Array<{ type: string; count: number }>;
  userActivity: Array<{ date: string; events: number; users: number }>;
  performanceMetrics: Array<{ name: string; avg: number; p95: number }>;
  conversionFunnel: Array<{ step: string; users: number; conversionRate: number }>;
}

// Mock data store
const analyticsStore: StoredAnalyticsEvent[] = [];
const performanceStore: Array<{ name: string; value: number; timestamp: Date }> = [];

// GET /api/analytics - Retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100 // 100 requests per window
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const eventType = searchParams.get('eventType');
    const userId = searchParams.get('userId');
    const format = searchParams.get('format') || 'json';
    const detailed = searchParams.get('detailed') === 'true';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Filter events
    let filteredEvents = analyticsStore.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.type === eventType);
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === userId);
    }

    // Generate metrics
    const metrics = generateMetrics(filteredEvents, startDate, endDate);

    // Prepare response data
    const responseData = {
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metrics,
      ...(detailed && { events: filteredEvents })
    };

    // Handle different response formats
    if (format === 'csv') {
      const csv = convertToCSV(filteredEvents);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${timeRange}.csv"`
        }
      });
    }

    logger.info('Analytics data retrieved', {
      timeRange,
      eventCount: filteredEvents.length,
      userId,
      eventType
    });

    return NextResponse.json(responseData);

  } catch (error) {
    return handleApiError(error, 'Failed to retrieve analytics data');
  }
}

// POST /api/analytics - Track analytics events
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 1000 // 1000 events per minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { events, metrics, sessionId, userId } = body;

    // Validate request body
    if (!Array.isArray(events) && !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected events or metrics array.' },
        { status: 400 }
      );
    }

    // Process events
    if (Array.isArray(events)) {
      for (const event of events) {
        const storedEvent: StoredAnalyticsEvent = {
          id: generateEventId(),
          type: event.type,
          userId: event.userId || userId,
          sessionId: event.sessionId || sessionId,
          timestamp: new Date(event.timestamp),
          properties: event.properties || {},
          metadata: event.metadata
        };

        analyticsStore.push(storedEvent);

        // Track in analytics service
        analytics.track(event.type as AnalyticsEventType, event.properties);
      }
    }

    // Process performance metrics
    if (Array.isArray(metrics)) {
      for (const metric of metrics) {
        performanceStore.push({
          name: metric.name,
          value: metric.value,
          timestamp: new Date(metric.timestamp)
        });

        // Track in analytics service
        analytics.trackPerformance(metric.name, metric.value, metric.unit, metric.tags);
      }
    }

    logger.info('Analytics events processed', {
      eventCount: events?.length || 0,
      metricCount: metrics?.length || 0,
      userId,
      sessionId
    });

    return NextResponse.json({
      success: true,
      processed: {
        events: events?.length || 0,
        metrics: metrics?.length || 0
      }
    });

  } catch (error) {
    return handleApiError(error, 'Failed to process analytics events');
  }
}

// DELETE /api/analytics - Clear analytics data (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getCurrentUser(request);
    // if (!user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // e.g., '30d'
    const eventType = searchParams.get('eventType');
    const confirm = searchParams.get('confirm') === 'true';

    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to proceed.' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    const originalLength = analyticsStore.length;

    if (olderThan) {
      const cutoffDate = new Date();
      const days = parseInt(olderThan.replace('d', ''));
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (let i = analyticsStore.length - 1; i >= 0; i--) {
        const event = analyticsStore[i];
        if (new Date(event.timestamp) < cutoffDate) {
          if (!eventType || event.type === eventType) {
            analyticsStore.splice(i, 1);
            deletedCount++;
          }
        }
      }
    } else if (eventType) {
      for (let i = analyticsStore.length - 1; i >= 0; i--) {
        if (analyticsStore[i].type === eventType) {
          analyticsStore.splice(i, 1);
          deletedCount++;
        }
      }
    } else {
      // Clear all data
      deletedCount = analyticsStore.length;
      analyticsStore.length = 0;
      performanceStore.length = 0;
    }

    logger.info('Analytics data cleared', {
      deletedCount,
      originalLength,
      olderThan,
      eventType
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      remainingCount: analyticsStore.length
    });

  } catch (error) {
    return handleApiError(error, 'Failed to clear analytics data');
  }
}

// Helper Functions
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMetrics(events: StoredAnalyticsEvent[], startDate: Date, endDate: Date): AnalyticsMetrics {
  const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
  
  // Count events by type
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEvents = Object.entries(eventCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate daily activity
  const userActivity = generateDailyActivity(events, startDate, endDate);

  // Generate performance metrics
  const performanceMetrics = generatePerformanceMetrics();

  // Generate conversion funnel (mock data)
  const conversionFunnel = [
    { step: 'Page Visit', users: uniqueUsers, conversionRate: 100 },
    { step: 'Sign Up', users: Math.floor(uniqueUsers * 0.3), conversionRate: 30 },
    { step: 'First Prompt', users: Math.floor(uniqueUsers * 0.2), conversionRate: 20 },
    { step: 'Tool Usage', users: Math.floor(uniqueUsers * 0.15), conversionRate: 15 },
    { step: 'Conversion', users: Math.floor(uniqueUsers * 0.1), conversionRate: 10 }
  ];

  return {
    totalEvents: events.length,
    uniqueUsers,
    topEvents,
    userActivity,
    performanceMetrics,
    conversionFunnel
  };
}

function generateDailyActivity(events: StoredAnalyticsEvent[], startDate: Date, endDate: Date) {
  const dailyData: Record<string, { events: number; users: Set<string> }> = {};
  
  // Initialize all days in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyData[dateKey] = { events: 0, users: new Set() };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate with actual data
  events.forEach(event => {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].events++;
      if (event.userId) {
        dailyData[dateKey].users.add(event.userId);
      }
    }
  });

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    events: data.events,
    users: data.users.size
  }));
}

function generatePerformanceMetrics() {
  const metricGroups: Record<string, number[]> = {};
  
  performanceStore.forEach(metric => {
    if (!metricGroups[metric.name]) {
      metricGroups[metric.name] = [];
    }
    metricGroups[metric.name].push(metric.value);
  });

  return Object.entries(metricGroups).map(([name, values]) => {
    const sorted = values.sort((a, b) => a - b);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p95Index = Math.floor(values.length * 0.95);
    const p95 = sorted[p95Index] || 0;

    return { name, avg: Math.round(avg), p95: Math.round(p95) };
  });
}

function convertToCSV(events: StoredAnalyticsEvent[]): string {
  if (events.length === 0) {
    return 'No data available';
  }

  const headers = ['id', 'type', 'userId', 'sessionId', 'timestamp', 'properties'];
  const csvRows = [headers.join(',')];

  events.forEach(event => {
    const row = [
      event.id,
      event.type,
      event.userId || '',
      event.sessionId,
      event.timestamp.toISOString(),
      JSON.stringify(event.properties).replace(/"/g, '""')
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}