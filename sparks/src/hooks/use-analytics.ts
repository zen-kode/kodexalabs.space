'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { analytics, AnalyticsEventType } from '@/lib/analytics';
import { logger } from '@/lib/logger';

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  userId?: string;
  sessionId?: string;
}

interface TrackEventOptions {
  properties?: Record<string, any>;
  userId?: string;
  immediate?: boolean;
}

interface TrackPerformanceOptions {
  unit?: string;
  tags?: Record<string, string>;
  immediate?: boolean;
}

interface UseAnalyticsReturn {
  track: (eventType: AnalyticsEventType, options?: TrackEventOptions) => void;
  trackPageView: (path?: string, properties?: Record<string, any>) => void;
  trackUserAction: (action: string, properties?: Record<string, any>) => void;
  trackConversion: (type: string, value?: number, properties?: Record<string, any>) => void;
  trackPerformance: (name: string, value: number, options?: TrackPerformanceOptions) => void;
  trackError: (error: Error | string, context?: Record<string, any>) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
  startSession: () => void;
  endSession: () => void;
  isInitialized: boolean;
}

/**
 * Custom hook for analytics tracking
 * Provides easy-to-use methods for tracking events, page views, and user actions
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    trackPageViews = true,
    trackPerformance = true,
    trackErrors = true,
    userId,
    sessionId
  } = options;

  const router = useRouter();
  const isInitializedRef = useRef(false);
  const currentPathRef = useRef<string>('');
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Initialize analytics
  useEffect(() => {
    if (!isInitializedRef.current) {
      analytics.initialize();
      isInitializedRef.current = true;

      // Set user ID if provided
      if (userId) {
        analytics.setUserId(userId);
      }

      // Start session tracking
      if (trackPageViews) {
        startSession();
      }

      logger.debug('Analytics hook initialized', {
        trackPageViews,
        trackPerformance,
        trackErrors,
        userId: !!userId
      });
    }
  }, [userId, trackPageViews, trackPerformance, trackErrors]);

  // Track page views on route changes
  useEffect(() => {
    if (!trackPageViews || !isInitializedRef.current) return;

    const handleRouteChange = (url: string) => {
      // Avoid tracking the same page multiple times
      if (currentPathRef.current !== url) {
        currentPathRef.current = url;
        trackPageView(url);
      }
    };

    // Track initial page view
    const currentPath = window.location.pathname;
    if (currentPathRef.current !== currentPath) {
      currentPathRef.current = currentPath;
      trackPageView(currentPath);
    }

    // Note: Next.js 13+ app router doesn't have router events
    // We'll track page views manually when components mount
    
  }, [trackPageViews]);

  // Track performance metrics
  useEffect(() => {
    if (!trackPerformance || !isInitializedRef.current) return;

    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
          trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
        }
        
        if (entry.entryType === 'paint') {
          trackPerformance(entry.name.replace('-', '_'), entry.startTime);
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          trackPerformance('largest_contentful_paint', entry.startTime);
        }
        
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          trackPerformance('first_input_delay', fidEntry.processingStart - fidEntry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      logger.warn('Performance observer not supported', { error });
    }

    return () => {
      observer.disconnect();
    };
  }, [trackPerformance]);

  // Track errors
  useEffect(() => {
    if (!trackErrors || !isInitializedRef.current) return;

    const handleError = (event: ErrorEvent) => {
      trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(`Unhandled Promise Rejection: ${event.reason}`, {
        type: 'unhandled_promise_rejection',
        reason: event.reason
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackErrors]);

  // Track event
  const track = useCallback((eventType: AnalyticsEventType, options: TrackEventOptions = {}) => {
    if (!isInitializedRef.current) {
      logger.warn('Analytics not initialized, queuing event', { eventType });
    }

    const { properties = {}, userId: eventUserId, immediate = false } = options;
    
    // Add session context
    const enrichedProperties = {
      ...properties,
      sessionId: sessionId || analytics.getSessionId(),
      userId: eventUserId || userId,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer
    };

    analytics.track(eventType, enrichedProperties);

    if (immediate) {
      analytics.flush();
    }
  }, [userId, sessionId]);

  // Track page view
  const trackPageView = useCallback((path?: string, properties: Record<string, any> = {}) => {
    const currentPath = path || window.location.pathname;
    
    track('page_view', {
      properties: {
        ...properties,
        path: currentPath,
        title: document.title,
        search: window.location.search,
        hash: window.location.hash
      }
    });
  }, [track]);

  // Track user action
  const trackUserAction = useCallback((action: string, properties: Record<string, any> = {}) => {
    track('user_action', {
      properties: {
        ...properties,
        action,
        timestamp: Date.now()
      }
    });
  }, [track]);

  // Track conversion
  const trackConversion = useCallback((type: string, value?: number, properties: Record<string, any> = {}) => {
    track('conversion', {
      properties: {
        ...properties,
        conversionType: type,
        value,
        timestamp: Date.now()
      }
    });
  }, [track]);

  // Track performance metric
  const trackPerformance = useCallback((name: string, value: number, options: TrackPerformanceOptions = {}) => {
    const { unit = 'ms', tags = {}, immediate = false } = options;
    
    analytics.trackPerformance(name, value, unit, {
      ...tags,
      userId: userId,
      sessionId: sessionId || analytics.getSessionId()
    });

    if (immediate) {
      analytics.flush();
    }
  }, [userId, sessionId]);

  // Track error
  const trackError = useCallback((error: Error | string, context: Record<string, any> = {}) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    track('error', {
      properties: {
        ...context,
        error: errorMessage,
        stack: errorStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      immediate: true // Errors should be tracked immediately
    });
  }, [track]);

  // Identify user
  const identify = useCallback((userId: string, properties: Record<string, any> = {}) => {
    analytics.setUserId(userId);
    
    track('user_identify', {
      properties: {
        ...properties,
        userId,
        timestamp: Date.now()
      }
    });
  }, [track]);

  // Start session
  const startSession = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    
    track('session_start', {
      properties: {
        timestamp: sessionStartTimeRef.current,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    });
  }, [track]);

  // End session
  const endSession = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTimeRef.current;
    
    track('session_end', {
      properties: {
        duration: sessionDuration,
        timestamp: Date.now()
      },
      immediate: true
    });

    // Flush any remaining events
    analytics.flush();
  }, [track]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // End session on cleanup
      if (isInitializedRef.current) {
        endSession();
      }
    };
  }, [endSession]);

  return {
    track,
    trackPageView,
    trackUserAction,
    trackConversion,
    trackPerformance,
    trackError,
    identify,
    startSession,
    endSession,
    isInitialized: isInitializedRef.current
  };
}

/**
 * Hook for tracking component-specific analytics
 */
