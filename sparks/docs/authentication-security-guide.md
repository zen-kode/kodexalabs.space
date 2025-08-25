# Authentication Security Guide for SPARKS

This guide covers security best practices for authentication, session management, and OAuth implementation in the SPARKS application.

## Table of Contents

1. [Security Overview](#security-overview)
2. [NextAuth.js Security Configuration](#nextauthjs-security-configuration)
3. [Session Management](#session-management)
4. [OAuth Security](#oauth-security)
5. [Database Security](#database-security)
6. [Environment Security](#environment-security)
7. [Security Headers](#security-headers)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Security Checklist](#security-checklist)

## Security Overview

The SPARKS application implements multiple layers of security:

- **Authentication**: NextAuth.js with OAuth providers
- **Authorization**: Role-based access control
- **Session Management**: Secure JWT tokens and database sessions
- **Data Protection**: Encrypted storage and secure transmission
- **Input Validation**: Comprehensive sanitization and validation

## NextAuth.js Security Configuration

### 1. Secure Secret Generation

```bash
# Generate a strong secret for NextAuth
openssl rand -base64 32
```

**Environment Variables:**
```env
# Use a cryptographically secure random string
NEXTAUTH_SECRET=your-super-secure-secret-here
NEXTAUTH_URL=https://kodexalabs.space
```

### 2. Session Configuration

```typescript
// pages/api/auth/[...nextauth].ts
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  // Use JWT for stateless sessions in production
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Use HS256 algorithm (default)
  },
  
  // Security callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Add security checks here
      if (user) {
        token.userId = user.id
        token.role = user.role
      }
      return token
    },
    
    async session({ session, token }) {
      // Sanitize session data
      if (token) {
        session.user.id = token.userId
        session.user.role = token.role
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Implement sign-in security checks
      if (account?.provider === 'google') {
        // Verify Google account
        return profile?.email_verified === true
      }
      return true
    }
  },
  
  // Security pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Security events
  events: {
    async signIn({ user, account, profile }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    async signOut({ session, token }) {
      console.log(`User signed out`)
    }
  }
}
```

## Session Management

### 1. Secure Session Storage

```typescript
// src/lib/session-security.ts
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { NextRequest } from 'next/server'

export async function getSecureSession(req?: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return null
  }
  
  // Validate session integrity
  if (!session.user?.id || !session.user?.email) {
    throw new Error('Invalid session data')
  }
  
  return session
}

export function validateSessionToken(token: string): boolean {
  try {
    // Implement token validation logic
    const decoded = JSON.parse(atob(token.split('.')[1]))
    
    // Check expiration
    if (decoded.exp < Date.now() / 1000) {
      return false
    }
    
    // Check required fields
    if (!decoded.sub || !decoded.email) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}
```

### 2. Session Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Add security headers
    const response = NextResponse.next()
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // CSP header
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Implement authorization logic
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname.startsWith('/auth') || pathname === '/') {
          return true
        }
        
        // Protected routes require authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
```

## OAuth Security

### 1. Provider Configuration

```typescript
// OAuth security best practices
const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      }
    }
  }),
  
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'read:user user:email'
      }
    }
  }),
  
  DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'identify email'
      }
    }
  })
]
```

### 2. OAuth Callback Security

```typescript
// src/pages/api/auth/callback/[...provider].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validate CSRF token
  const session = await getServerSession(req, res, authOptions)
  
  // Check for state parameter (CSRF protection)
  if (!req.query.state) {
    return res.status(400).json({ error: 'Missing state parameter' })
  }
  
  // Validate redirect URI
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000' // Only in development
  ]
  
  const origin = req.headers.origin
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid origin' })
  }
  
  // Continue with OAuth flow
  res.redirect('/dashboard')
}
```

## Database Security

### 1. Supabase Security

```sql
-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policy - users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prompts policy - users can only access their own prompts
CREATE POLICY "Users can view own prompts" ON prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON prompts
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. Firebase Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prompts are private to each user
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Public read access for app metadata
    match /metadata/{document} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

## Environment Security

### 1. Secret Management

```bash
# Use strong, unique secrets for each environment
# Production secrets should be different from development

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 2. Environment Validation

```typescript
// src/lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    process.exit(1)
  }
}
```

## Security Headers

### 1. Next.js Configuration

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
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

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Monitoring and Logging

### 1. Security Event Logging

```typescript
// src/lib/security-logger.ts
import { NextApiRequest } from 'next'

interface SecurityEvent {
  type: 'auth' | 'access' | 'error' | 'suspicious'
  userId?: string
  ip?: string
  userAgent?: string
  details: Record<string, any>
  timestamp: Date
}

export class SecurityLogger {
  static async logEvent(event: SecurityEvent) {
    // Log to your preferred logging service
    console.log('Security Event:', {
      ...event,
      timestamp: new Date().toISOString()
    })
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, DataDog, etc.
    }
  }
  
  static async logFailedLogin(req: NextApiRequest, email?: string) {
    await this.logEvent({
      type: 'auth',
      details: {
        action: 'failed_login',
        email,
        reason: 'invalid_credentials'
      },
      ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    })
  }
  
  static async logSuspiciousActivity(req: NextApiRequest, details: Record<string, any>) {
    await this.logEvent({
      type: 'suspicious',
      details,
      ip: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    })
  }
}
```

## Security Checklist

### Pre-Production Security Checklist

- [ ] **Environment Variables**
  - [ ] All secrets are properly configured
  - [ ] No placeholder values in production
  - [ ] Secrets are unique per environment
  - [ ] Environment validation is implemented

- [ ] **Authentication**
  - [ ] NextAuth.js is properly configured
  - [ ] Strong NEXTAUTH_SECRET is set
  - [ ] OAuth providers are configured securely
  - [ ] Session timeouts are appropriate

- [ ] **Authorization**
  - [ ] Row Level Security (RLS) is enabled
  - [ ] Database policies are implemented
  - [ ] API routes are protected
  - [ ] Role-based access control is working

- [ ] **Security Headers**
  - [ ] CSP headers are configured
  - [ ] HSTS is enabled
  - [ ] XSS protection is enabled
  - [ ] Frame options are set

- [ ] **Monitoring**
  - [ ] Security event logging is implemented
  - [ ] Error tracking is configured
  - [ ] Failed login attempts are monitored
  - [ ] Suspicious activity detection is active

- [ ] **Data Protection**
  - [ ] Sensitive data is encrypted
  - [ ] PII is properly handled
  - [ ] Data retention policies are implemented
  - [ ] Backup security is configured

### Ongoing Security Maintenance

- [ ] **Regular Updates**
  - [ ] Dependencies are kept up to date
  - [ ] Security patches are applied promptly
  - [ ] OAuth provider configurations are reviewed
  - [ ] Security policies are updated

- [ ] **Monitoring**
  - [ ] Security logs are reviewed regularly
  - [ ] Failed authentication attempts are investigated
  - [ ] Unusual access patterns are monitored
  - [ ] Performance impacts are assessed

- [ ] **Incident Response**
  - [ ] Security incident response plan exists
  - [ ] Contact information is up to date
  - [ ] Backup and recovery procedures are tested
  - [ ] Communication plan is established

## Additional Resources

- [NextAuth.js Security Documentation](https://next-auth.js.org/configuration/options#security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Note**: This guide provides a comprehensive security framework. Always conduct security audits and penetration testing before deploying to production.