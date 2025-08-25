# Firebase Configuration - Hybrid Architecture 🔥

**Getting Firebase config for storage and functions in our hybrid Supabase + Firebase + Vercel setup.**

## 🎯 Firebase Role in Hybrid Architecture

**⚠️ IMPORTANT: This is for STORAGE & FUNCTIONS only:**
- 🗄️ **Supabase** = Primary database & authentication
- 🔥 **Firebase** = Storage, functions, analytics & notifications  
- ⚡ **Vercel** = Hosting & edge computing

## Step 1: Go to Firebase Console

1. Open your browser
2. Go to: https://console.firebase.google.com/
3. Sign in with your Google account

## Step 2: Create or Select Project

### If you DON'T have a project yet:
1. Click "Create a project"
2. Enter project name: `kodexalabs-space-storage` (emphasize storage purpose)
3. Click "Continue"
4. Enable Google Analytics: **Yes** (for storage analytics)
5. Choose your Analytics account
6. Click "Create project"
7. Wait for project creation (takes 1-2 minutes)

### If you ALREADY have a project:
1. Click on your existing project

## Step 3: Add Web App

1. In your project dashboard, look for this icon: **</>** (Web)
2. Click the **</>** icon
3. App nickname: `kodexalabs-storage`
4. ❌ **DO NOT** check "Also set up Firebase Hosting" (Vercel handles hosting)
5. Click "Register app"

## Step 4: Copy Your Configuration

**You'll see a screen with code like this:**

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration for STORAGE & FUNCTIONS only
// For Firebase JS SDK v9-compat and v9
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // ← COPY THIS
  authDomain: "your-project.firebaseapp.com",  // ← COPY THIS
  projectId: "your-project-id",                // ← COPY THIS
  storageBucket: "your-project.appspot.com",   // ← MOST IMPORTANT for storage
  messagingSenderId: "123456789",              // ← COPY THIS
  appId: "1:123:web:abc123def456"              // ← COPY THIS
};
```

## Step 5: Update Your .env File

**Open `sparks/.env` and replace the values:**

```bash
# HYBRID ARCHITECTURE - Firebase for Storage & Functions Only
# (Supabase handles database & auth, Vercel handles hosting)

# Firebase Configuration - STORAGE & FUNCTIONS
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com  # ← PRIMARY USE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123def456

# Supabase Configuration - DATABASE & AUTH (Primary)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel Configuration - HOSTING & EDGE
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Keep your existing Gemini API key
GEMINI_API_KEY=AIzaSyBsU4DXL2gWcvgqzTudctYzg3POaI9tvvA
```

## Step 6: Enable Services You Need

### Authentication:
1. In Firebase Console → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Enable **Google** (recommended)

### Firestore Database:
1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for now)
4. Choose location: **us-central1** (or closest to you)

### Storage:
1. In Firebase Console → **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Choose same location as Firestore

## Step 7: Test Your Setup

```bash
# In your terminal, go to sparks folder
cd sparks

# Install dependencies if not already done
npm install

# Test Firebase connection
node test-firebase-connection.js
```

**If you see "🎉 ALL TESTS PASSED!" - you're good to go!**

## 🆘 If You Get Stuck

### Can't find the </> icon?
- Look for "Add app" button
- Or look for platform icons (iOS, Android, Web)
- The Web icon looks like: **</>**

### Don't see the config code?
- Click "Continue to console"
- Go to Project Settings (gear icon)
- Scroll down to "Your apps"
- Click on your web app
- Scroll down to "SDK setup and configuration"
- Select "Config" radio button

### Config values look wrong?
- Make sure you're in the right project
- Make sure you selected the web app (not iOS/Android)
- The values should NOT have quotes when you copy them to .env

## 📝 Quick Checklist

- [ ] Created Firebase project
- [ ] Added web app to project
- [ ] Copied all 6 config values
- [ ] Updated sparks/.env file
- [ ] Enabled Authentication
- [ ] Created Firestore database
- [ ] Enabled Storage
- [ ] Ran test script successfully

**You've got this! Take it one step at a time.** 💪

## ✅ Firebase Configuration Complete!

**Firebase storage & functions are now configured for your hybrid architecture!**

### 🎯 What You've Set Up:
- 🔥 **Firebase**: Storage, functions, analytics & notifications
- 🗄️ **Supabase**: Database & authentication (configure separately)
- ⚡ **Vercel**: Hosting & edge computing (configure separately)

### Next Steps:
1. **Save your `.env` file** with all three service configurations
2. **Complete Supabase setup** (see `SUPABASE_SETUP_GUIDE.md`)
3. **Configure Vercel deployment** (see `VERCEL_DEPLOYMENT_GUIDE.md`)
4. **Test hybrid integration** between all services
5. **Start building your app!**

### 📚 Related Documentation:
- `FIREBASE_STEP_BY_STEP_SETUP.md` - Detailed Firebase setup
- `SUPABASE_SETUP_GUIDE.md` - Database & auth setup
- `VERCEL_DEPLOYMENT_GUIDE.md` - Hosting & deployment
- `HYBRID_ARCHITECTURE.md` - Complete architecture overview

**Architecture Status:** Firebase ✅ | Supabase ⏳ | Vercel ⏳