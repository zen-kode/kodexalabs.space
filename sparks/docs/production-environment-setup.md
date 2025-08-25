# Production Environment Setup Guide

This guide will help you configure all necessary environment variables for production deployment of your SPARKS application.

## Overview

SPARKS requires several environment variables to be configured for production:
- Database provider configuration (Supabase/Firebase)
- OAuth provider credentials
- AI service API keys
- Security secrets
- Analytics and monitoring
- Application URLs and settings

## Environment Files Structure

```
├── .env.local          # Local development (not committed)
├── .env.production     # Production template (committed)
├── .env.example        # Example template (committed)
└── .env               # Current environment (not committed)
```

## Required Environment Variables

### 1. Database Provider Selection

```bash
# Choose your primary database provider
# Options: 'supabase' | 'firebase' | 'mock'
NEXT_PUBLIC_DATABASE_PROVIDER=supabase
```

**Recommendation**: Use `supabase` for production due to its PostgreSQL backend and advanced features.

### 2. Supabase Configuration (Primary)

```bash
# Supabase Project Settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/service_role keys

### 3. Firebase Configuration (Fallback)

```bash
# Firebase Project Settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll down to "Your apps" and select your web app
5. Copy the config object values

### 4. AI Service Configuration

```bash
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get Gemini API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key"
3. Create a new API key or use an existing one
4. Copy the API key

### 5. Authentication Configuration

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here_minimum_32_characters
NEXTAUTH_URL=https://kodexalabs.space
```

**How to generate NEXTAUTH_SECRET:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### 6. OAuth Provider Configuration

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### GitHub OAuth
```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

#### Discord OAuth
```bash
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
```

**Note**: Refer to the [OAuth Setup Guide](./oauth-setup-guide.md) for detailed instructions on obtaining these credentials.

### 7. Application Configuration

```bash
# Environment and URLs
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kodexalabs.space

# Feature Flags
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### 8. Optional: Analytics Configuration

```bash
# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 9. Optional: Error Tracking

```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn@sentry.io/project-id
```

## Deployment Platform Configuration

### Vercel Deployment

1. **Via Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each variable with appropriate environment (Production, Preview, Development)

2. **Via Vercel CLI:**
   ```bash
   # Add production environment variables
   vercel env add NEXT_PUBLIC_DATABASE_PROVIDER production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   # ... add all other variables
   ```

3. **Via .env file upload:**
   ```bash
   # Upload your .env file (be careful with secrets!)
   vercel env pull .env.local
   ```

### Netlify Deployment

1. **Via Netlify Dashboard:**
   - Go to Site settings → Environment variables
   - Add each variable

2. **Via netlify.toml:**
   ```toml
   [build.environment]
     NEXT_PUBLIC_DATABASE_PROVIDER = "supabase"
     NODE_ENV = "production"
   ```

### Railway Deployment

1. **Via Railway Dashboard:**
   - Go to your project
   - Navigate to "Variables" tab
   - Add each environment variable

2. **Via Railway CLI:**
   ```bash
   railway variables set NEXT_PUBLIC_DATABASE_PROVIDER=supabase
   ```

## Security Best Practices

### 1. Environment Variable Security

- **Never commit secrets to version control**
- **Use different credentials for development and production**
- **Rotate secrets regularly (every 90 days)**
- **Use environment-specific values**

### 2. Access Control

- **Limit access to production environment variables**
- **Use service accounts for automated deployments**
- **Implement proper IAM roles and permissions**

### 3. Monitoring

- **Monitor for unauthorized access attempts**
- **Set up alerts for configuration changes**
- **Regularly audit environment variable usage**

## Validation and Testing

### 1. Environment Variable Validation

Create a validation script to check all required variables:

```javascript
// scripts/validate-env.js
const requiredVars = [
  'NEXT_PUBLIC_DATABASE_PROVIDER',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GITHUB_CLIENT_ID',
  'DISCORD_CLIENT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

### 2. Production Testing Checklist

- [ ] Database connection works
- [ ] Authentication flows work for all OAuth providers
- [ ] AI service responds correctly
- [ ] All API endpoints return expected responses
- [ ] Error tracking is capturing errors
- [ ] Analytics are recording events
- [ ] Performance monitoring is active

## Troubleshooting

### Common Issues

1. **"Environment variable not found" errors**
   - Check variable names for typos
   - Ensure variables are set in the correct environment
   - Restart your application after adding variables

2. **OAuth redirect URI mismatches**
   - Update OAuth provider settings with production URLs
   - Ensure NEXTAUTH_URL matches your domain

3. **Database connection failures**
   - Verify database URLs and credentials
   - Check network connectivity and firewall rules
   - Ensure database is running and accessible

4. **API key authentication failures**
   - Verify API keys are correct and active
   - Check API key permissions and quotas
   - Ensure API keys are for the correct environment

### Debug Commands

```bash
# Check environment variables (be careful not to expose secrets)
node -e "console.log(Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))"

# Test database connection
npm run test:connection

# Validate environment configuration
node scripts/validate-env.js
```

## Migration from Development to Production

### Step-by-Step Migration

1. **Backup current configuration**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Update database provider**
   ```bash
   # Change from mock/development to production
   NEXT_PUBLIC_DATABASE_PROVIDER=supabase
   ```

3. **Replace all placeholder values**
   - Remove all `your_*_here` placeholders
   - Add real production credentials
   - Update URLs to production domains

4. **Test configuration**
   ```bash
   npm run build
   npm run start
   ```

5. **Deploy to production**
   ```bash
   vercel --prod
   # or your preferred deployment method
   ```

## Maintenance

### Regular Tasks

- **Monthly**: Review and rotate secrets
- **Quarterly**: Audit environment variable usage
- **Annually**: Update OAuth application settings
- **As needed**: Update API keys and credentials

### Monitoring

- Set up alerts for environment variable changes
- Monitor API usage and quotas
- Track authentication success/failure rates
- Monitor database performance and connectivity

## Support

For additional help with environment configuration:
1. Check the application logs for specific error messages
2. Verify each service's documentation for latest requirements
3. Test individual components in isolation
4. Contact support for your hosting platform if deployment-specific issues occur

---

**Next Steps**: After configuring production environment variables, proceed to:
1. [Authentication Security Configuration](./auth-security-guide.md)
2. [Error Handling and Logging Setup](./error-handling-guide.md)
3. [Analytics and Monitoring Configuration](./analytics-setup-guide.md)