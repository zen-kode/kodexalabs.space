# Analytics System Guide

This guide covers the comprehensive analytics system implemented in SPARKS, including setup, configuration, usage, and best practices.

## Overview

The SPARKS analytics system provides:
- **Multi-provider support**: Google Analytics, Mixpanel, Amplitude, Hotjar, and custom analytics
- **Real-time tracking**: Events, page views, user behavior, and performance metrics
- **Privacy compliance**: GDPR-compliant with consent management
- **Performance monitoring**: Core Web Vitals and custom performance metrics
- **Admin dashboard**: Comprehensive analytics management interface
- **Data export**: CSV and JSON export capabilities

## Architecture

### Core Components

1. **Analytics Service** (`src/lib/analytics.ts`)
   - Main analytics interface
   - Event tracking and batching
   - Performance monitoring
   - User identification

2. **Integration Manager** (`src/lib/analytics-integrations.ts`)
   - Multi-provider integration
   - Batch processing
   - Error handling and retry logic

3. **Analytics Utilities** (`src/lib/analytics-utils.ts`)
   - Data processing and aggregation
   - Device detection
   - Session management
   - Performance analysis

4. **React Hooks** (`src/hooks/use-analytics.ts`)
   - React integration
   - Component-level tracking
   - Automatic page view tracking

5. **Provider Components** (`src/components/providers/analytics-provider.tsx`)
   - Context management
   - Consent handling
   - Initialization

## Setup and Configuration

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure your analytics providers:

```bash
# Basic Configuration
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_DEBUG=false

# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA4_ENABLED=true

# Mixpanel (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here
NEXT_PUBLIC_MIXPANEL_ENABLED=false

# Custom Analytics
ANALYTICS_API_KEY=your_custom_analytics_api_key_here
```

### 2. Provider Setup

#### Google Analytics 4
1. Create a GA4 property in Google Analytics
2. Copy the Measurement ID (G-XXXXXXXXXX)
3. Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID` in your environment
4. Enable with `NEXT_PUBLIC_GA4_ENABLED=true`

#### Mixpanel
1. Create a Mixpanel project
2. Copy the project token
3. Set `NEXT_PUBLIC_MIXPANEL_TOKEN` in your environment
4. Enable with `NEXT_PUBLIC_MIXPANEL_ENABLED=true`

#### Custom Analytics
1. Set up your custom analytics API endpoint
2. Configure `ANALYTICS_API_KEY` for authentication
3. The system will automatically use `/api/analytics` endpoint

### 3. Privacy and Compliance

```bash
# Enable consent management
NEXT_PUBLIC_ANALYTICS_CONSENT_REQUIRED=true
NEXT_PUBLIC_ANALYTICS_COOKIE_CONSENT=true
NEXT_PUBLIC_ANALYTICS_GDPR_COMPLIANCE=true
```

## Usage

### Basic Event Tracking

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleButtonClick = () => {
    trackEvent({
      type: 'button_click',
      category: 'ui',
      label: 'cta_button',
      value: 1,
      properties: {
        location: 'header',
        variant: 'primary'
      }
    });
  };

  return <button onClick={handleButtonClick}>Click me</button>;
}
```

### Page View Tracking

```typescript
import { useAnalytics } from '@/hooks/use-analytics';
import { useEffect } from 'react';

function MyPage() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('/my-page', 'My Page Title', {
      section: 'main',
      authenticated: true
    });
  }, [trackPageView]);

  return <div>My Page Content</div>;
}
```

### User Identification

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function LoginComponent() {
  const { identifyUser } = useAnalytics();

  const handleLogin = async (user) => {
    // After successful login
    identifyUser(user.id, {
      email: user.email,
      name: user.name,
      plan: user.subscription?.plan,
      signupDate: user.createdAt
    });
  };

  return <LoginForm onLogin={handleLogin} />;
}
```

### Performance Tracking

```typescript
import { useAnalytics } from '@/hooks/use-analytics';

