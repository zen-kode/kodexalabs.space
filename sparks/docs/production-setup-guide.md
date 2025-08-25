# Production Setup Guide

This guide provides step-by-step instructions to configure your application for production deployment with real services and data.

## 🚀 Quick Start Checklist

- [ ] Set up Supabase project and database
- [ ] Configure Google Gemini AI API
- [ ] Set up OAuth providers (Google, GitHub, Discord)
- [ ] Configure environment variables
- [ ] Set up authentication security
- [ ] Configure error handling and monitoring
- [ ] Set up analytics and logging
- [ ] Deploy to production

## 1. Supabase Database Setup

### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name and database password
5. Select region closest to your users
6. Wait for project creation (2-3 minutes)

### Get Supabase Credentials
1. Navigate to Settings > API in your project dashboard
2. Copy the following values:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon (public) key**: Used for client-side operations
   - **Service role key**: Used for server-side operations (keep secret!)

### Set Up Database Schema
Run the following SQL in the Supabase SQL Editor:

```sql
-- Create prompts table
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create user profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own prompts" ON prompts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Configure Authentication
1. Go to Authentication > Settings
2. Set Site URL: `https://kodexalabs.space`
3. Add redirect URLs:
   - `https://kodexalabs.space/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## 2. Google Gemini AI Setup

### Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Set usage limits and quotas as needed

### Configure API Settings
1. Enable the Generative Language API in Google Cloud Console
2. Set up billing if required
3. Configure API quotas and rate limits
4. Test the API key with a simple request

## 3. OAuth Providers Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://[your-project-id].supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (for local development)
7. Copy Client ID and Client Secret

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your app name
   - Homepage URL: `https://kodexalabs.space`
   - Authorization callback URL: `https://[your-project-id].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret

### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to OAuth2 section
4. Add redirect URI: `https://[your-project-id].supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### Configure OAuth in Supabase
1. Go to Authentication > Providers in Supabase
2. Enable each provider (Google, GitHub, Discord)
3. Enter the Client ID and Client Secret for each
4. Configure scopes as needed

## 4. Environment Variables Configuration

Create `.env.local` file with your actual credentials:

```env
# Copy from .env.production and replace placeholders
NEXT_PUBLIC_DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
GEMINI_API_KEY=your-actual-gemini-api-key
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://kodexalabs.space
```

## 5. Security Configuration

### Generate Secure Secrets
```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate webhook secret
openssl rand -hex 32
```

### Configure CORS and Security Headers
Update `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

## 6. Error Handling and Monitoring

### Set up Sentry (Optional)
1. Create account at [Sentry.io](https://sentry.io/)
2. Create new project
3. Copy DSN and configure in environment variables
4. Install Sentry SDK: `npm install @sentry/nextjs`

### Configure Logging
Update logging configuration in your application:

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
    } else {
      console.log(message, data)
    }
  },
  error: (message: string, error?: Error) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    } else {
      console.error(message, error)
    }
  }
}
```

## 7. Analytics Setup

### Google Analytics
1. Create Google Analytics account
2. Set up GA4 property
3. Copy Measurement ID
4. Add to environment variables

### Custom Analytics
Implement custom event tracking:

```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, properties?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }
}
```

## 8. Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up custom domain
4. Configure deployment settings

### Environment Variables in Vercel
Add all production environment variables in Vercel dashboard:
- Go to Project Settings > Environment Variables
- Add each variable from your `.env.production` file
- Set environment to "Production"

## 9. Testing Production Setup

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Database schema created and tested
- [ ] Authentication flow working
- [ ] OAuth providers configured
- [ ] AI features functional
- [ ] Error handling implemented
- [ ] Analytics tracking active
- [ ] Security headers configured

### Post-deployment Testing
1. Test user registration and login
2. Verify OAuth providers work
3. Test AI-powered features
4. Check error logging
5. Verify analytics data collection
6. Test all major user flows

## 10. Maintenance and Monitoring

### Regular Tasks
- Monitor database usage and performance
- Review error logs and fix issues
- Update dependencies regularly
- Monitor API usage and costs
- Backup database regularly
- Review security settings

### Performance Optimization
- Enable database connection pooling
- Implement caching strategies
- Optimize database queries
- Monitor and optimize bundle size
- Set up CDN for static assets

## Support and Troubleshooting

### Common Issues
1. **CORS errors**: Check Supabase site URL configuration
2. **Auth not working**: Verify environment variables and OAuth setup
3. **Database errors**: Check RLS policies and permissions
4. **API rate limits**: Monitor usage and implement rate limiting

### Getting Help
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Vercel Documentation: https://vercel.com/docs

---

**⚠️ Security Note**: Never commit actual API keys or secrets to version control. Always use environment variables and keep production credentials secure.