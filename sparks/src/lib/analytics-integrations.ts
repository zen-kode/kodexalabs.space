import { analyticsConfig, AnalyticsConfig } from '@/config/analytics';
import { logger } from '@/lib/logger';
import { AnalyticsEvent, AnalyticsEventType, PerformanceMetrics, UserBehavior } from '@/lib/analytics';

// Types for integration responses
interface IntegrationResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface BatchResponse {
  integration: string;
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}

// Base integration interface
abstract class AnalyticsIntegration {
  protected config: any;
  protected name: string;
  protected initialized: boolean = false;

  constructor(name: string, config: any) {
    this.name = name;
    this.config = config;
  }

  abstract initialize(): Promise<boolean>;
  abstract trackEvent(event: AnalyticsEvent): Promise<IntegrationResponse>;
  abstract trackPageView(url: string, title?: string, properties?: Record<string, any>): Promise<IntegrationResponse>;
  abstract identifyUser(userId: string, properties?: Record<string, any>): Promise<IntegrationResponse>;
  abstract trackPerformance(metrics: PerformanceMetrics): Promise<IntegrationResponse>;
  abstract flush(): Promise<void>;

  isEnabled(): boolean {
    return this.config.enabled && this.initialized;
  }

  getName(): string {
    return this.name;
  }
}

// Google Analytics 4 Integration
class GoogleAnalyticsIntegration extends AnalyticsIntegration {
  private gtag: any;

  constructor(config: any) {
    super('Google Analytics', config);
  }

