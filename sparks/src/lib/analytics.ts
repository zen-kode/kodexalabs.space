import { logger } from './logger';
import { securityMonitor } from './security-monitor';

// Analytics Event Types
export enum AnalyticsEventType {
  // User Events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATE = 'user_profile_update',
  
  // Prompt Events
  PROMPT_CREATE = 'prompt_create',
  PROMPT_UPDATE = 'prompt_update',
  PROMPT_DELETE = 'prompt_delete',
  PROMPT_VIEW = 'prompt_view',
  PROMPT_COPY = 'prompt_copy',
  PROMPT_SHARE = 'prompt_share',
  PROMPT_FAVORITE = 'prompt_favorite',
  PROMPT_SEARCH = 'prompt_search',
  
  // Tool Events
  TOOL_CREATE = 'tool_create',
  TOOL_UPDATE = 'tool_update',
  TOOL_DELETE = 'tool_delete',
  TOOL_USE = 'tool_use',
  TOOL_INSTALL = 'tool_install',
  
  // AI Events
  AI_QUERY = 'ai_query',
  AI_RESPONSE = 'ai_response',
  AI_ERROR = 'ai_error',
  
  // Performance Events
  PAGE_LOAD = 'page_load',
  API_CALL = 'api_call',
  ERROR_OCCURRED = 'error_occurred',
  
  // Business Events
  FEATURE_USED = 'feature_used',
  CONVERSION = 'conversion',
  RETENTION = 'retention'
}

// Analytics Event Properties
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  category?: string;
  label?: string;
  value?: number;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    url?: string;
    device?: string;
    browser?: string;
    os?: string;
  };
}

// Performance Metrics
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

// Performance Metrics Collection
export interface PerformanceMetrics {
  metrics: PerformanceMetric[];
  timestamp: Date;
  sessionId: string;
  userId?: string;
  // Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  // Additional Performance Metrics
  loadTime?: number; // Page load time
  domContentLoaded?: number; // DOM content loaded time
}

// User Behavior Tracking
export interface UserBehavior {
  userId: string;
  sessionId: string;
  events: AnalyticsEvent[];
  sessionStart: Date;
  sessionEnd?: Date;
  totalEvents: number;
  uniqueEvents: number;
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  apiEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  enablePerformanceTracking: boolean;
  enableUserBehaviorTracking: boolean;
  enableErrorTracking: boolean;
  enableConversionTracking: boolean;
  samplingRate: number;
  debugMode: boolean;
}

// Default Analytics Configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  trackingId: process.env.ANALYTICS_TRACKING_ID,
  apiEndpoint: process.env.ANALYTICS_API_ENDPOINT,
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
  enablePerformanceTracking: true,
  enableUserBehaviorTracking: true,
  enableErrorTracking: true,
  enableConversionTracking: true,
  samplingRate: 1.0, // 100% sampling
  debugMode: process.env.NODE_ENV === 'development'
};

