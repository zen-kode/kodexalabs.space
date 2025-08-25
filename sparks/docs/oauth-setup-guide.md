# OAuth Setup Guide

This guide will help you configure OAuth authentication providers (Google, GitHub, Discord) for your SPARKS application.

## Overview

SPARKS supports multiple OAuth providers through both Firebase and Supabase authentication systems:
- **Google OAuth 2.0** - For Google account authentication
- **GitHub OAuth** - For GitHub account authentication  
- **Discord OAuth** - For Discord account authentication

## Prerequisites

1. A configured Supabase or Firebase project
2. Domain/URL where your application will be hosted
3. Access to OAuth provider developer consoles

## OAuth Provider Setup

### 1. Google OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API

#### Step 2: Configure OAuth Consent Screen
1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "SPARKS"
   - User support email: Your email
   - Developer contact information: Your email
4. Add authorized domains (your production domain)
5. Save and continue through all steps

#### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For Supabase: `https://[your-project-id].supabase.co/auth/v1/callback`
   - For Firebase: `https://[your-project-id].firebaseapp.com/__/auth/handler`
   - For local development: `http://localhost:3000/auth/callback`
5. Save and copy the Client ID and Client Secret

### 2. GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "SPARKS"
   - Homepage URL: Your production URL
   - Authorization callback URL:
     - For Supabase: `https://[your-project-id].supabase.co/auth/v1/callback`
     - For Firebase: `https://[your-project-id].firebaseapp.com/__/auth/handler`
     - For local development: `http://localhost:3000/auth/callback`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### 3. Discord OAuth Setup

#### Step 1: Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter application name: "SPARKS"
4. Go to "OAuth2" section
5. Add redirect URIs:
   - For Supabase: `https://[your-project-id].supabase.co/auth/v1/callback`
   - For Firebase: `https://[your-project-id].firebaseapp.com/__/auth/handler`
   - For local development: `http://localhost:3000/auth/callback`
6. Copy the Client ID and Client Secret

## Database Provider Configuration

### Supabase Configuration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to "Authentication" > "Providers"
3. Enable and configure each provider:

#### Google Provider
- Enable Google provider
- Enter Client ID and Client Secret from Google Cloud Console
- Set redirect URL: `https://[your-project-id].supabase.co/auth/v1/callback`

#### GitHub Provider
- Enable GitHub provider
- Enter Client ID and Client Secret from GitHub
- Set redirect URL: `https://[your-project-id].supabase.co/auth/v1/callback`

#### Discord Provider
- Enable Discord provider
- Enter Client ID and Client Secret from Discord
- Set redirect URL: `https://[your-project-id].supabase.co/auth/v1/callback`

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to "Authentication" > "Sign-in method"
3. Enable and configure each provider:

#### Google Provider
- Enable Google sign-in
- Use the same Client ID from Google Cloud Console
- Firebase will handle the configuration automatically

#### GitHub Provider
- Enable GitHub sign-in
- Enter Client ID and Client Secret from GitHub
- Set authorized redirect URI: `https://[your-project-id].firebaseapp.com/__/auth/handler`

#### Discord Provider (Custom OAuth)
- Enable "Custom OAuth" or use a third-party provider
- Configure with Discord OAuth credentials
- Set provider ID: `oidc.discord`

## Environment Configuration

Update your `.env` file with the OAuth credentials:

```bash
# OAuth Provider Configuration
# Google OAuth
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]

# GitHub OAuth
GITHUB_CLIENT_ID=[your-github-client-id]
GITHUB_CLIENT_SECRET=[your-github-client-secret]

# Discord OAuth
DISCORD_CLIENT_ID=[your-discord-client-id]
DISCORD_CLIENT_SECRET=[your-discord-client-secret]
```

## Testing OAuth Integration

### Local Testing
1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Test each OAuth provider button
4. Verify successful authentication and user creation

### Production Testing
1. Deploy your application
2. Update OAuth redirect URIs to use production URLs
3. Test authentication flow in production environment

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure redirect URIs match exactly in OAuth provider settings
   - Check for trailing slashes and protocol (http vs https)

2. **Invalid Client Credentials**
   - Verify Client ID and Client Secret are correct
   - Check for extra spaces or characters

3. **Scope Issues**
   - Ensure required scopes are requested (email, profile)
   - Check OAuth consent screen configuration

4. **CORS Errors**
   - Add your domain to authorized origins
   - Configure proper CORS settings in your hosting platform

### Debug Steps

1. Check browser developer tools for error messages
2. Verify environment variables are loaded correctly
3. Test OAuth flow in incognito/private browsing mode
4. Check database provider authentication logs

## Security Best Practices

1. **Environment Variables**
   - Never commit OAuth secrets to version control
   - Use different credentials for development and production
   - Rotate secrets regularly

2. **Redirect URIs**
   - Only add necessary redirect URIs
   - Use HTTPS in production
   - Validate redirect URIs server-side

3. **Scopes**
   - Request minimal required scopes
   - Review scope permissions regularly
   - Document why each scope is needed

## Next Steps

After completing OAuth setup:
1. Test all authentication flows
2. Configure user profile synchronization
3. Set up proper error handling
4. Implement logout functionality
5. Add user session management

For additional help, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)