export function useComponentAnalytics(componentName: string, options: UseAnalyticsOptions = {}) {
  const analytics = useAnalytics(options);
  
  const trackComponentEvent = useCallback((event: string, properties: Record<string, any> = {}) => {
    analytics.track('component_event', {
      properties: {
        ...properties,
        component: componentName,
        event
      }
    });
  }, [analytics, componentName]);

  const trackComponentMount = useCallback((properties: Record<string, any> = {}) => {
    trackComponentEvent('mount', properties);
  }, [trackComponentEvent]);

  const trackComponentUnmount = useCallback((properties: Record<string, any> = {}) => {
    trackComponentEvent('unmount', properties);
  }, [trackComponentEvent]);

  const trackComponentInteraction = useCallback((interaction: string, properties: Record<string, any> = {}) => {
    trackComponentEvent('interaction', {
      ...properties,
      interaction
    });
  }, [trackComponentEvent]);

  // Track component mount/unmount
  useEffect(() => {
    trackComponentMount();
    
    return () => {
      trackComponentUnmount();
    };
  }, [trackComponentMount, trackComponentUnmount]);

  return {
    ...analytics,
    trackComponentEvent,
    trackComponentMount,
    trackComponentUnmount,
    trackComponentInteraction
  };
}

export default useAnalytics;