// Analytics Service Class
class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    if (typeof window !== 'undefined') {
      this.initializeBrowser();
    }
  }

  // Initialize Analytics Service
  initialize(userId?: string): void {
    if (this.isInitialized) return;
    
    this.userId = userId;
    this.isInitialized = true;
    
    if (this.config.enabled) {
      this.startFlushTimer();
      
      if (this.config.enablePerformanceTracking) {
        this.initializePerformanceTracking();
      }
      
      if (this.config.enableErrorTracking) {
        this.initializeErrorTracking();
      }
      
      logger.info('Analytics service initialized', {
        userId: this.userId,
        sessionId: this.sessionId,
        config: this.config
      });
    }
  }

  // Track Analytics Event
  track(type: AnalyticsEventType, properties: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }

    const event: AnalyticsEvent = {
      type,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      properties,
      metadata: this.getMetadata()
    };

    this.eventQueue.push(event);

    if (this.config.debugMode) {
      logger.debug('Analytics event tracked', { event });
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Track Performance Metric
  trackPerformance(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    if (!this.config.enabled || !this.config.enablePerformanceTracking) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.performanceQueue.push(metric);

    if (this.config.debugMode) {
      logger.debug('Performance metric tracked', { metric });
    }
  }

  // Track Page View
  trackPageView(path: string, title?: string): void {
    this.track(AnalyticsEventType.PAGE_LOAD, {
      path,
      title,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined
    });
  }

  // Track User Action
  trackUserAction(action: string, category: string, label?: string, value?: number): void {
    this.track(AnalyticsEventType.FEATURE_USED, {
      action,
      category,
      label,
      value
    });
  }

  // Track Conversion
  trackConversion(type: string, value?: number, currency?: string): void {
    if (!this.config.enableConversionTracking) return;
    
    this.track(AnalyticsEventType.CONVERSION, {
      conversionType: type,
      value,
      currency
    });
  }

  // Track Error
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enableErrorTracking) return;
    
    this.track(AnalyticsEventType.ERROR_OCCURRED, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      context
    });
    
    // Also report to security monitor if it looks suspicious
    if (this.isSuspiciousError(error)) {
      securityMonitor.logSecurityEvent({
        type: 'error_pattern',
        severity: 'medium',
        details: {
          error: error.message,
          context
        },
        userId: this.userId,
        timestamp: new Date()
      });
    }
  }

  // Set User ID
  setUserId(userId: string): void {
    this.userId = userId;
    
    this.track(AnalyticsEventType.USER_LOGIN, {
      userId
    });
  }

  // Clear User ID (logout)
  clearUserId(): void {
    if (this.userId) {
      this.track(AnalyticsEventType.USER_LOGOUT, {
        userId: this.userId
      });
    }
    
    this.userId = undefined;
  }

  // Flush Events to Analytics Provider
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    const metrics = [...this.performanceQueue];
    
    this.eventQueue = [];
    this.performanceQueue = [];

    try {
      // Send to analytics provider
      await this.sendToProvider(events, metrics);
      
      if (this.config.debugMode) {
        logger.debug('Analytics data flushed', {
          eventCount: events.length,
          metricCount: metrics.length
        });
      }
    } catch (error) {
      logger.error('Failed to flush analytics data', { error });
      
      // Re-queue events on failure (with limit to prevent memory issues)
      if (this.eventQueue.length < 1000) {
        this.eventQueue.unshift(...events.slice(-100));
      }
      if (this.performanceQueue.length < 1000) {
        this.performanceQueue.unshift(...metrics.slice(-100));
      }
    }
  }

  // Get Analytics Summary
  getAnalyticsSummary(): {
    queuedEvents: number;
    queuedMetrics: number;
    sessionId: string;
    userId?: string;
    config: AnalyticsConfig;
  } {
    return {
      queuedEvents: this.eventQueue.length,
      queuedMetrics: this.performanceQueue.length,
      sessionId: this.sessionId,
      userId: this.userId,
      config: this.config
    };
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    this.flush();
    
    this.isInitialized = false;
  }

  // Private Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  private getMetadata(): AnalyticsEvent['metadata'] {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      device: this.getDeviceType(),
      browser: this.getBrowserName(),
      os: this.getOperatingSystem()
    };
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserName(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOperatingSystem(): string {
    if (typeof window === 'undefined') return 'server';
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private initializeBrowser(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track(AnalyticsEventType.PAGE_LOAD, {
          action: 'page_hidden'
        });
      } else {
        this.track(AnalyticsEventType.PAGE_LOAD, {
          action: 'page_visible'
        });
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private initializePerformanceTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
          this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
          this.trackPerformance('first_byte', navigation.responseStart - navigation.fetchStart, 'ms');
        }
      }, 0);
    });

    // Track Core Web Vitals
    this.trackCoreWebVitals();
  }

  private trackCoreWebVitals(): void {
    // This would integrate with web-vitals library in a real implementation
    // For now, we'll track basic performance metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.trackPerformance('lcp', entry.startTime, 'ms');
            }
            if (entry.entryType === 'first-input') {
              this.trackPerformance('fid', (entry as any).processingStart - entry.startTime, 'ms');
            }
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      } catch (error) {
        // PerformanceObserver not supported
      }
    }
  }

  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private isSuspiciousError(error: Error): boolean {
    const suspiciousPatterns = [
      /sql injection/i,
      /xss/i,
      /csrf/i,
      /unauthorized/i,
      /forbidden/i,
      /admin/i,
      /hack/i,
      /exploit/i
    ];

    return suspiciousPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  private async sendToProvider(events: AnalyticsEvent[], metrics: PerformanceMetric[]): Promise<void> {
    // In a real implementation, this would send to your analytics provider
    // (Google Analytics, Mixpanel, Amplitude, etc.)
    
    if (this.config.apiEndpoint) {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.trackingId}`
        },
        body: JSON.stringify({
          events,
          metrics,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } else {
      // Log to console in development
      if (this.config.debugMode) {
        console.log('Analytics Events:', events);
        console.log('Performance Metrics:', metrics);
      }
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export types and enums
export type { AnalyticsEvent, PerformanceMetric, UserBehavior, AnalyticsConfig };