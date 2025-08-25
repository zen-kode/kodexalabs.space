export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  apiEndpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
  enablePageTracking: boolean;
  enableEventTracking: boolean;
  enableConversionTracking: boolean;
  enableHeatmaps: boolean;
  enableSessionRecording: boolean;
  enableABTesting: boolean;
  sampleRate: number;
  cookieConsent: boolean;
  anonymizeIP: boolean;
  dataRetentionDays: number;
  integrations: AnalyticsIntegrations;
  customDimensions: CustomDimension[];
  goals: AnalyticsGoal[];
  filters: AnalyticsFilter[];
}

export interface AnalyticsIntegrations {
  googleAnalytics: GoogleAnalyticsConfig;
  mixpanel: MixpanelConfig;
  amplitude: AmplitudeConfig;
  hotjar: HotjarConfig;
  fullstory: FullstoryConfig;
  segment: SegmentConfig;
  posthog: PosthogConfig;
  firebase: FirebaseAnalyticsConfig;
  custom: CustomAnalyticsConfig[];
}

export interface GoogleAnalyticsConfig {
  enabled: boolean;
  measurementId: string;
  trackingId?: string; // Legacy Universal Analytics
  enhancedEcommerce: boolean;
  anonymizeIP: boolean;
  cookieDomain: string;
  cookieExpires: number;
  sampleRate: number;
  siteSpeedSampleRate: number;
  customDimensions: Record<string, string>;
  customMetrics: Record<string, string>;
}

export interface MixpanelConfig {
  enabled: boolean;
  token: string;
  trackAutomaticEvents: boolean;
  batchRequests: boolean;
  crossSubdomainCookie: boolean;
  secureCookie: boolean;
  persistence: 'localStorage' | 'cookie';
  apiHost: string;
}

export interface AmplitudeConfig {
  enabled: boolean;
  apiKey: string;
  serverUrl?: string;
  batchEvents: boolean;
  eventUploadThreshold: number;
  eventUploadPeriodMillis: number;
  identifyBatchIntervalMillis: number;
  trackingOptions: {
    city: boolean;
    country: boolean;
    carrier: boolean;
    deviceManufacturer: boolean;
    deviceModel: boolean;
    dma: boolean;
    ipAddress: boolean;
    language: boolean;
    osName: boolean;
    osVersion: boolean;
    platform: boolean;
    region: boolean;
    versionName: boolean;
  };
}

export interface HotjarConfig {
  enabled: boolean;
  hjid: number;
  hjsv: number;
  trackClicks: boolean;
  trackMovement: boolean;
  trackFormSubmissions: boolean;
}

export interface FullstoryConfig {
  enabled: boolean;
  orgId: string;
  namespace: string;
  debug: boolean;
  captureOnlyThisHost: boolean;
}

export interface SegmentConfig {
  enabled: boolean;
  writeKey: string;
  apiHost?: string;
  integrations: Record<string, boolean>;
}

export interface PosthogConfig {
  enabled: boolean;
  apiKey: string;
  apiHost: string;
  autocapture: boolean;
  capturePageview: boolean;
  disableSessionRecording: boolean;
  enableRecordingConsole: boolean;
  recordCrossOriginIframes: boolean;
}

export interface FirebaseAnalyticsConfig {
  enabled: boolean;
  measurementId: string;
  automaticDataCollection: boolean;
  anonymizeIP: boolean;
  allowAdPersonalizationSignals: boolean;
  customParameters: Record<string, any>;
}

export interface CustomAnalyticsConfig {
  name: string;
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  batchSize: number;
  flushInterval: number;
}

export interface CustomDimension {
  index: number;
  name: string;
  scope: 'hit' | 'session' | 'user' | 'product';
  active: boolean;
}

export interface AnalyticsGoal {
  id: string;
  name: string;
  type: 'destination' | 'duration' | 'pages' | 'event';
  value?: number;
  conditions: GoalCondition[];
}

