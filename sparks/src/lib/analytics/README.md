# SPARKS Analytics System

A comprehensive, privacy-compliant analytics system with multi-provider support, real-time tracking, and advanced performance monitoring.

## 🚀 Quick Start

### 1. Install Dependencies

All required dependencies are already included in the project.

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your analytics provider credentials
```

**Minimum Required Configuration:**
```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Your GA4 Measurement ID
NEXT_PUBLIC_GA4_ENABLED=true
```

### 3. Basic Usage

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { trackEvent, trackPageView } = useAnalytics();

  // Track page view
  useEffect(() => {
    trackPageView('/my-page', 'My Page');
  }, []);

  // Track user action
  const handleClick = () => {
    trackEvent({
      type: 'user_action',
      category: 'ui',
      label: 'button_click',
      properties: { location: 'header' }
    });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## 📊 Features

### ✅ Multi-Provider Support
- **Google Analytics 4** - Web analytics and reporting
- **Mixpanel** - Advanced event tracking and user analytics
- **Amplitude** - Product analytics and user behavior
- **Hotjar** - Heatmaps and session recordings
- **Custom Analytics** - Internal analytics API

### ✅ Comprehensive Tracking
- **Events** - User actions, conversions, errors
- **Page Views** - Navigation and engagement
- **Performance** - Core Web Vitals, custom metrics
- **User Behavior** - Sessions, funnels, cohorts
- **AI Interactions** - Prompt usage, model performance

### ✅ Privacy & Compliance
- **GDPR Compliant** - Consent management and data rights
- **Cookie Control** - Granular consent options
- **Data Minimization** - Only collect necessary data
- **Anonymization** - Automatic PII protection

### ✅ Developer Experience
- **React Hooks** - Easy integration with React components
- **TypeScript** - Full type safety and IntelliSense
- **Debug Mode** - Detailed logging for development
- **Error Handling** - Graceful failure and retry logic

## 🏗️ Architecture

```
src/lib/analytics/
├── analytics.ts              # Main analytics service
├── analytics-integrations.ts # Multi-provider integration
├── analytics-utils.ts        # Utilities and helpers
└── README.md                # This file

src/hooks/
└── use-analytics.ts         # React hooks for analytics

src/components/
├── analytics/
│   └── analytics-dashboard.tsx  # Admin dashboard
└── providers/
    └── analytics-provider.tsx   # Context provider

src/app/api/analytics/
└── route.ts                 # Analytics API endpoints

src/middleware/
└── analytics.ts             # Server-side tracking

src/config/
└── analytics.ts             # Configuration settings
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Enable/disable analytics | Yes |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 ID | For GA4 |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel project token | For Mixpanel |
| `ANALYTICS_API_KEY` | Custom analytics API key | For custom API |
| `NEXT_PUBLIC_ANALYTICS_CONSENT_REQUIRED` | Require user consent | For GDPR |

### Provider Setup

#### Google Analytics 4
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy Measurement ID (format: G-XXXXXXXXXX)
3. Set environment variables:
   ```bash
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GA4_ENABLED=true
   ```