function MyComponent() {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    // Track custom performance metric
    const startTime = performance.now();
    
    // Some operation
    doSomething().then(() => {
      const duration = performance.now() - startTime;
      trackPerformance({
        customMetric: duration,
        operation: 'data_load',
        url: window.location.pathname
      });
    });
  }, [trackPerformance]);
}
```

### Component-Level Analytics

```typescript
import { useComponentAnalytics } from '@/hooks/use-analytics';

function ProductCard({ product }) {
  const analytics = useComponentAnalytics('ProductCard', {
    productId: product.id,
    category: product.category
  });

  const handleView = () => {
    analytics.trackEvent('product_view', {
      price: product.price,
      inStock: product.inStock
    });
  };

  const handleClick = () => {
    analytics.trackEvent('product_click', {
      position: 'grid'
    });
  };

  useEffect(() => {
    handleView();
  }, []);

  return (
    <div onClick={handleClick}>
      {/* Product content */}
    </div>
  );
}
```

## Event Types and Categories

### Standard Event Types

- `page_view` - Page navigation
- `user_action` - User interactions
- `conversion` - Goal completions
- `error` - Error occurrences
- `performance` - Performance metrics
- `ai_interaction` - AI-related events
- `prompt_action` - Prompt-specific events
- `tool_usage` - Tool usage events

### Event Categories

- `navigation` - Page and route changes
- `ui` - User interface interactions
- `auth` - Authentication events
- `ai` - AI and ML interactions
- `business` - Business logic events
- `performance` - Performance and technical metrics
- `error` - Error and exception tracking

### Example Events

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

// Tool usage
trackEvent({
  type: 'tool_usage',
  category: 'business',
  label: 'prompt_optimizer_used',
  properties: {
    originalLength: 100,
    optimizedLength: 75,
    improvement: 25
  }
});
```

## Admin Dashboard

Access the analytics dashboard at `/admin/analytics` to:

- View real-time analytics data
- Monitor integration status
- Export data in CSV or JSON format
- Manage data retention
- Clear analytics data

### Dashboard Features

1. **Overview Metrics**
   - Total events, users, sessions
   - Conversion rates and engagement
   - Performance summaries

2. **Integration Status**
   - Provider connection status
   - Event counts per integration
   - Last sync timestamps

3. **Data Export**
   - CSV export for spreadsheet analysis
   - JSON export for custom processing
   - Filtered exports by date range

4. **Data Management**
   - Clear old data
   - Manage retention policies
   - Bulk operations

## API Endpoints

### GET /api/analytics

Retrieve analytics data with optional filtering:

```bash
# Get last 7 days of data
GET /api/analytics?range=7d

# Get specific event type
GET /api/analytics?type=conversion&range=30d

# Export as CSV
GET /api/analytics?format=csv&range=7d
```

### POST /api/analytics

Track events and performance metrics:

```bash
POST /api/analytics
Content-Type: application/json

{
  "events": [
    {
      "type": "user_action",
      "category": "ui",
      "properties": {
        "action": "button_click",
        "element": "cta"
      }
    }
  ]
}
```

### DELETE /api/analytics

Clear analytics data (admin only):

```bash
DELETE /api/analytics
Content-Type: application/json

{
  "confirm": true,
  "olderThan": "2024-01-01"
}
```

## Performance Monitoring

### Core Web Vitals

The system automatically tracks:
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **TTFB (Time to First Byte)**: Server response time

### Custom Performance Metrics

```typescript
// Track API response times
const startTime = performance.now();
const response = await fetch('/api/data');
const duration = performance.now() - startTime;

trackPerformance({
  apiResponseTime: duration,
  endpoint: '/api/data',
  status: response.status
});

// Track component render times
const renderStart = performance.now();
// Component rendering
const renderTime = performance.now() - renderStart;

trackPerformance({
  componentRenderTime: renderTime,
  componentName: 'ProductList',
  itemCount: products.length
});
```

## Privacy and Compliance

### GDPR Compliance

1. **Consent Management**
   - User consent banner
   - Granular consent options
   - Consent withdrawal

