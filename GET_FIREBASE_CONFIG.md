# How to Get Your Firebase Configuration 🔥

**Follow these exact steps to get your Firebase config values:**

## Step 1: Go to Firebase Console

1. Open your browser
2. Go to: https://console.firebase.google.com/
3. Sign in with your Google account

## Step 2: Create or Select Project

### If you DON'T have a project yet:
1. Click "Create a project"
2. Enter project name: `kodexalabs-space`
3. Click "Continue"
4. Enable Google Analytics: **Yes**
5. Choose your Analytics account
6. Click "Create project"
7. Wait for project creation (takes 1-2 minutes)

### If you ALREADY have a project:
1. Click on your existing project

## Step 3: Add Web App

1. In your project dashboard, look for this icon: **</>** (Web)
2. Click the **</>** icon
3. App nickname: `Sparks Web App`
4. ✅ Check "Also set up Firebase Hosting for this app"
5. Click "Register app"

## Step 4: Copy Your Configuration

**You'll see a screen with code like this:**

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and v9
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // ← COPY THIS
  authDomain: "your-project.firebaseapp.com",  // ← COPY THIS
  projectId: "your-project-id",                // ← COPY THIS
  storageBucket: "your-project.appspot.com",   // ← COPY THIS
  messagingSenderId: "123456789",              // ← COPY THIS
  appId: "1:123:web:abc123def456"              // ← COPY THIS
};
```

## Step 5: Update Your .env File

**Open `sparks/.env` and replace the values:**

```bash
# Replace these with YOUR actual values from Firebase console
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123def456

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