#### Mixpanel
1. Create project at [mixpanel.com](https://mixpanel.com)
2. Copy project token from settings
3. Set environment variables:
   ```bash
   NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
   NEXT_PUBLIC_MIXPANEL_ENABLED=true
   ```

## 📈 Usage Examples

### Event Tracking

```typescript
// User registration
trackEvent({
  type: 'conversion',
  category: 'auth',
  label: 'user_registration',
  value: 1,
  properties: {
    method: 'google',
    source: 'landing_page'
  }
});

// AI prompt generation
trackEvent({
  type: 'ai_interaction',
  category: 'ai',
  label: 'prompt_generated',
  properties: {
    promptType: 'creative',
    tokensUsed: 150,
    model: 'gemini-pro'
  }
});

// Error tracking
trackEvent({
  type: 'error',
  category: 'system',
  label: 'api_error',
  properties: {
    endpoint: '/api/prompts',
    statusCode: 500,
    errorMessage: 'Internal server error'
  }
});
```

### Performance Monitoring

```typescript
// Track API response time
const startTime = performance.now();
const response = await fetch('/api/data');
const duration = performance.now() - startTime;

trackPerformance({
  apiResponseTime: duration,
  endpoint: '/api/data',
  status: response.status
});

// Track component render time
const { trackComponentPerformance } = useComponentAnalytics('ProductList');

useEffect(() => {
  const startTime = performance.now();
  // Component logic
  const renderTime = performance.now() - startTime;
  
  trackComponentPerformance({
    renderTime,
    itemCount: products.length
  });
}, [products]);
```

### User Identification

```typescript
// After user login
const { identifyUser } = useAnalytics();

const handleLogin = (user) => {
  identifyUser(user.id, {
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan,
    signupDate: user.createdAt,
    // Don't include sensitive data
  });
};
```

### Conversion Tracking

```typescript
// Track subscription conversion
trackConversion('subscription', {
  plan: 'pro',
  value: 29.99,
  currency: 'USD',
  source: 'pricing_page'
});

// Track goal completion
trackConversion('prompt_optimization', {
  originalLength: 200,
  optimizedLength: 150,
  improvement: 25
});
```

## 🛠️ API Reference

### Analytics Service

```typescript
interface AnalyticsService {
  // Event tracking
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackPageView(path: string, title?: string, properties?: Record<string, any>): Promise<void>;
  trackConversion(type: string, properties?: Record<string, any>): Promise<void>;
  
  // User management
  identifyUser(userId: string, properties?: Record<string, any>): Promise<void>;
  setUserProperty(key: string, value: any): Promise<void>;
  
  // Performance tracking
  trackPerformance(metrics: PerformanceMetrics): Promise<void>;
  
  // Error tracking
  trackError(error: Error, context?: Record<string, any>): Promise<void>;
  
  // Utility methods
  flush(): Promise<void>;
  reset(): Promise<void>;
  getSessionId(): string;
}
```

### React Hooks

```typescript
// Main analytics hook
const {
  trackEvent,
  trackPageView,
  trackConversion,
  trackPerformance,
  trackError,
  identifyUser,
  setUserProperty
} = useAnalytics();

// Component-specific analytics
const {
  trackEvent: trackComponentEvent,
  trackPerformance: trackComponentPerformance
} = useComponentAnalytics('ComponentName', { prop1: 'value1' });
```

## 🔍 Admin Dashboard

Access the analytics dashboard at `/admin/analytics` to:

- **View Metrics**: Real-time analytics data and KPIs
- **Monitor Integrations**: Check provider connection status
- **Export Data**: Download analytics data in CSV or JSON
- **Manage Data**: Clear old data and manage retention

### Dashboard Features

- **Overview Cards**: Total events, users, sessions, conversion rate
- **Time Series Charts**: User activity and event trends
- **Top Events**: Most frequent user actions
- **Performance Metrics**: Core Web Vitals and custom metrics
- **Integration Status**: Real-time provider health checks

## 🐛 Debugging

### Enable Debug Mode

```bash
# In .env.local
NEXT_PUBLIC_ANALYTICS_DEBUG=true
```

This enables:
- Detailed console logging
- Event validation warnings
- Integration status messages
- API request/response logging

### Common Issues

1. **Events not appearing in GA4**
   - Verify Measurement ID format (G-XXXXXXXXXX)
   - Check user consent status
   - Disable ad blockers during testing
   - Review browser console for errors

2. **High server load**
   - Enable event batching
   - Increase flush interval
   - Implement sampling for high-frequency events

3. **GDPR compliance**
   - Enable consent management
   - Review data collection practices
   - Implement data retention policies

### Health Checks

```typescript
// Check integration status
const status = await analytics.getIntegrationStatus();
console.log('Integration health:', status);

// Test event tracking
const testResult = await analytics.trackEvent({
  type: 'test_event',
  category: 'system',
  properties: { timestamp: Date.now() }
});
```

## 🔒 Privacy & Security

### Data Protection

- **No PII Collection**: Automatically filters sensitive data
- **Data Anonymization**: IP addresses and user identifiers are hashed
- **Consent Management**: Granular consent for different tracking types
- **Data Retention**: Configurable retention periods
- **Secure Transmission**: All data sent over HTTPS

### GDPR Compliance

```typescript
// Check consent before tracking
if (hasAnalyticsConsent()) {
  trackEvent(event);
}

// Handle consent changes
onConsentChange((consent) => {
  if (consent.analytics) {
    initializeAnalytics();
  } else {
    disableAnalytics();
  }
});
```

## 📚 Additional Resources

- **[Complete Guide](../../docs/analytics-guide.md)** - Comprehensive documentation
- **[API Reference](../app/api/analytics/route.ts)** - Server-side API endpoints
- **[Configuration](../config/analytics.ts)** - All configuration options
- **[Middleware](../middleware/analytics.ts)** - Server-side tracking

## 🤝 Contributing

When adding new analytics features:

1. **Follow TypeScript patterns** - Maintain type safety
2. **Add proper error handling** - Never break user experience
3. **Include tests** - Test with different consent states
4. **Update documentation** - Keep guides current
5. **Consider privacy** - Follow GDPR guidelines

## 📄 License

This analytics system is part of the SPARKS project and follows the same license terms.