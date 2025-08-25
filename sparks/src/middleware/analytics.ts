import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RequestAnalytics {
  method: string;
  url: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  timestamp: number;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
  userId?: string;
  sessionId?: string;
  apiKey?: string;
  endpoint: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

interface AnalyticsMiddlewareConfig {
  enableRequestTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableSecurityTracking: boolean;
  trackHeaders: string[];
  excludePaths: string[];
  sampleRate: number;
  maxRequestSize: number;
  enableGeoTracking: boolean;
  enableBotDetection: boolean;
}

const DEFAULT_CONFIG: AnalyticsMiddlewareConfig = {
  enableRequestTracking: true,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableSecurityTracking: true,
  trackHeaders: ['user-agent', 'referer', 'accept-language', 'accept-encoding'],
  excludePaths: ['/favicon.ico', '/robots.txt', '/_next', '/api/health'],
  sampleRate: 1.0, // Track 100% of requests
  maxRequestSize: 1024 * 1024, // 1MB
  enableGeoTracking: false, // Requires external service
  enableBotDetection: true
};

// Bot detection patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegram/i
];

// Suspicious patterns for security tracking
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // Path traversal
  /<script/i, // XSS attempts
  /union.*select/i, // SQL injection
  /javascript:/i, // JavaScript injection
  /eval\(/i, // Code injection
  /base64_decode/i, // Encoded payloads
  /cmd\.exe/i, // Command injection
  /\/etc\/passwd/i, // File access attempts
  /\/proc\/self/i, // Process information access
];

class AnalyticsMiddleware {
  private config: AnalyticsMiddlewareConfig;
  private requestStore: Map<string, RequestAnalytics> = new Map();

  constructor(config: Partial<AnalyticsMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async process(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Check if request should be tracked
    if (!this.shouldTrackRequest(request)) {
      return NextResponse.next();
    }

    // Sample requests based on sample rate
    if (Math.random() > this.config.sampleRate) {
      return NextResponse.next();
    }

    // Extract request information
    const analytics = this.extractRequestAnalytics(request, startTime);
    
    // Store request for later completion
    this.requestStore.set(requestId, analytics);

    // Process request
    const response = NextResponse.next();

    // Add request ID to response headers for tracking
    response.headers.set('x-request-id', requestId);

    // Track request completion in the background
    this.trackRequestCompletion(requestId, response, startTime);

    return response;
  }

  private shouldTrackRequest(request: NextRequest): boolean {
    const { pathname } = request.nextUrl;
    
    // Skip excluded paths
    return !this.config.excludePaths.some(path => 
      pathname.startsWith(path)
    );
  }

  private extractRequestAnalytics(request: NextRequest, timestamp: number): RequestAnalytics {
    const { pathname, search } = request.nextUrl;
    const headers = Object.fromEntries(request.headers.entries());
    
    // Extract query parameters
    const query: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    // Extract tracked headers
    const trackedHeaders: Record<string, string> = {};
    this.config.trackHeaders.forEach(headerName => {
      const value = headers[headerName.toLowerCase()];
      if (value) {
        trackedHeaders[headerName] = value;
      }
    });

    // Extract user information
    const userId = this.extractUserId(request);
    const sessionId = this.extractSessionId(request);
    const apiKey = this.extractApiKey(request);

    // Detect bots
    const userAgent = headers['user-agent'] || '';
    const isBot = this.config.enableBotDetection && this.detectBot(userAgent);

    // Check for suspicious activity
    const isSuspicious = this.config.enableSecurityTracking && 
      this.detectSuspiciousActivity(pathname + search, headers);

    const analytics: RequestAnalytics = {
      method: request.method,
      url: pathname,
      userAgent,
      referer: headers.referer,
      ip: this.extractClientIP(request),
      timestamp,
      userId,
      sessionId,
      apiKey,
      endpoint: this.categorizeEndpoint(pathname),
      query,
      headers: trackedHeaders
    };

    // Track special events
    if (isBot) {
      this.trackBotRequest(analytics);
    }

    if (isSuspicious) {
      this.trackSuspiciousRequest(analytics);
    }

    return analytics;
  }

  private trackRequestCompletion(
    requestId: string, 
    response: NextResponse, 
    startTime: number
  ): void {
    // Use setTimeout to avoid blocking the response
    setTimeout(() => {
      const analytics = this.requestStore.get(requestId);
      if (!analytics) return;

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Update analytics with response information
      analytics.duration = duration;
      analytics.statusCode = response.status;
      
      // Estimate response size (approximate)
      const responseSize = this.estimateResponseSize(response);
      analytics.responseSize = responseSize;

      // Track the completed request
      this.trackRequest(analytics);

      // Track performance metrics
      if (this.config.enablePerformanceTracking) {
        this.trackPerformanceMetrics(analytics);
      }

      // Track errors
      if (this.config.enableErrorTracking && response.status >= 400) {
        this.trackErrorRequest(analytics);
      }

      // Clean up
      this.requestStore.delete(requestId);
    }, 0);
  }

  private trackRequest(analytics: RequestAnalytics): void {
    // Send to analytics API (async)
    this.sendAnalyticsEvent('api_request', {
      method: analytics.method,
      endpoint: analytics.endpoint,
      statusCode: analytics.statusCode,
      duration: analytics.duration,
      responseSize: analytics.responseSize,
      userAgent: analytics.userAgent,
      ip: analytics.ip,
      userId: analytics.userId,
      sessionId: analytics.sessionId,
      timestamp: analytics.timestamp
    });

    // Log for debugging
    logger.info('API request tracked', {
      method: analytics.method,
      url: analytics.url,
      statusCode: analytics.statusCode,
      duration: analytics.duration,
      userId: analytics.userId
    });
  }

  private trackPerformanceMetrics(analytics: RequestAnalytics): void {
    if (!analytics.duration) return;

    // Track response time by endpoint
    this.sendAnalyticsEvent('api_performance', {
      endpoint: analytics.endpoint,
      method: analytics.method,
      duration: analytics.duration,
      responseSize: analytics.responseSize,
      timestamp: analytics.timestamp
    });

    // Track slow requests
    if (analytics.duration > 5000) { // 5 seconds
      this.sendAnalyticsEvent('slow_request', {
        endpoint: analytics.endpoint,
        method: analytics.method,
        duration: analytics.duration,
        userId: analytics.userId,
        timestamp: analytics.timestamp
      });
    }
  }

  private trackErrorRequest(analytics: RequestAnalytics): void {
    this.sendAnalyticsEvent('api_error', {
      method: analytics.method,
      endpoint: analytics.endpoint,
      statusCode: analytics.statusCode,
      duration: analytics.duration,
      userAgent: analytics.userAgent,
      ip: analytics.ip,
      userId: analytics.userId,
      sessionId: analytics.sessionId,
      timestamp: analytics.timestamp
    });

    logger.warn('API error tracked', {
      method: analytics.method,
      url: analytics.url,
      statusCode: analytics.statusCode,
      userId: analytics.userId
    });
  }

  private trackBotRequest(analytics: RequestAnalytics): void {
    this.sendAnalyticsEvent('bot_request', {
      method: analytics.method,
      endpoint: analytics.endpoint,
      userAgent: analytics.userAgent,
      ip: analytics.ip,
      timestamp: analytics.timestamp
    });
  }

  private trackSuspiciousRequest(analytics: RequestAnalytics): void {
    this.sendAnalyticsEvent('suspicious_request', {
      method: analytics.method,
      url: analytics.url,
      userAgent: analytics.userAgent,
      ip: analytics.ip,
      query: analytics.query,
      timestamp: analytics.timestamp
    });

    logger.warn('Suspicious request detected', {
      method: analytics.method,
      url: analytics.url,
      ip: analytics.ip,
      userAgent: analytics.userAgent
    });
  }

  private async sendAnalyticsEvent(eventType: string, properties: Record<string, any>): Promise<void> {
    try {
      // In a real implementation, this would send to your analytics API
      // For now, we'll just log it
      logger.debug('Analytics event', {
        type: eventType,
        properties
      });

      // You could also send to external analytics services here
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     events: [{ type: eventType, properties, timestamp: Date.now() }]
      //   })
      // });
    } catch (error) {
      logger.error('Failed to send analytics event', { error, eventType });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractClientIP(request: NextRequest): string {
    // Try various headers for client IP
    const headers = request.headers;
    return (
      headers.get('x-forwarded-for')?.split(',')[0] ||
      headers.get('x-real-ip') ||
      headers.get('x-client-ip') ||
      headers.get('cf-connecting-ip') || // Cloudflare
      headers.get('x-forwarded') ||
      headers.get('forwarded-for') ||
      headers.get('forwarded') ||
      'unknown'
    );
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Extract user ID from JWT token, session, or headers
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // In a real implementation, decode the JWT token
        // const token = authHeader.substring(7);
        // const decoded = jwt.decode(token);
        // return decoded?.sub;
      } catch (error) {
        // Invalid token
      }
    }

    // Try session cookie
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      // Extract user ID from session
    }

    return undefined;
  }

