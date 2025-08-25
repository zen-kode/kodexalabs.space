# Firebase Setup Automation Script
# Run this script to set up Firebase step by step

Write-Host "🔥 Firebase Setup Assistant" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the sparks directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Red
    Write-Host "   Expected: .../kodexalabs.space/sparks" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Running from correct directory" -ForegroundColor Green
Write-Host ""

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Install Firebase CLI
Write-Host "Step 2: Installing Firebase CLI..." -ForegroundColor Cyan
try {
    $firebaseVersion = firebase --version 2>$null
    Write-Host "✅ Firebase CLI already installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Installing Firebase CLI globally..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase CLI installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Firebase CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 3: Login to Firebase
Write-Host "Step 3: Firebase Login..." -ForegroundColor Cyan
Write-Host "This will open your browser for authentication." -ForegroundColor Yellow
Read-Host "Press Enter to continue"

try {
    firebase login
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully logged in to Firebase" -ForegroundColor Green
    } else {
        Write-Host "❌ Firebase login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Firebase login failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: List available projects
Write-Host "Step 4: Available Firebase Projects..." -ForegroundColor Cyan
try {
    firebase projects:list
} catch {
    Write-Host "❌ Could not list projects" -ForegroundColor Red
}
Write-Host ""

# Step 5: Check .env file
Write-Host "Step 5: Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check if Firebase config is set
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id") {
        Write-Host "⚠️  Firebase configuration not updated yet" -ForegroundColor Yellow
        Write-Host "   Please update your .env file with actual Firebase values" -ForegroundColor Yellow
        Write-Host "   See GET_FIREBASE_CONFIG.md for instructions" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Firebase configuration appears to be set" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Creating template .env file..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Firebase Configuration
# Get these values from Firebase Console > Project Settings > Your apps
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123

# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyBsU4DXL2gWcvgqzTudctYzg3POaI9tvvA
"@
    
    $envTemplate | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Template .env file created" -ForegroundColor Green
    Write-Host "   Please update it with your actual Firebase values" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Install dependencies
Write-Host "Step 6: Installing project dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 7: Initialize Firebase (optional)
Write-Host "Step 7: Firebase Project Initialization..." -ForegroundColor Cyan
Write-Host "Do you want to initialize Firebase in this project?" -ForegroundColor Yellow
Write-Host "(This will create firebase.json and configure hosting/firestore)" -ForegroundColor Yellow
$initChoice = Read-Host "Initialize Firebase? (y/n)"

if ($initChoice -eq "y" -or $initChoice -eq "Y") {
    Write-Host "Running firebase init..." -ForegroundColor Yellow
    Write-Host "When prompted, select:" -ForegroundColor Yellow
    Write-Host "- Firestore: Configure security rules and indexes" -ForegroundColor Yellow
    Write-Host "- Hosting: Configure files for Firebase Hosting" -ForegroundColor Yellow
    Write-Host "- Storage: Configure security rules for Cloud Storage" -ForegroundColor Yellow
    Write-Host "- Use existing project" -ForegroundColor Yellow
    Write-Host "- Public directory: out" -ForegroundColor Yellow
    Write-Host "" 
    Read-Host "Press Enter to continue with firebase init"
    
    firebase init
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Firebase init completed with warnings" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping Firebase initialization" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Test Firebase connection
Write-Host "Step 8: Testing Firebase connection..." -ForegroundColor Cyan
if (Test-Path "test-firebase-connection.js") {
    Write-Host "Running Firebase connection test..." -ForegroundColor Yellow
    node test-firebase-connection.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase connection test passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Firebase connection test failed" -ForegroundColor Red
        Write-Host "   Please check your .env configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Firebase test script not found" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "🎉 Firebase Setup Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with actual Firebase config values" -ForegroundColor White
Write-Host "2. Enable Authentication in Firebase Console" -ForegroundColor White
Write-Host "3. Create Firestore database in Firebase Console" -ForegroundColor White
Write-Host "4. Enable Storage in Firebase Console" -ForegroundColor White
Write-Host "5. Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host ""
Write-Host "📚 Helpful files:" -ForegroundColor Yellow
Write-Host "- GET_FIREBASE_CONFIG.md - How to get Firebase config" -ForegroundColor White
Write-Host "- FIREBASE_STEP_BY_STEP_SETUP.md - Detailed setup guide" -ForegroundColor White
Write-Host "- test-firebase-connection.js - Test your Firebase setup" -ForegroundColor White
Write-Host ""
Write-Host "🆘 Need help? Check the troubleshooting section in the setup guide!" -ForegroundColor Cyan