export interface GoalCondition {
  type: 'url' | 'event' | 'duration' | 'pages';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface AnalyticsFilter {
  name: string;
  type: 'include' | 'exclude';
  field: 'ip' | 'referrer' | 'page' | 'event' | 'user_agent';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  caseSensitive: boolean;
}

// Environment-based configuration
const getAnalyticsConfig = (): AnalyticsConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    enabled: isProduction || process.env.ENABLE_ANALYTICS === 'true',
    debug: isDevelopment || process.env.ANALYTICS_DEBUG === 'true',
    apiEndpoint: process.env.ANALYTICS_API_ENDPOINT || '/api/analytics',
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '10', 10),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '5000', 10),
    maxRetries: parseInt(process.env.ANALYTICS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.ANALYTICS_RETRY_DELAY || '1000', 10),
    enablePerformanceTracking: process.env.ENABLE_PERFORMANCE_TRACKING !== 'false',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
    enableUserTracking: process.env.ENABLE_USER_TRACKING !== 'false',
    enablePageTracking: process.env.ENABLE_PAGE_TRACKING !== 'false',
    enableEventTracking: process.env.ENABLE_EVENT_TRACKING !== 'false',
    enableConversionTracking: process.env.ENABLE_CONVERSION_TRACKING !== 'false',
    enableHeatmaps: process.env.ENABLE_HEATMAPS === 'true',
    enableSessionRecording: process.env.ENABLE_SESSION_RECORDING === 'true',
    enableABTesting: process.env.ENABLE_AB_TESTING === 'true',
    sampleRate: parseFloat(process.env.ANALYTICS_SAMPLE_RATE || '1.0'),
    cookieConsent: process.env.REQUIRE_COOKIE_CONSENT === 'true',
    anonymizeIP: process.env.ANONYMIZE_IP !== 'false',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
    
    integrations: {
      googleAnalytics: {
        enabled: !!process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID,
        measurementId: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID || '',
        trackingId: process.env.GOOGLE_ANALYTICS_TRACKING_ID,
        enhancedEcommerce: process.env.GA_ENHANCED_ECOMMERCE === 'true',
        anonymizeIP: process.env.GA_ANONYMIZE_IP !== 'false',
        cookieDomain: process.env.GA_COOKIE_DOMAIN || 'auto',
        cookieExpires: parseInt(process.env.GA_COOKIE_EXPIRES || '63072000', 10), // 2 years
        sampleRate: parseFloat(process.env.GA_SAMPLE_RATE || '100'),
        siteSpeedSampleRate: parseFloat(process.env.GA_SITE_SPEED_SAMPLE_RATE || '1'),
        customDimensions: {},
        customMetrics: {}
      },
      
      mixpanel: {
        enabled: !!process.env.MIXPANEL_TOKEN,
        token: process.env.MIXPANEL_TOKEN || '',
        trackAutomaticEvents: process.env.MIXPANEL_TRACK_AUTOMATIC !== 'false',
        batchRequests: process.env.MIXPANEL_BATCH_REQUESTS !== 'false',
        crossSubdomainCookie: process.env.MIXPANEL_CROSS_SUBDOMAIN === 'true',
        secureCookie: process.env.MIXPANEL_SECURE_COOKIE !== 'false',
        persistence: (process.env.MIXPANEL_PERSISTENCE as 'localStorage' | 'cookie') || 'cookie',
        apiHost: process.env.MIXPANEL_API_HOST || 'api.mixpanel.com'
      },
      
      amplitude: {
        enabled: !!process.env.AMPLITUDE_API_KEY,
        apiKey: process.env.AMPLITUDE_API_KEY || '',
        serverUrl: process.env.AMPLITUDE_SERVER_URL,
        batchEvents: process.env.AMPLITUDE_BATCH_EVENTS !== 'false',
        eventUploadThreshold: parseInt(process.env.AMPLITUDE_UPLOAD_THRESHOLD || '30', 10),
        eventUploadPeriodMillis: parseInt(process.env.AMPLITUDE_UPLOAD_PERIOD || '30000', 10),
        identifyBatchIntervalMillis: parseInt(process.env.AMPLITUDE_IDENTIFY_INTERVAL || '5000', 10),
        trackingOptions: {
          city: process.env.AMPLITUDE_TRACK_CITY !== 'false',
          country: process.env.AMPLITUDE_TRACK_COUNTRY !== 'false',
          carrier: process.env.AMPLITUDE_TRACK_CARRIER !== 'false',
          deviceManufacturer: process.env.AMPLITUDE_TRACK_DEVICE_MANUFACTURER !== 'false',
          deviceModel: process.env.AMPLITUDE_TRACK_DEVICE_MODEL !== 'false',
          dma: process.env.AMPLITUDE_TRACK_DMA !== 'false',
          ipAddress: process.env.AMPLITUDE_TRACK_IP !== 'false',
          language: process.env.AMPLITUDE_TRACK_LANGUAGE !== 'false',
          osName: process.env.AMPLITUDE_TRACK_OS_NAME !== 'false',
          osVersion: process.env.AMPLITUDE_TRACK_OS_VERSION !== 'false',
          platform: process.env.AMPLITUDE_TRACK_PLATFORM !== 'false',
          region: process.env.AMPLITUDE_TRACK_REGION !== 'false',
          versionName: process.env.AMPLITUDE_TRACK_VERSION !== 'false'
        }
      },
      
      hotjar: {
        enabled: !!process.env.HOTJAR_ID,
        hjid: parseInt(process.env.HOTJAR_ID || '0', 10),
        hjsv: parseInt(process.env.HOTJAR_VERSION || '6', 10),
        trackClicks: process.env.HOTJAR_TRACK_CLICKS !== 'false',
        trackMovement: process.env.HOTJAR_TRACK_MOVEMENT !== 'false',
        trackFormSubmissions: process.env.HOTJAR_TRACK_FORMS !== 'false'
      },
      
      fullstory: {
        enabled: !!process.env.FULLSTORY_ORG_ID,
        orgId: process.env.FULLSTORY_ORG_ID || '',
        namespace: process.env.FULLSTORY_NAMESPACE || 'FS',
        debug: process.env.FULLSTORY_DEBUG === 'true',
        captureOnlyThisHost: process.env.FULLSTORY_CAPTURE_ONLY_HOST !== 'false'
      },
      
      segment: {
        enabled: !!process.env.SEGMENT_WRITE_KEY,
        writeKey: process.env.SEGMENT_WRITE_KEY || '',
        apiHost: process.env.SEGMENT_API_HOST,
        integrations: {
          'Google Analytics': process.env.SEGMENT_GA_INTEGRATION !== 'false',
          'Mixpanel': process.env.SEGMENT_MIXPANEL_INTEGRATION !== 'false',
          'Amplitude': process.env.SEGMENT_AMPLITUDE_INTEGRATION !== 'false'
        }
      },
      
      posthog: {
        enabled: !!process.env.POSTHOG_API_KEY,
        apiKey: process.env.POSTHOG_API_KEY || '',
        apiHost: process.env.POSTHOG_API_HOST || 'https://app.posthog.com',
        autocapture: process.env.POSTHOG_AUTOCAPTURE !== 'false',
        capturePageview: process.env.POSTHOG_CAPTURE_PAGEVIEW !== 'false',
        disableSessionRecording: process.env.POSTHOG_DISABLE_SESSION_RECORDING === 'true',
        enableRecordingConsole: process.env.POSTHOG_ENABLE_CONSOLE === 'true',
        recordCrossOriginIframes: process.env.POSTHOG_CROSS_ORIGIN_IFRAMES === 'true'
      },
      
      firebase: {
        enabled: !!process.env.FIREBASE_MEASUREMENT_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
        automaticDataCollection: process.env.FIREBASE_AUTO_DATA_COLLECTION !== 'false',
        anonymizeIP: process.env.FIREBASE_ANONYMIZE_IP !== 'false',
        allowAdPersonalizationSignals: process.env.FIREBASE_AD_PERSONALIZATION !== 'false',
        customParameters: {}
      },
      
      custom: []
    },
    
    customDimensions: [
      {
        index: 1,
        name: 'User Type',
        scope: 'user',
        active: true
      },
      {
        index: 2,
        name: 'User Plan',
        scope: 'user',
        active: true
      },
      {
        index: 3,
        name: 'Feature Used',
        scope: 'hit',
        active: true
      },
      {
        index: 4,
        name: 'AI Model',
        scope: 'hit',
        active: true
      },
      {
        index: 5,
        name: 'Prompt Category',
        scope: 'hit',
        active: true
      }
    ],
    
    goals: [
      {
        id: 'signup',
        name: 'User Signup',
        type: 'event',
        conditions: [
          {
            type: 'event',
            operator: 'equals',
            value: 'user_signup'
          }
        ]
      },
      {
        id: 'prompt_creation',
        name: 'Prompt Creation',
        type: 'event',
        conditions: [
          {
            type: 'event',
            operator: 'equals',
            value: 'prompt_created'
          }
        ]
      },
      {
        id: 'tool_usage',
        name: 'Tool Usage',
        type: 'event',
        conditions: [
          {
            type: 'event',
            operator: 'equals',
            value: 'tool_used'
          }
        ]
      },
      {
        id: 'ai_interaction',
        name: 'AI Interaction',
        type: 'event',
        conditions: [
          {
            type: 'event',
            operator: 'equals',
            value: 'ai_request'
          }
        ]
      }
    ],
    
    filters: [
      {
        name: 'Exclude Internal Traffic',
        type: 'exclude',
        field: 'ip',
        operator: 'equals',
        value: '127.0.0.1',
        caseSensitive: false
      },
      {
        name: 'Exclude Bot Traffic',
        type: 'exclude',
        field: 'user_agent',
        operator: 'regex',
        value: '(bot|crawler|spider|scraper)',
        caseSensitive: false
      },
      {
        name: 'Exclude Development',
        type: 'exclude',
        field: 'referrer',
        operator: 'contains',
        value: 'localhost',
        caseSensitive: false
      }
    ]
  };
};