  private extractSessionId(request: NextRequest): string | undefined {
    return request.cookies.get('sessionId')?.value ||
           request.headers.get('x-session-id') ||
           undefined;
  }

  private extractApiKey(request: NextRequest): string | undefined {
    return request.headers.get('x-api-key') ||
           request.headers.get('api-key') ||
           undefined;
  }

  private categorizeEndpoint(pathname: string): string {
    if (pathname.startsWith('/api/auth')) return 'auth';
    if (pathname.startsWith('/api/users')) return 'users';
    if (pathname.startsWith('/api/prompts')) return 'prompts';
    if (pathname.startsWith('/api/tools')) return 'tools';
    if (pathname.startsWith('/api/analytics')) return 'analytics';
    if (pathname.startsWith('/api/ai')) return 'ai';
    if (pathname.startsWith('/api/')) return 'api';
    return 'web';
  }

  private detectBot(userAgent: string): boolean {
    return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
  }

  private detectSuspiciousActivity(url: string, headers: Record<string, string>): boolean {
    // Check URL for suspicious patterns
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check headers for suspicious content
    const suspiciousHeaders = ['x-forwarded-for', 'user-agent', 'referer'];
    for (const headerName of suspiciousHeaders) {
      const value = headers[headerName.toLowerCase()];
      if (value && SUSPICIOUS_PATTERNS.some(pattern => pattern.test(value))) {
        return true;
      }
    }

    return false;
  }

  private estimateResponseSize(response: NextResponse): number {
    // This is an approximation - in a real implementation,
    // you might want to measure actual response size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Estimate based on status code
    if (response.status >= 400) {
      return 500; // Error responses are typically small
    }

    return 1024; // Default estimate
  }
}

// Export singleton instance
export const analyticsMiddleware = new AnalyticsMiddleware();

// Export middleware function for Next.js
export function withAnalytics(config?: Partial<AnalyticsMiddlewareConfig>) {
  const middleware = new AnalyticsMiddleware(config);
  
  return async (request: NextRequest) => {
    return middleware.process(request);
  };
}

export default analyticsMiddleware;