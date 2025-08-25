# Supabase Setup Guide - Hybrid Architecture 🚀

**Setting up Supabase as the primary database and authentication service in our hybrid Supabase + Firebase + Vercel architecture.**

## 🎯 Architecture Overview

### Service Responsibilities:
- **Supabase**: Primary database (PostgreSQL), authentication, real-time subscriptions
- **Firebase**: Cloud Storage, Cloud Functions, Analytics, Push Notifications
- **Vercel**: Hosting, Edge Functions, CDN, Deployments

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Vercel account (free tier available)
- Supabase account (free tier available)
- Firebase account (existing setup)

## 🚀 Step 1: Create Supabase Project

### 1.1 Sign up for Supabase
1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Project details:
   - **Name**: `kodexalabs-space`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
4. Click "Create new project"
5. Wait 2-3 minutes for project setup

## 🔧 Step 2: Get Supabase Configuration

### 2.1 Find Your Project Settings
1. In your Supabase dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy these values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Anonymous Key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (server-side only, keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Update Environment Variables

Update your `e:\kodexalabs.space\.env` file with your actual values:

```bash
# Supabase Configuration (Primary Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

## 🗄️ Step 3: Database Schema Setup

### 3.1 Enable Row Level Security

In Supabase SQL Editor, run:

```sql
-- Enable RLS on auth.users (already enabled by default)
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3.2 Create Additional Tables

```sql
-- Posts table for social platform
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔐 Step 4: Authentication Setup

### 4.1 Configure Auth Providers

1. In Supabase Dashboard → Authentication → Settings
2. **Site URL**: `http://localhost:3000` (development)
3. **Redirect URLs**: Add your domains:
   - `http://localhost:3000/**`
   - `https://your-vercel-domain.vercel.app/**`

### 4.2 Enable Social Providers

**Google OAuth:**
1. Go to Authentication → Settings → Auth Providers
2. Enable Google
3. Add your Google OAuth credentials (from Firebase Console)

**GitHub OAuth:**
1. Enable GitHub
2. Create GitHub OAuth App:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - New OAuth App
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

## 📦 Step 5: Install Dependencies

```bash
# Navigate to your project
cd e:\kodexalabs.space\sparks

# Install Supabase client
npm install @supabase/supabase-js

# Install additional dependencies for hybrid setup
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react
```

## 🔧 Step 6: Create Supabase Client

Create `sparks/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🧪 Step 7: Test Connection

Create `sparks/test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testSupabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('⚠️  Connection successful, but table might not exist yet:', error.message)
    } else {
      console.log('✅ Supabase connected successfully!')
    }
    
    console.log('🔗 Project URL:', supabaseUrl)
    console.log('🔑 Using anon key:', supabaseAnonKey ? 'Yes' : 'No')
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
  }
}

testSupabase()
```

Run the test:
```bash
node test-supabase.js
```

## 🚀 Step 8: Real-time Setup

### 8.1 Enable Real-time

1. In Supabase Dashboard → Database → Replication
2. Enable replication for tables you want real-time updates:
   - `profiles`
   - `posts`

### 8.2 Test Real-time

```javascript
// Example real-time subscription
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    console.log('Real-time update:', payload)
  })
  .subscribe()
```

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables updated
- [ ] Database schema created
- [ ] Row Level Security policies configured
- [ ] Authentication providers enabled
- [ ] Dependencies installed
- [ ] Supabase client created
- [ ] Connection test passed
- [ ] Real-time enabled

## 🔄 Next Steps

1. **Integrate with Firebase** - Configure Firebase for storage and functions
2. **Set up Vercel** - Configure deployment and environment variables
3. **Create API routes** - Build Next.js API routes using Supabase
4. **Implement authentication** - Add login/signup flows
5. **Test hybrid setup** - Ensure all services work together

## 🆘 Troubleshooting

### Common Issues:

**"Invalid API key"**
- Check your environment variables
- Ensure no extra spaces or quotes
- Verify the keys are from the correct project

**"Row Level Security policy violation"**
- Check your RLS policies
- Ensure user is authenticated for protected operations
- Verify policy conditions match your use case

**"Connection timeout"**
- Check your internet connection
- Verify Supabase project is active
- Try a different region if issues persist

---

**🎉 You're ready to use Supabase in your hybrid architecture!**

Next: Configure Vercel deployment and integrate with Firebase services.