  async initialize(): Promise<boolean> {
    if (!this.config.enabled || !this.config.measurementId) {
      return false;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      this.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      this.gtag('js', new Date());
      this.gtag('config', this.config.measurementId, {
        anonymize_ip: this.config.anonymizeIP,
        cookie_domain: this.config.cookieDomain,
        cookie_expires: this.config.cookieExpires,
        sample_rate: this.config.sampleRate,
        site_speed_sample_rate: this.config.siteSpeedSampleRate,
        custom_map: this.config.customDimensions
      });

      this.initialized = true;
      logger.info('Google Analytics initialized', { measurementId: this.config.measurementId });
      return true;
    } catch (error) {
      logger.error('Failed to initialize Google Analytics', { error });
      return false;
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.gtag('event', event.type, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.properties
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async trackPageView(url: string, title?: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.gtag('config', this.config.measurementId, {
        page_path: url,
        page_title: title,
        custom_map: properties
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.gtag('config', this.config.measurementId, {
        user_id: userId,
        custom_map: properties
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      // Track Core Web Vitals
      if (metrics.lcp) {
        this.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'LCP',
          value: Math.round(metrics.lcp)
        });
      }

      if (metrics.fid) {
        this.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'FID',
          value: Math.round(metrics.fid)
        });
      }

      if (metrics.cls) {
        this.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'CLS',
          value: Math.round(metrics.cls * 1000)
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async flush(): Promise<void> {
    // Google Analytics handles flushing automatically
  }
}

// Mixpanel Integration
class MixpanelIntegration extends AnalyticsIntegration {
  private mixpanel: any;

  constructor(config: any) {
    super('Mixpanel', config);
  }

  async initialize(): Promise<boolean> {
    if (!this.config.enabled || !this.config.token) {
      return false;
    }

    try {
      // Load Mixpanel script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      document.head.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });

      // Initialize Mixpanel
      this.mixpanel = window.mixpanel;
      this.mixpanel.init(this.config.token, {
        track_pageview: false, // We'll handle this manually
        persistence: this.config.persistence,
        cross_subdomain_cookie: this.config.crossSubdomainCookie,
        secure_cookie: this.config.secureCookie,
        api_host: this.config.apiHost,
        batch_requests: this.config.batchRequests
      });

      this.initialized = true;
      logger.info('Mixpanel initialized', { token: this.config.token });
      return true;
    } catch (error) {
      logger.error('Failed to initialize Mixpanel', { error });
      return false;
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.mixpanel.track(event.type, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.properties
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async trackPageView(url: string, title?: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.mixpanel.track('Page View', {
        url,
        title,
        ...properties
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.mixpanel.identify(userId);
      if (properties) {
        this.mixpanel.people.set(properties);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.mixpanel.track('Performance Metrics', {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        ttfb: metrics.ttfb,
        fcp: metrics.fcp,
        loadTime: metrics.loadTime,
        domContentLoaded: metrics.domContentLoaded
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async flush(): Promise<void> {
    if (this.isEnabled() && this.mixpanel) {
      // Mixpanel handles batching automatically
    }
  }
}

// Custom Analytics Integration (for internal API)
class CustomAnalyticsIntegration extends AnalyticsIntegration {
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: any) {
    super('Custom Analytics', config);
  }

  async initialize(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    this.initialized = true;
    this.startFlushTimer();
    logger.info('Custom Analytics initialized');
    return true;
  }

  async trackEvent(event: AnalyticsEvent): Promise<IntegrationResponse> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integration not enabled' };
    }

    try {
      this.eventQueue.push(event);
      
      if (this.eventQueue.length >= analyticsConfig.batchSize) {
        await this.flush();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async trackPageView(url: string, title?: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    const event: AnalyticsEvent = {
      type: AnalyticsEventType.PAGE_LOAD,
      category: 'navigation',
      properties: {
        url,
        title,
        ...properties
      },
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    return this.trackEvent(event);
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<IntegrationResponse> {
    const event: AnalyticsEvent = {
      type: AnalyticsEventType.USER_LOGIN,
      category: 'user',
      properties: {
        userId,
        ...properties
      },
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userId
    };

    return this.trackEvent(event);
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<IntegrationResponse> {
    const event: AnalyticsEvent = {
      type: AnalyticsEventType.PAGE_LOAD,
      category: 'performance',
      properties: metrics,
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    return this.trackEvent(event);
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(analyticsConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug('Analytics events flushed', { count: events.length });
    } catch (error) {
      logger.error('Failed to flush analytics events', { error, count: events.length });
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, analyticsConfig.flushInterval);
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('analytics-session-id') || 'unknown';
    }
    return 'server';
  }

  private getUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('analytics-user-id') || undefined;
    }
    return undefined;
  }
}

// Analytics Integration Manager
class AnalyticsIntegrationManager {
  private integrations: Map<string, AnalyticsIntegration> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = analyticsConfig.integrations;

    // Initialize Google Analytics
    if (config.googleAnalytics.enabled) {
      const ga = new GoogleAnalyticsIntegration(config.googleAnalytics);
      if (await ga.initialize()) {
        this.integrations.set('googleAnalytics', ga);
      }
    }

    // Initialize Mixpanel
    if (config.mixpanel.enabled) {
      const mp = new MixpanelIntegration(config.mixpanel);
      if (await mp.initialize()) {
        this.integrations.set('mixpanel', mp);
      }
    }

    // Initialize Custom Analytics
    const custom = new CustomAnalyticsIntegration({ enabled: true });
    if (await custom.initialize()) {
      this.integrations.set('custom', custom);
    }

    this.initialized = true;
    logger.info('Analytics integrations initialized', {
      count: this.integrations.size,
      integrations: Array.from(this.integrations.keys())
    });
  }

  async trackEvent(event: AnalyticsEvent): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];

    for (const [name, integration] of this.integrations) {
      try {
        const response = await integration.trackEvent(event);
        results.push({
          integration: name,
          success: response.success,
          processed: response.success ? 1 : 0,
          failed: response.success ? 0 : 1,
          errors: response.error ? [response.error] : undefined
        });
      } catch (error) {
        results.push({
          integration: name,
          success: false,
          processed: 0,
          failed: 1,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  async trackPageView(url: string, title?: string, properties?: Record<string, any>): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];

    for (const [name, integration] of this.integrations) {
      try {
        const response = await integration.trackPageView(url, title, properties);
        results.push({
          integration: name,
          success: response.success,
          processed: response.success ? 1 : 0,
          failed: response.success ? 0 : 1,
          errors: response.error ? [response.error] : undefined
        });
      } catch (error) {
        results.push({
          integration: name,
          success: false,
          processed: 0,
          failed: 1,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  async identifyUser(userId: string, properties?: Record<string, any>): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];

    for (const [name, integration] of this.integrations) {
      try {
        const response = await integration.identifyUser(userId, properties);
        results.push({
          integration: name,
          success: response.success,
          processed: response.success ? 1 : 0,
          failed: response.success ? 0 : 1,
          errors: response.error ? [response.error] : undefined
        });
      } catch (error) {
        results.push({
          integration: name,
          success: false,
          processed: 0,
          failed: 1,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<BatchResponse[]> {
    const results: BatchResponse[] = [];

    for (const [name, integration] of this.integrations) {
      try {
        const response = await integration.trackPerformance(metrics);
        results.push({
          integration: name,
          success: response.success,
          processed: response.success ? 1 : 0,
          failed: response.success ? 0 : 1,
          errors: response.error ? [response.error] : undefined
        });
      } catch (error) {
        results.push({
          integration: name,
          success: false,
          processed: 0,
          failed: 1,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  async flush(): Promise<void> {
    const promises = Array.from(this.integrations.values()).map(integration => 
      integration.flush().catch(error => 
        logger.error(`Failed to flush ${integration.getName()}`, { error })
      )
    );

    await Promise.all(promises);
  }

  getEnabledIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }

  getIntegration(name: string): AnalyticsIntegration | undefined {
    return this.integrations.get(name);
  }
}

// Export singleton instance
export const analyticsIntegrationManager = new AnalyticsIntegrationManager();

// Export types and classes for testing
export {
  AnalyticsIntegration,
  GoogleAnalyticsIntegration,
  MixpanelIntegration,
  CustomAnalyticsIntegration,
  AnalyticsIntegrationManager,
  IntegrationResponse,
  BatchResponse
};

export default analyticsIntegrationManager;