# Firebase Setup Guide

This guide will help you set up Firebase as your backend database for the SPARKS application.

## Prerequisites

- Node.js 18+ installed
- A Google account
- Firebase CLI installed globally: `npm install -g firebase-tools`

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "sparks-production")
4. Enable Google Analytics (optional but recommended)
5. Choose or create a Google Analytics account
6. Click "Create project"

## Step 2: Enable Required Services

### Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Google** (recommended)
   - **GitHub** (optional)
   - **Email/Password** (optional)
3. Configure OAuth redirect URLs:
   - Development: `http://localhost:3000`
   - Production: `https://kodexalabs.space`

### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll deploy security rules later)
4. Select a location closest to your users

### Storage
1. Go to **Storage**
2. Click "Get started"
3. Choose "Start in test mode"
4. Select the same location as Firestore

### Analytics (Optional)
1. Go to **Analytics**
2. Enable Google Analytics if not already enabled
3. Configure events and conversions as needed

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</>) icon
4. Register your app with a nickname
5. Copy the configuration object

## Step 4: Configure Environment Variables

### Option A: Use the Setup Script (Recommended)

```bash
node scripts/firebase-init.js
```

This interactive script will:
- Prompt for your Firebase configuration values
- Update your `.env.local` file
- Create `.firebaserc` file
- Show next steps

### Option B: Manual Configuration

Create or update `.env.local` with your Firebase configuration:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# Database Provider
NEXT_PUBLIC_DATABASE_PROVIDER=firebase
```

## Step 5: Initialize Firebase CLI

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Initialize your project:
   ```bash
   npm run firebase:init
   ```
   
   Or manually:
   ```bash
   firebase init
   ```
   
   Select:
   - ✅ Firestore: Configure security rules and indexes
   - ✅ Storage: Configure security rules
   - ✅ Emulators: Set up local emulators
   - ✅ Hosting: Configure files for Firebase Hosting (optional)

## Step 6: Deploy Security Rules

Deploy Firestore and Storage security rules:

```bash
# Deploy all rules
npm run firebase:deploy

# Or deploy individually
npm run firebase:deploy:firestore
npm run firebase:deploy:storage
```

## Step 7: Test Your Setup

### Start Development Server
```bash
npm run dev:firebase
```

### Start Firebase Emulators (for local development)
```bash
npm run firebase:emulators
```

The emulators will start on:
- **Firestore**: http://localhost:8080
- **Authentication**: http://localhost:9099
- **Storage**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run firebase:init` | Initialize Firebase project setup |
| `npm run firebase:deploy` | Deploy all Firebase services |
| `npm run firebase:deploy:firestore` | Deploy Firestore rules and indexes |
| `npm run firebase:deploy:storage` | Deploy Storage rules |
| `npm run firebase:deploy:hosting` | Deploy to Firebase Hosting |
| `npm run firebase:emulators` | Start Firebase emulators |
| `npm run firebase:emulators:export` | Export emulator data |
| `npm run firebase:emulators:import` | Import emulator data |
| `npm run dev:firebase` | Start development with Firebase |
| `npm run build:firebase` | Build for Firebase deployment |

## Security Rules

### Firestore Rules
The application includes comprehensive Firestore security rules in `firestore.rules`:

- **Users**: Can read/write their own data
- **Prompts**: Users can manage their prompts, public prompts are readable
- **Tools**: Similar to prompts with public/private access
- **Admin**: Special permissions for admin users

### Storage Rules
Storage rules in `storage.rules` control file access:

- **Profile Images**: Users can upload their own, public read access
- **Private Files**: User-specific access only
- **Prompt Attachments**: Authenticated users can upload/read
- **Public Content**: Open read access, authenticated write

## Database Schema

The application uses the following Firestore collections:

```
/users/{userId}
/prompts/{promptId}
/tools/{toolId}
/categories/{categoryId}
/tags/{tagId}
/analytics/{eventId}
/logs/{logId}
/sessions/{sessionId}
/feedback/{feedbackId}
/notifications/{notificationId}
/rate_limits/{userId}
/security_events/{eventId}
```

## Performance Optimization

### Indexes
Firestore indexes are configured in `firestore.indexes.json` for optimal query performance:

- User-specific queries (userId + createdAt)
- Category filtering (category + createdAt)
- Public content queries (isPublic + createdAt)
- Tag-based searches (tags array + createdAt)

### Caching
The Firebase service includes intelligent caching:

- Document caching with TTL
- Query result caching
- Offline support with sync

## Monitoring and Analytics

### Built-in Monitoring
- Firebase Performance Monitoring
- Crashlytics for error tracking
- Analytics for user behavior

### Custom Monitoring
The application includes custom monitoring:

- API endpoint monitoring
- Database operation tracking
- Security event logging
- Performance metrics collection

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check Firestore security rules
   - Verify user authentication
   - Ensure proper user roles

2. **Configuration Errors**
   - Verify all environment variables are set
   - Check Firebase project settings
   - Ensure services are enabled

3. **Emulator Connection Issues**
   - Check if emulators are running
   - Verify port availability
   - Check firewall settings

### Debug Mode
Enable debug logging:

```env
NEXT_PUBLIC_FIREBASE_DEBUG=true
```

### Health Checks
Monitor Firebase connection:

```bash
curl http://localhost:3000/api/health
```

## Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure production Firebase project
3. Deploy security rules
4. Set up monitoring and alerts

### Hosting on Firebase
```bash
# Build and deploy
npm run build:firebase
npm run firebase:deploy:hosting
```

### Hosting on Vercel/Netlify
1. Set environment variables in hosting platform
2. Configure build settings
3. Deploy application

## Security Best Practices

1. **Never expose sensitive keys** in client-side code
2. **Use security rules** to protect data access
3. **Enable audit logging** for production
4. **Regular security reviews** of rules and permissions
5. **Monitor for suspicious activity** using security events
6. **Use HTTPS** for all production traffic
7. **Implement rate limiting** to prevent abuse

## Support

For issues and questions:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review application logs at `/api/logs`
3. Check health status at `/api/health`
4. Monitor metrics at `/api/metrics`

## Migration from Supabase

If migrating from Supabase:

1. Export data from Supabase
2. Transform data format if needed
3. Import to Firestore using batch operations
4. Update environment variables
5. Test all functionality
6. Update DNS/deployment settings