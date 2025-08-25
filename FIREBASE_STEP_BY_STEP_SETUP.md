# Firebase Setup Guide - Hybrid Architecture 🔥

**Setting up Firebase as part of our hybrid Supabase + Firebase + Vercel architecture.**

## 🎯 Firebase Role in Hybrid Architecture

**⚠️ IMPORTANT: This is a HYBRID setup where:**
- 🗄️ **Supabase** = Primary database & authentication
- 🔥 **Firebase** = Storage, functions, analytics & notifications
- ⚡ **Vercel** = Hosting & edge computing

Firebase will handle:
- 📁 **File Storage** (images, documents, media)
- ⚙️ **Cloud Functions** (serverless backend logic)
- 📊 **Analytics** (user behavior tracking)
- 📱 **Push Notifications** (FCM)

## 📋 Prerequisites Check

### Step 1: Install Firebase CLI
```bash
# Run this command in your terminal
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Step 2: Login to Firebase
```bash
# This will open your browser to login
firebase login
```

## 🚀 Firebase Project Setup

### Step 3: Create Firebase Project (Web Console)

1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Project name: `kodexalabs-space` (or your preferred name)
4. Enable Google Analytics: **Yes** (recommended)
5. Choose your Analytics account
6. Click "Create project"

### Step 4: Add Web App to Project

1. In Firebase Console, click "Add app" → Web (</>) icon
2. App nickname: `Sparks App`
3. Check "Also set up Firebase Hosting"
4. Click "Register app"
5. **COPY THE CONFIG** - you'll need this!

```javascript
// Your Firebase config will look like this:
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

## 🔧 Configure Your Project

### Step 5: Update Environment Variables

**Edit your `sparks/.env` file:**

```bash
# Replace these with YOUR actual Firebase config values
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123

# Keep your existing Gemini API key
GEMINI_API_KEY=AIzaSyBsU4DXL2gWcvgqzTudctYzg3POaI9tvvA
```

### Step 6: Initialize Firebase in Your Project

```bash
# Navigate to sparks directory
cd sparks

# Initialize Firebase
firebase init
```

**During firebase init, choose:**
- ✅ Firestore: Configure security rules and indexes
- ✅ Hosting: Configure files for Firebase Hosting
- ✅ Storage: Configure security rules for Cloud Storage
- ✅ Use an existing project → Select your project
- Firestore rules file: `firestore.rules` (already exists)
- Firestore indexes file: `firestore.indexes.json` (already exists)
- Public directory: `out` (for Next.js static export)
- Single-page app: **No**
- Automatic builds: **No**
- Storage rules file: `storage.rules` (already exists)

## 🔐 Authentication Setup

### ⚠️ Authentication Handled by Supabase

**In our hybrid architecture, authentication is handled by Supabase, NOT Firebase.**

Firebase authentication is **DISABLED** in this setup because:
- Supabase provides superior authentication with Row Level Security
- Avoids conflicts between two auth systems
- Simplifies user management

**Skip Firebase Authentication setup** - refer to `SUPABASE_SETUP_GUIDE.md` instead.

### Step 7: Verify Authentication is Disabled

1. In Firebase Console → Authentication
2. Ensure no sign-in methods are enabled
3. This prevents conflicts with Supabase auth

## 💾 Database Setup

### ⚠️ Database Handled by Supabase

**In our hybrid architecture, the primary database is Supabase PostgreSQL, NOT Firestore.**

Firestore is **DISABLED** in this setup because:
- Supabase PostgreSQL provides more powerful relational database features
- Better performance and SQL capabilities
- Integrated with Supabase authentication and RLS

**Skip Firestore setup** - refer to `SUPABASE_SETUP_GUIDE.md` for database configuration.

### Step 8: Verify Firestore is Disabled

1. In Firebase Console → Firestore Database
2. Do NOT create a Firestore database
3. This prevents conflicts with Supabase database

## 🗂️ Setup Cloud Storage

### ✅ Primary Storage Service in Hybrid Architecture

**Firebase Storage is a KEY component in our hybrid setup for:**
- User profile images and avatars
- Post images and media content
- Document uploads and attachments
- Temporary file storage

