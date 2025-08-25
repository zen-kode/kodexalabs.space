# Firebase & Supabase Dual Backend Integration

This document explains how to use the dual backend system that supports both Firebase and Supabase, allowing you to switch between them for development and production environments.

## Overview

The application now supports two database backends:
- **Firebase**: Recommended for development with Genkit AI integration
- **Supabase**: Recommended for production with advanced PostgreSQL features

## Quick Start

### Option 1: Interactive Development Server (Recommended)
```bash
npm run dev
```
This launches an interactive CLI that will:
- Auto-detect your current backend configuration
- Provide a user-friendly selection menu
- Validate environment variables
- Start the appropriate development servers

### Option 2: Automatic Backend Detection
```bash
npm run dev:auto
```
Automatically detects backend based on your `.env` file configuration.

### Option 3: Direct Backend Selection
```bash
# Start with Firebase (includes Genkit AI integration)
npm run dev:firebase

# Start with Supabase (production-ready PostgreSQL)
npm run dev:supabase
```

### Option 4: Development Utilities
```bash
# Check current backend status
npm run dev:status

# Interactive environment setup
npm run dev:setup
```

### Fallback Commands
If the PowerShell script encounters issues:
```bash
# Direct Next.js server
npm run dev:next-only

# Simple Next.js on port 9002
npm run dev:simple

# Manual Genkit start (for Firebase)
npm run genkit:dev
```

### Option 3: Manual Configuration
1. Set the `NEXT_PUBLIC_DATABASE_PROVIDER` environment variable in your `.env` file:
   ```env
   NEXT_PUBLIC_DATABASE_PROVIDER=firebase  # or 'supabase'
   ```
2. Run the standard dev command:
   ```bash
   npm run dev
   ```

## Environment Configuration

### Firebase Configuration
Add these variables to your `.env` file:
```env
NEXT_PUBLIC_DATABASE_PROVIDER=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
GEMINI_API_KEY=your_gemini_api_key
```

### Supabase Configuration
Add these variables to your `.env` file:
```env
NEXT_PUBLIC_DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## Architecture

### Database Abstraction Layer
The system uses a database abstraction layer (`src/lib/database-abstraction.ts`) that provides a unified interface for both backends:

```typescript
// Unified interface for both Firebase and Supabase
interface DatabaseAdapter {
  // Authentication
  signIn(email: string, password: string): Promise<{ user: any; error: any }>
  signUp(email: string, password: string): Promise<{ user: any; error: any }>
  signOut(): Promise<{ error: any }>
  
  // Data operations
  getPrompts(userId: string, limit?: number): Promise<{ data: Prompt[] | null; error: any }>
  createPrompt(prompt: CreatePromptInput): Promise<{ data: Prompt | null; error: any }>
  // ... more operations
}
```

### AI Integration
The Firebase AI Service (`src/ai/firebase-ai-service.ts`) integrates Genkit AI flows with database operations:

```typescript
// Enhanced AI operations that save to database
const result = await firebaseAIService.enhanceAndSavePrompt({
  prompt: "Your prompt here",
  userId: user.id,
  title: "Enhanced Prompt",
  category: "AI Generated"
})
```

## Features

### 🔥 Firebase Features
- **Real-time Database**: Firestore with real-time updates
- **Genkit Integration**: Seamless AI flow integration
- **Easy Development**: Quick setup and configuration
- **Offline Support**: Built-in offline capabilities

### 🐘 Supabase Features
- **PostgreSQL**: Full SQL database with advanced querying
- **Row Level Security**: Built-in security policies
- **Real-time Subscriptions**: WebSocket-based real-time updates
- **Production Ready**: Scalable and robust for production

## Development Workflows

### Firebase Development Workflow
1. **Setup Firebase Project**:
   ```bash
   npm run setup:firebase
   ```

2. **Configure Environment**:
   - Create Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Copy configuration to `.env` file

3. **Start Development**:
   ```bash
   npm run dev:firebase
   ```
   This starts both Next.js and Genkit development servers.

4. **Access Services**:
   - Next.js App: http://localhost:9002
   - Genkit UI: http://localhost:4000

### Supabase Development Workflow
1. **Setup Supabase**:
   ```bash
   npm run setup:supabase
   ```

2. **Configure Environment**:
   - Create Supabase project at https://supabase.com
   - Set up database schema (see Database Schema section)
   - Copy configuration to `.env` file

3. **Start Development**:
   ```bash
   npm run dev:supabase
   ```

## Database Schema

### Required Tables

#### Prompts Table
```sql
-- For Supabase (PostgreSQL)
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own prompts" ON prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON prompts
  FOR DELETE USING (auth.uid() = user_id);