2. **Data Minimization**
   - Only collect necessary data
   - Automatic data anonymization
   - Configurable retention periods

3. **User Rights**
   - Data export functionality
   - Data deletion capabilities
   - Transparency in data usage

### Cookie Management

```typescript
// Check consent before tracking
if (hasAnalyticsConsent()) {
  trackEvent({
    type: 'user_action',
    category: 'ui',
    label: 'button_click'
  });
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

## Best Practices

### 1. Event Naming

- Use consistent naming conventions
- Include context in event properties
- Avoid PII in event names

```typescript
// Good
trackEvent({
  type: 'prompt_created',
  category: 'ai',
  properties: {
    promptType: 'creative',
    wordCount: 150,
    model: 'gemini-pro'
  }
});

// Avoid
trackEvent({
  type: 'user_john_created_prompt', // Contains PII
  category: 'misc' // Too generic
});
```

### 2. Performance Considerations

- Use batching for high-frequency events
- Implement sampling for performance events
- Avoid blocking the main thread

```typescript
// Batch events
const events = [];
events.push(event1, event2, event3);
flushEvents(events);

// Sample performance events
if (Math.random() < 0.1) { // 10% sampling
  trackPerformance(metrics);
}
```

### 3. Error Handling

- Always handle analytics failures gracefully
- Don't let analytics errors break functionality
- Log analytics errors for debugging

```typescript
try {
  trackEvent(event);
} catch (error) {
  logger.error('Analytics tracking failed', { error, event });
  // Continue with normal flow
}
```

### 4. Testing

- Use debug mode during development
- Test with different consent states
- Verify data in analytics dashboards

```typescript
// Enable debug mode
if (process.env.NODE_ENV === 'development') {
  analytics.setDebugMode(true);
}

// Test consent scenarios
if (process.env.NODE_ENV === 'test') {
  analytics.setConsentForTesting(true);
}
```

## Troubleshooting

### Common Issues

1. **Events not appearing in GA4**
   - Check Measurement ID configuration
   - Verify consent is granted
   - Check browser ad blockers
   - Review debug logs

2. **High bounce rate**
   - Ensure page view events are firing
   - Check session timeout configuration
   - Verify event timing

3. **Performance impact**
   - Enable batching
   - Reduce event frequency
   - Use sampling for high-volume events

4. **GDPR compliance issues**
   - Implement consent management
   - Review data collection practices
   - Ensure data retention policies

### Debug Mode

Enable debug mode to see detailed logging:

```bash
NEXT_PUBLIC_ANALYTICS_DEBUG=true
```

This will log:
- Event tracking attempts
- Integration status
- API requests and responses
- Error details

### Health Checks

Monitor analytics health:

```typescript
// Check integration status
const status = await analytics.getIntegrationStatus();
console.log('Analytics integrations:', status);

// Verify event delivery
const testEvent = {
  type: 'test_event',
  category: 'system',
  properties: { timestamp: Date.now() }
};

const result = await analytics.trackEvent(testEvent);
console.log('Test event result:', result);
```

## Migration Guide

### From Google Analytics Universal

1. Update Measurement ID format (UA-XXXXX to G-XXXXX)
2. Review event structure (GA4 uses different event model)
3. Update custom dimensions and metrics
4. Test event tracking in GA4 interface

### Adding New Integrations

1. Create integration class extending `AnalyticsIntegration`
2. Implement required methods
3. Add to integration manager
4. Update configuration
5. Test integration

```typescript
class NewIntegration extends AnalyticsIntegration {
  async initialize(): Promise<boolean> {
    // Initialize integration
  }

  async trackEvent(event: AnalyticsEvent): Promise<IntegrationResponse> {
    // Track event
  }

  // Implement other required methods
}
```

## Support

For issues or questions:

1. Check the debug logs
2. Review configuration settings
3. Test with minimal setup
4. Check provider documentation
5. Review integration status in admin dashboard

The analytics system is designed to be robust and fail gracefully, ensuring your application continues to function even if analytics tracking encounters issues.