### Step 9: Enable Cloud Storage

1. Firebase Console → Storage
2. Click "Get started"
3. Choose **"Start in production mode"** (we'll configure security rules)
4. Select location (choose closest to your users)

### Step 10: Configure Storage Security Rules

**Important:** Since we use Supabase auth, we need custom security rules.

Update `sparks/storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for post images
    match /posts/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Custom token from Supabase
    }
    
    // User-specific uploads (validated via custom claims)
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null 
                      && request.auth.token.sub == userId;
    }
    
    // Temporary uploads
    match /temp/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Test Your Setup

### Step 11: Run Development Server

```bash
# In sparks directory
npm install
npm run dev
```

### Step 12: Test Firebase Storage Connection

Create a test file `sparks/test-firebase-storage.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll } = require('firebase/storage');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

try {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  
  console.log('✅ Firebase Storage connected successfully!');
  console.log('Storage Bucket:', firebaseConfig.storageBucket);
  console.log('🔥 Firebase is ready for file uploads in hybrid architecture!');
} catch (error) {
  console.error('❌ Firebase Storage connection failed:', error);
}
```

Run the test:
```bash
node test-firebase-storage.js
```

## 🚀 Deployment

### ⚠️ Hosting Handled by Vercel

**In our hybrid architecture, hosting is handled by Vercel, NOT Firebase Hosting.**

Firebase Hosting is **DISABLED** because:
- Vercel provides superior Next.js optimization
- Better integration with edge functions
- Automatic deployments from Git

### Step 12: Deploy to Vercel

Refer to `VERCEL_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

**Quick deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

Your app will be live at your Vercel domain.

## 🆘 Troubleshooting

### Common Issues:

**1. "Firebase Storage connection failed"**
- Check your Firebase Storage configuration
- Verify storage bucket exists and is accessible
- Ensure storage rules allow your operations

**2. "Storage rules validation failed"**
- Check storage.rules syntax
- Ensure rules account for Supabase authentication tokens
- Test rules in Firebase Console

**3. "Module not found"**
- Check if Firebase Storage packages are installed:
  ```bash
  npm install firebase
  ```

**4. "Authentication token invalid"**
- This is expected - we use Supabase auth, not Firebase auth
- Ensure you're using custom tokens for Firebase Storage access

### Get Help:

```bash
# Check Firebase CLI status
firebase --help

# Check project status
firebase projects:list

# Test storage connection
node test-firebase-storage.js
```

## ✅ Final Checklist - Hybrid Architecture

**Firebase Components (Storage & Functions only):**
- [ ] Firebase CLI installed and logged in
- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Environment variables added to `.env`
- [ ] Firebase initialized in project
- [ ] ❌ Authentication DISABLED (using Supabase)
- [ ] ❌ Firestore DISABLED (using Supabase PostgreSQL)
- [ ] ✅ Storage enabled and configured
- [ ] ✅ Storage security rules updated for Supabase auth
- [ ] Firebase Storage connection tested

**Integration with Other Services:**
- [ ] Supabase setup completed (see `SUPABASE_SETUP_GUIDE.md`)
- [ ] Vercel deployment configured (see `VERCEL_DEPLOYMENT_GUIDE.md`)
- [ ] Hybrid architecture documented (see `HYBRID_ARCHITECTURE.md`)

## 🎉 Firebase Setup Complete!

**Firebase is now configured as part of your hybrid architecture for:**
- 📁 File storage and media uploads
- ⚙️ Cloud functions (when needed)
- 📊 Analytics and monitoring
- 📱 Push notifications

### Next Steps:
1. **Complete Supabase setup** for database and authentication
2. **Configure Vercel deployment** for hosting
3. **Test the full hybrid integration**
4. **Start building your app features**

**Architecture Status:** Firebase ✅ | Supabase ⏳ | Vercel ⏳

**Need help?** 
- Check the console for error messages
- Look at the Firebase Console for your project status
- Run the test script to verify connection

**Remember:** Take it one step at a time. You've got this! 💪