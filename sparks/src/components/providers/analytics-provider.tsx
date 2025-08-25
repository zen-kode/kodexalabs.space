'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analytics, AnalyticsConfig } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/use-auth';

interface AnalyticsContextValue {
  isInitialized: boolean;
  isEnabled: boolean;
  config: AnalyticsConfig;
  userId?: string;
  sessionId: string;
  enable: () => void;
  disable: () => void;
  updateConfig: (config: Partial<AnalyticsConfig>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  config?: Partial<AnalyticsConfig>;
  enableByDefault?: boolean;
  respectDoNotTrack?: boolean;
  requireConsent?: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  apiEndpoint: '/api/analytics',
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableUserBehaviorTracking: true,
  enableConversionTracking: true,
  enableDebugMode: process.env.NODE_ENV === 'development',
  maxRetries: 3,
  retryDelay: 1000,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableOfflineSupport: true,
  enableDataCompression: true,
  enableCrossDomainTracking: false,
  enableHeatmapTracking: false,
  enableScrollTracking: true,
  enableClickTracking: true,
  enableFormTracking: true,
  enableVideoTracking: false,
  enableFileDownloadTracking: true,
  enableExternalLinkTracking: true,
  enablePageTimingTracking: true,
  enableCustomDimensions: true,
  enableABTesting: false,
  enableRealTimeTracking: false,
  enableGeolocationTracking: false,
  enableDeviceTracking: true,
  enableBrowserTracking: true,
  enableReferrerTracking: true,
  enableCampaignTracking: true,
  enableEcommerceTracking: false,
  enableSocialTracking: false,
  enableSearchTracking: true,
  enableContentTracking: true,
  enableInteractionTracking: true,
  enableEngagementTracking: true,
  enableRetentionTracking: true,
  enableFunnelTracking: true,
  enableCohortTracking: false,
  enableSegmentationTracking: false,
  enablePersonalizationTracking: false,
  enablePredictiveTracking: false,
  enableMLTracking: false,
  enableAITracking: true,
  enableBlockchainTracking: false,
  enableIoTTracking: false,
  enableARVRTracking: false,
  enableVoiceTracking: false,
  enableBiometricTracking: false,
  enableQuantumTracking: false
};

export function AnalyticsProvider({
  children,
  config = {},
  enableByDefault = true,
  respectDoNotTrack = true,
  requireConsent = false
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AnalyticsConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const { user } = useAuth();
  const userId = user?.id;

  // Check if analytics should be enabled
  const shouldEnableAnalytics = () => {
    // Respect Do Not Track header
    if (respectDoNotTrack && navigator.doNotTrack === '1') {
      logger.info('Analytics disabled due to Do Not Track preference');
      return false;
    }

    // Check for consent if required
    if (requireConsent) {
      const consent = localStorage.getItem('analytics-consent');
      if (consent !== 'granted') {
        logger.info('Analytics disabled - consent not granted');
        return false;
      }
    }

    // Check if explicitly disabled
    const disabled = localStorage.getItem('analytics-disabled');
    if (disabled === 'true') {
      logger.info('Analytics disabled by user preference');
      return false;
    }

    return enableByDefault;
  };

  // Initialize analytics
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        const shouldEnable = shouldEnableAnalytics();
        
        if (shouldEnable) {
          // Initialize analytics service
          analytics.initialize(currentConfig);
          
          // Set user ID if available
          if (userId) {
            analytics.setUserId(userId);
          }
          
          // Set session ID
          analytics.setSessionId(sessionId);
          
          setIsEnabled(true);
          logger.info('Analytics initialized successfully', {
            userId: !!userId,
            sessionId,
            config: currentConfig
          });
        } else {
          logger.info('Analytics initialization skipped');
        }
        
        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize analytics', { error });
        setIsInitialized(true); // Still mark as initialized to prevent retries
      }
    };

