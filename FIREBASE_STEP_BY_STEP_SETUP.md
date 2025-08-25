# Firebase Setup Guide - Step by Step 🔥

**Don't worry! We'll get Firebase working together. Follow these steps one by one.**

## 🎯 What We're Setting Up

Your project needs Firebase for:
- Authentication (user login/signup)
- Firestore Database (storing data)
- Hosting (deploying your app)
- Storage (file uploads)

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

## 🔐 Enable Authentication

### Step 7: Setup Authentication Methods

1. In Firebase Console → Authentication → Sign-in method
2. Enable these providers:
   - **Email/Password** ✅
   - **Google** ✅ (recommended)
   - **GitHub** ✅ (optional)

### Step 8: Configure Authorized Domains

1. Authentication → Settings → Authorized domains
2. Add these domains:
   - `localhost` (for development)
   - `your-domain.com` (your production domain)

## 💾 Setup Firestore Database

### Step 9: Create Firestore Database

1. Firebase Console → Firestore Database
2. Click "Create database"
3. Start in **test mode** (we'll secure it later)
4. Choose location: `us-central1` (or closest to you)

### Step 10: Configure Security Rules

Your `firestore.rules` file should look like this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for certain collections
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🗂️ Setup Cloud Storage

### Step 11: Enable Cloud Storage

1. Firebase Console → Storage
2. Click "Get started"
3. Start in **test mode**
4. Choose same location as Firestore

## 🧪 Test Your Setup

### Step 12: Run Development Server

```bash
# In sparks directory
npm install
npm run dev
```

### Step 13: Test Firebase Connection

Create a test file `sparks/test-firebase.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');

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
  const db = getFirestore(app);
  console.log('✅ Firebase connected successfully!');
  console.log('Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Firebase connection failed:', error);
}
```

Run the test:
```bash
node test-firebase.js
```

## 🚀 Deploy to Firebase Hosting

### Step 14: Build and Deploy

```bash
# Build your Next.js app
npm run build

# Deploy to Firebase
firebase deploy
```

## 🆘 Troubleshooting

### Common Issues:

**1. "Firebase project not found"**
- Run `firebase projects:list` to see available projects
- Run `firebase use your-project-id`

**2. "Permission denied"**
- Check your Firestore security rules
- Ensure user is authenticated

**3. "Module not found"**
- Run `npm install` in sparks directory
- Check if all Firebase packages are installed

**4. "Invalid API key"**
- Double-check your `.env` file values
- Ensure no extra spaces or quotes

### Get Help:

```bash
# Check Firebase CLI status
firebase --help

# Check project status
firebase projects:list

# Check current project
firebase use
```

## ✅ Success Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Firebase project created
- [ ] Web app added to project
- [ ] Environment variables updated
- [ ] Firebase initialized in project
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Development server running
- [ ] Firebase connection tested
- [ ] App deployed (optional)

## 🎉 You're Done!

Once you complete these steps, your Firebase setup will be complete and working!

**Need help?** 
- Check the console for error messages
- Look at the Firebase Console for your project status
- Run the test script to verify connection

**Remember:** Take it one step at a time. You've got this! 💪