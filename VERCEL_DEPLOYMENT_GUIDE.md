# Vercel Deployment Guide - Hybrid Architecture 🚀

**Deploying your hybrid Supabase + Firebase + Vercel architecture to production.**

## 🎯 Overview

This guide covers deploying the **Sparks** social platform using:
- **Vercel**: Hosting, Edge Functions, CDN, Deployments
- **Supabase**: Primary database and authentication
- **Firebase**: Cloud Storage, Functions, Analytics

## 📋 Prerequisites

- Vercel account (free tier available)
- GitHub repository with your code
- Supabase project configured
- Firebase project configured
- Node.js 18+ locally

## 🚀 Step 1: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login
```

## 🔧 Step 2: Project Configuration

### 2.1 Verify vercel.json

Ensure your `vercel.json` is properly configured (already created):

```json
{
  "version": 2,
  "name": "kodexalabs-space",
  "builds": [
    {
      "src": "sparks/package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### 2.2 Update Package.json Scripts

Add deployment scripts to `sparks/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "vercel-build": "next build",
    "deploy": "vercel --prod",
    "deploy-preview": "vercel"
  }
}
```

## 🌐 Step 3: Environment Variables Setup

### 3.1 Add Environment Variables to Vercel

```bash
# Navigate to your project root
cd e:\kodexalabs.space

# Add Supabase environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase service role key when prompted

# Add Firebase environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add FIREBASE_ADMIN_PRIVATE_KEY
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL
vercel env add FIREBASE_ADMIN_PROJECT_ID
```

### 3.2 Alternative: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from your `.env` file

**Environment Variables to Add:**

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Supabase service role key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production, Preview, Development | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production, Preview, Development | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production, Preview, Development | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Production, Preview, Development | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Production, Preview, Development | Firebase app ID |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Production, Preview, Development | Firebase admin private key |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Production, Preview, Development | Firebase admin client email |
| `FIREBASE_ADMIN_PROJECT_ID` | Production, Preview, Development | Firebase admin project ID |

## 🚀 Step 4: Deploy to Vercel

### 4.1 First Deployment

```bash
# Navigate to project root
cd e:\kodexalabs.space

# Deploy to Vercel
vercel

# Follow the prompts:
# ? Set up and deploy "e:\kodexalabs.space"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? kodexalabs-space
# ? In which directory is your code located? ./
```

### 4.2 Production Deployment

```bash
# Deploy to production
vercel --prod
```

### 4.3 Automatic Deployments

1. Connect your GitHub repository:
   - Go to Vercel Dashboard
   - Click "Import Project"
   - Select your GitHub repository
   - Configure build settings:
     - **Framework Preset**: Next.js
     - **Root Directory**: `sparks`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`

2. Enable automatic deployments:
   - Every push to `main` branch = Production deployment
   - Every push to other branches = Preview deployment

## 🔧 Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `kodexalabs.space`)
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### 5.2 Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → Settings
2. Update **Site URL**: `https://your-domain.com`
3. Add to **Redirect URLs**:
   - `https://your-domain.com/**`
   - `https://your-vercel-app.vercel.app/**`

## 🧪 Step 6: Test Deployment

### 6.1 Verify Services

Create `sparks/pages/api/health.js`:

```javascript
import { createClient } from '@supabase/supabase-js'
import { initializeApp, getApps } from 'firebase/app'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

if (!getApps().length) {
  initializeApp(firebaseConfig)
}

export default async function handler(req, res) {
  try {
    // Test Supabase connection
    const { data: supabaseHealth, error: supabaseError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    // Test Firebase (basic initialization)
    const firebaseHealth = getApps().length > 0

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        vercel: true,
        supabase: !supabaseError,
        firebase: firebaseHealth
      },
      environment: process.env.NODE_ENV,
      errors: {
        supabase: supabaseError?.message || null
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
```

### 6.2 Test Endpoints

After deployment, test:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/sparks`

## 📊 Step 7: Monitoring & Analytics

### 7.1 Vercel Analytics

1. Enable Vercel Analytics in dashboard
2. Add to your Next.js app:

```bash
npm install @vercel/analytics
```

```javascript
// sparks/pages/_app.js
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### 7.2 Performance Monitoring

- **Vercel**: Built-in performance monitoring
- **Supabase**: Database performance in dashboard
- **Firebase**: Analytics and performance monitoring

## 🔄 Step 8: CI/CD Pipeline

### 8.1 GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: sparks/package-lock.json
      
      - name: Install dependencies
        run: |
          cd sparks
          npm ci
      
      - name: Run tests
        run: |
          cd sparks
          npm run test --if-present
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./sparks
```

## ✅ Deployment Checklist

- [ ] Vercel CLI installed and authenticated
- [ ] `vercel.json` configured
- [ ] Environment variables added to Vercel
- [ ] First deployment successful
- [ ] Production deployment working
- [ ] Custom domain configured (if applicable)
- [ ] Supabase redirect URLs updated
- [ ] Health check endpoint working
- [ ] All services connecting properly
- [ ] Analytics enabled
- [ ] Monitoring set up

## 🆘 Troubleshooting

### Common Issues:

**"Build failed"**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure environment variables are set

**"Environment variables not found"**
- Verify variables are added to Vercel
- Check variable names match exactly
- Ensure variables are set for correct environments

**"Supabase connection failed"**
- Verify Supabase URL and keys
- Check Supabase project is active
- Update redirect URLs in Supabase settings

**"Firebase initialization error"**
- Verify Firebase configuration
- Check Firebase project is active
- Ensure all required Firebase variables are set

### Debug Commands:

```bash
# Check deployment logs
vercel logs your-deployment-url

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Check project settings
vercel inspect your-deployment-url
```

## 🚀 Performance Optimization

### 8.1 Edge Functions

Move API routes to Edge Runtime for better performance:

```javascript
// sparks/pages/api/edge-example.js
export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  return new Response(
    JSON.stringify({ message: 'Hello from Edge!' }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    }
  )
}
```

### 8.2 Image Optimization

```javascript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/your-image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // for above-the-fold images
/>
```

---

**🎉 Your hybrid architecture is now deployed on Vercel!**

**Next Steps:**
1. Test all functionality in production
2. Set up monitoring and alerts
3. Configure backup strategies
4. Implement CI/CD pipeline
5. Optimize performance based on analytics

**Useful Links:**
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)