    initializeAnalytics();
  }, [userId, sessionId, currentConfig]);

  // Update user ID when auth state changes
  useEffect(() => {
    if (isInitialized && isEnabled && userId) {
      analytics.setUserId(userId);
      analytics.track('user_login', {
        userId,
        timestamp: Date.now()
      });
    }
  }, [userId, isInitialized, isEnabled]);

  // Handle page visibility changes
  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.track('page_hidden', {
          timestamp: Date.now(),
          sessionId
        });
        analytics.flush(); // Ensure events are sent before page becomes hidden
      } else {
        analytics.track('page_visible', {
          timestamp: Date.now(),
          sessionId
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, sessionId]);

  // Handle online/offline events
  useEffect(() => {
    if (!isEnabled || !currentConfig.enableOfflineSupport) return;

    const handleOnline = () => {
      analytics.track('connection_online', {
        timestamp: Date.now(),
        sessionId
      });
      analytics.flush(); // Send queued events when back online
    };

    const handleOffline = () => {
      analytics.track('connection_offline', {
        timestamp: Date.now(),
        sessionId
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isEnabled, currentConfig.enableOfflineSupport, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEnabled) {
        analytics.track('session_end', {
          timestamp: Date.now(),
          sessionId,
          duration: Date.now() - parseInt(sessionId.split('_')[1])
        });
        analytics.flush();
      }
    };
  }, [isEnabled, sessionId]);

  const enable = () => {
    localStorage.removeItem('analytics-disabled');
    if (requireConsent) {
      localStorage.setItem('analytics-consent', 'granted');
    }
    
    if (!isEnabled) {
      analytics.initialize(currentConfig);
      if (userId) {
        analytics.setUserId(userId);
      }
      analytics.setSessionId(sessionId);
      setIsEnabled(true);
      
      analytics.track('analytics_enabled', {
        timestamp: Date.now(),
        sessionId
      });
      
      logger.info('Analytics enabled by user');
    }
  };

  const disable = () => {
    if (isEnabled) {
      analytics.track('analytics_disabled', {
        timestamp: Date.now(),
        sessionId
      });
      analytics.flush();
      setIsEnabled(false);
    }
    
    localStorage.setItem('analytics-disabled', 'true');
    if (requireConsent) {
      localStorage.removeItem('analytics-consent');
    }
    
    logger.info('Analytics disabled by user');
  };

  const updateConfig = (newConfig: Partial<AnalyticsConfig>) => {
    const updatedConfig = { ...currentConfig, ...newConfig };
    setCurrentConfig(updatedConfig);
    
    if (isEnabled) {
      analytics.updateConfig(updatedConfig);
      analytics.track('analytics_config_updated', {
        timestamp: Date.now(),
        sessionId,
        changes: Object.keys(newConfig)
      });
    }
    
    logger.info('Analytics config updated', { changes: newConfig });
  };

  const contextValue: AnalyticsContextValue = {
    isInitialized,
    isEnabled,
    config: currentConfig,
    userId,
    sessionId,
    enable,
    disable,
    updateConfig
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics context
 */
export function useAnalyticsContext(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  
  return context;
}

/**
 * Component for analytics consent banner
 */
interface AnalyticsConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
  className?: string;
}

export function AnalyticsConsentBanner({ 
  onAccept, 
  onDecline, 
  className = '' 
}: AnalyticsConsentBannerProps) {
  const { enable, disable, isEnabled } = useAnalyticsContext();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('analytics-consent');
    const disabled = localStorage.getItem('analytics-disabled');
    
    // Show banner if no preference has been set
    if (!consent && disabled !== 'true' && !isEnabled) {
      setShowBanner(true);
    }
  }, [isEnabled]);

  const handleAccept = () => {
    enable();
    setShowBanner(false);
    onAccept?.();
  };

  const handleDecline = () => {
    disable();
    setShowBanner(false);
    onDecline?.();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-50 ${className}`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            We use analytics to improve your experience. Your data is anonymized and never shared with third parties.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsProvider;