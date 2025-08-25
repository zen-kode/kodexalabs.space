'use client'

import { useCallback } from 'react'
import { DashboardAnalyticsEvent } from '@/components/dashboard/types'

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean
  debug: boolean
  trackingId?: string
}

const defaultConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID
}

// Analytics providers interface
interface AnalyticsProvider {
  track: (event: DashboardAnalyticsEvent) => void
  identify: (userId: string, traits?: Record<string, any>) => void
  page: (name: string, properties?: Record<string, any>) => void
}

// Console analytics provider (for development)
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: DashboardAnalyticsEvent) {
    console.log('📊 Analytics Event:', {
      timestamp: new Date().toISOString(),
      ...event
    })
  }

  identify(userId: string, traits?: Record<string, any>) {
    console.log('👤 User Identified:', { userId, traits })
  }

  page(name: string, properties?: Record<string, any>) {
    console.log('📄 Page View:', { name, properties })
  }
}

// Google Analytics provider (placeholder)
class GoogleAnalyticsProvider implements AnalyticsProvider {
  private trackingId: string

  constructor(trackingId: string) {
    this.trackingId = trackingId
  }

  track(event: DashboardAnalyticsEvent) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.component,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.metadata
      })
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.trackingId, {
        user_id: userId,
        custom_map: traits
      })
    }
  }

  page(name: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.trackingId, {
        page_title: name,
        page_location: window.location.href,
        ...properties
      })
    }
  }
}

// Analytics hook
export function useAnalytics(config: Partial<AnalyticsConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  
  // Initialize provider based on environment
  const provider: AnalyticsProvider = finalConfig.debug 
    ? new ConsoleAnalyticsProvider()
    : finalConfig.trackingId 
      ? new GoogleAnalyticsProvider(finalConfig.trackingId)
      : new ConsoleAnalyticsProvider()

  const track = useCallback((event: DashboardAnalyticsEvent) => {
    if (!finalConfig.enabled) return
    
    try {
      provider.track({
        ...event,
        metadata: {
          timestamp: Date.now(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          ...event.metadata
        }
      })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [finalConfig.enabled, provider])

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    if (!finalConfig.enabled) return
    
    try {
      provider.identify(userId, traits)
    } catch (error) {
      console.error('Analytics identify error:', error)
    }
  }, [finalConfig.enabled, provider])

  const page = useCallback((name: string, properties?: Record<string, any>) => {
    if (!finalConfig.enabled) return
    
    try {
      provider.page(name, properties)
    } catch (error) {
      console.error('Analytics page error:', error)
    }
  }, [finalConfig.enabled, provider])

  // Dashboard-specific tracking helpers
  const trackDashboardEvent = useCallback((component: DashboardAnalyticsEvent['component'], action: DashboardAnalyticsEvent['action'], label?: string, metadata?: Record<string, any>) => {
    track({
      component,
      action,
      label,
      metadata
    })
  }, [track])

  const trackComponentView = useCallback((component: DashboardAnalyticsEvent['component'], metadata?: Record<string, any>) => {
    trackDashboardEvent(component, 'view', undefined, metadata)
  }, [trackDashboardEvent])

  const trackComponentClick = useCallback((component: DashboardAnalyticsEvent['component'], label: string, metadata?: Record<string, any>) => {
    trackDashboardEvent(component, 'click', label, metadata)
  }, [trackDashboardEvent])

  const trackComponentClose = useCallback((component: DashboardAnalyticsEvent['component'], metadata?: Record<string, any>) => {
    trackDashboardEvent(component, 'close', undefined, metadata)
  }, [trackDashboardEvent])

  const trackNavigation = useCallback((component: DashboardAnalyticsEvent['component'], destination: string, metadata?: Record<string, any>) => {
    trackDashboardEvent(component, 'navigate', destination, metadata)
  }, [trackDashboardEvent])

  return {
    track,
    identify,
    page,
    trackDashboardEvent,
    trackComponentView,
    trackComponentClick,
    trackComponentClose,
    trackNavigation,
    config: finalConfig
  }
}

export default useAnalytics