```

#### Users Table (Optional)
```sql
-- For additional user profile data
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Firebase Schema
For Firebase, the same data structure is used but stored as Firestore collections:

```javascript
// Firestore collections
/prompts/{promptId}
/users/{userId}

// Security rules (firestore.rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## AI Integration

### Enhanced AI Flows
The system provides enhanced AI flows that automatically save results:

```typescript
import { firebaseAIService } from '@/ai/firebase-ai-service'

// Enhance and save prompt
const result = await firebaseAIService.enhanceAndSavePrompt({
  prompt: "Make this better",
  userId: user.id,
  title: "Enhanced Prompt",
  category: "Enhancement"
})

// Analyze and save results
const analysis = await firebaseAIService.analyzeAndSavePrompt({
  prompt: "Analyze this prompt",
  userId: user.id,
  promptId: existingPromptId // optional
})

// Get personalized suggestions
const suggestions = await firebaseAIService.getPersonalizedSuggestions(user.id)
```

### Batch Processing
```typescript
// Process multiple prompts at once
const results = await firebaseAIService.batchProcessPrompts({
  prompts: [
    { content: "Prompt 1", operation: "enhance" },
    { content: "Prompt 2", operation: "clean" },
    { content: "Prompt 3", operation: "organize" }
  ],
  userId: user.id
})
```

## Building for Production

### Firebase Build
```bash
npm run build:firebase
```

### Supabase Build
```bash
npm run build:supabase
```

## Testing

### Test with Firebase
```bash
npm run test:firebase
```

### Test with Supabase
```bash
npm run test:supabase
```

## Migration Between Backends

### From Firebase to Supabase
1. Export data from Firebase
2. Set up Supabase schema
3. Import data to Supabase
4. Update environment variables
5. Test the migration

### From Supabase to Firebase
1. Export data from Supabase
2. Set up Firebase collections
3. Import data to Firebase
4. Update environment variables
5. Test the migration

## Troubleshooting

### Common Issues

#### Environment Variables Not Loading
- Ensure `.env` file exists in project root
- Check variable names match exactly
- Restart development server after changes

#### Firebase Connection Issues
- Verify Firebase project configuration
- Check API keys and project ID
- Ensure Firestore is enabled

#### Supabase Connection Issues
- Verify Supabase URL and keys
- Check database schema exists
- Ensure RLS policies are configured

#### Authentication Problems
- Check provider-specific auth configuration
- Verify user permissions
- Check browser console for errors

### Debug Mode
Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## Best Practices

### Development
- Use Firebase for rapid development and prototyping
- Test AI flows with Genkit development server
- Use real-time features for better UX

### Production
- Use Supabase for production deployments
- Implement proper error handling
- Set up monitoring and logging
- Use environment-specific configurations

### Security
- Never commit API keys to version control
- Use environment variables for all secrets
- Implement proper authentication flows
- Set up database security rules

## Support

For issues and questions:
1. Check this documentation
2. Review error logs
3. Check environment configuration
4. Test with minimal setup

## Contributing

When contributing to the dual backend system:
1. Test with both Firebase and Supabase
2. Update documentation for new features
3. Maintain backward compatibility
4. Follow the established patterns