// Export the configuration
export const analyticsConfig = getAnalyticsConfig();

// Helper functions
export const isAnalyticsEnabled = (): boolean => {
  return analyticsConfig.enabled;
};

export const getEnabledIntegrations = (): string[] => {
  const integrations = analyticsConfig.integrations;
  return Object.keys(integrations).filter(key => {
    const integration = integrations[key as keyof typeof integrations];
    return Array.isArray(integration) 
      ? integration.some(i => i.enabled)
      : integration.enabled;
  });
};

export const shouldTrackEvent = (eventType: string): boolean => {
  if (!analyticsConfig.enabled) return false;
  
  switch (eventType) {
    case 'page_view':
      return analyticsConfig.enablePageTracking;
    case 'user_action':
      return analyticsConfig.enableEventTracking;
    case 'performance':
      return analyticsConfig.enablePerformanceTracking;
    case 'error':
      return analyticsConfig.enableErrorTracking;
    case 'conversion':
      return analyticsConfig.enableConversionTracking;
    default:
      return analyticsConfig.enableEventTracking;
  }
};

export const getConsentStatus = (): boolean => {
  if (!analyticsConfig.cookieConsent) return true;
  
  // Check for consent cookie or localStorage
  if (typeof window !== 'undefined') {
    const consent = localStorage.getItem('analytics-consent') || 
                   document.cookie.includes('analytics-consent=true');
    return !!consent;
  }
  
  return false;
};

export default analyticsConfig;