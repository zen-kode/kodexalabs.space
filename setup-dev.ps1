# Development Environment Setup Script
# Hybrid Supabase + Firebase + Vercel Architecture

Write-Host "🛠️  Setting up Development Environment..." -ForegroundColor Green
Write-Host "Hybrid Architecture: Supabase (DB/Auth) + Firebase (Storage/Functions) + Vercel (Hosting)" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -ge 18) {
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js version $nodeVersion found, but v18+ recommended" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check Git
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git not found. Install Git for version control" -ForegroundColor Yellow
}

# Install global dependencies
Write-Host "`n📦 Installing Global Dependencies..." -ForegroundColor Yellow

# Install Vercel CLI
if (-not (Test-Command "vercel")) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
    npm install -g vercel
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
    }
} else {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
}

# Install Firebase CLI
if (-not (Test-Command "firebase")) {
    Write-Host "Installing Firebase CLI..." -ForegroundColor Cyan
    npm install -g firebase-tools
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase CLI installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Firebase CLI" -ForegroundColor Red
    }
} else {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI: $firebaseVersion" -ForegroundColor Green
}

# Install Supabase CLI
if (-not (Test-Command "supabase")) {
    Write-Host "Installing Supabase CLI..." -ForegroundColor Cyan
    npm install -g @supabase/cli
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
    }
} else {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI: $supabaseVersion" -ForegroundColor Green
}

# Check .env file
Write-Host "`n🔧 Environment Configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for required environment variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $var missing" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  .env file not found. Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# HYBRID ARCHITECTURE - Environment Variables
# Supabase Configuration (Primary Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase Configuration (Storage & Functions)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id

# Vercel Configuration (Hosting)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Development
NODE_ENV=development
"@
    
    $envTemplate | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "📝 .env template created. Please fill in your actual values." -ForegroundColor Cyan
}

# Navigate to sparks directory and install dependencies
Write-Host "`n📦 Installing Project Dependencies..." -ForegroundColor Yellow

if (Test-Path "sparks") {
    Set-Location "sparks"
    
    if (Test-Path "package.json") {
        Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            Set-Location ".."
            exit 1
        }
    } else {
        Write-Host "⚠️  package.json not found in sparks directory" -ForegroundColor Yellow
    }
    
    Set-Location ".."
} else {
    Write-Host "⚠️  sparks directory not found" -ForegroundColor Yellow
}

# Initialize services (optional)
Write-Host "`n🚀 Service Initialization (Optional)..." -ForegroundColor Yellow

$initServices = Read-Host "Initialize local development services? (y/N)"

if ($initServices -eq "y" -or $initServices -eq "Y") {
    Write-Host "Initializing services..." -ForegroundColor Cyan
    
    # Initialize Supabase (local development)
    if (Test-Path "supabase") {
        Write-Host "Starting Supabase local development..." -ForegroundColor Cyan
        supabase start
    } else {
        Write-Host "Supabase not initialized. Run 'supabase init' to set up." -ForegroundColor Yellow
    }
    
    # Initialize Firebase emulators
    if (Test-Path "sparks\firebase.json") {
        Write-Host "Starting Firebase emulators..." -ForegroundColor Cyan
        Set-Location "sparks"
        Start-Process -FilePath "firebase" -ArgumentList "emulators:start", "--only", "storage,functions" -NoNewWindow
        Set-Location ".."
    } else {
        Write-Host "Firebase not configured. See FIREBASE_STEP_BY_STEP_SETUP.md" -ForegroundColor Yellow
    }
}

# Create development scripts
Write-Host "`n📝 Creating Development Scripts..." -ForegroundColor Yellow

# Create start-dev.ps1
$startDevScript = @"
# Start Development Environment
Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green

# Start Supabase (if available)
if (Test-Path "supabase") {
    Write-Host "Starting Supabase..." -ForegroundColor Cyan
    Start-Process -FilePath "supabase" -ArgumentList "start" -NoNewWindow
}

# Start Firebase Emulators (if available)
if (Test-Path "sparks\firebase.json") {
    Write-Host "Starting Firebase Emulators..." -ForegroundColor Cyan
    Set-Location "sparks"
    Start-Process -FilePath "firebase" -ArgumentList "emulators:start", "--only", "storage,functions" -NoNewWindow
    Set-Location ".."
}

# Start Next.js Development Server
Write-Host "Starting Next.js Development Server..." -ForegroundColor Cyan
Set-Location "sparks"
npm run dev
"@

$startDevScript | Out-File -FilePath "start-dev.ps1" -Encoding UTF8
Write-Host "✅ start-dev.ps1 created" -ForegroundColor Green

# Display summary
Write-Host "`n🎉 Development Environment Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

Write-Host "`n📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure your .env file with actual service credentials" -ForegroundColor Cyan
Write-Host "2. Set up Supabase project (see SUPABASE_SETUP_GUIDE.md)" -ForegroundColor Cyan
Write-Host "3. Configure Firebase project (see FIREBASE_STEP_BY_STEP_SETUP.md)" -ForegroundColor Cyan
Write-Host "4. Set up Vercel project (see VERCEL_DEPLOYMENT_GUIDE.md)" -ForegroundColor Cyan
Write-Host "5. Run './start-dev.ps1' to start development environment" -ForegroundColor Cyan

Write-Host "`n🔗 Useful Commands:" -ForegroundColor Yellow
Write-Host "• Start development: ./start-dev.ps1" -ForegroundColor Cyan
Write-Host "• Deploy preview: cd sparks && npm run deploy:preview" -ForegroundColor Cyan
Write-Host "• Deploy production: cd sparks && npm run deploy:prod" -ForegroundColor Cyan
Write-Host "• Run tests: cd sparks && npm test" -ForegroundColor Cyan

Write-Host "`n📖 Documentation:" -ForegroundColor Yellow
Write-Host "• Architecture Overview: HYBRID_ARCHITECTURE.md" -ForegroundColor Cyan
Write-Host "• Supabase Setup: SUPABASE_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "• Firebase Setup: FIREBASE_STEP_BY_STEP_SETUP.md" -ForegroundColor Cyan
Write-Host "• Vercel Deployment: VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan

Write-Host "`n🚀 Happy coding!" -ForegroundColor Green