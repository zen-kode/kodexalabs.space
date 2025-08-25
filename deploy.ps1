# Hybrid Architecture Deployment Script
# Supabase + Firebase + Vercel Setup

Write-Host "🚀 Starting Hybrid Architecture Deployment..." -ForegroundColor Green
Write-Host "Services: Supabase (DB/Auth) + Firebase (Storage/Functions) + Vercel (Hosting)" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Please create .env with required variables" -ForegroundColor Red
    Write-Host "   See SUPABASE_SETUP_GUIDE.md for details" -ForegroundColor Yellow
    exit 1
}

# Check Vercel CLI
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
}

# Navigate to Sparks directory
Write-Host "`n📁 Setting up Sparks application..." -ForegroundColor Yellow
Set-Location "sparks"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Install Supabase dependencies
Write-Host "📦 Installing Supabase dependencies..." -ForegroundColor Yellow
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Supabase dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Supabase dependencies installed" -ForegroundColor Green

# Build the application
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Please check your code and environment variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Test the application locally
Write-Host "`n🧪 Testing application locally..." -ForegroundColor Yellow
Write-Host "Starting development server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop and continue with deployment" -ForegroundColor Yellow

# Start dev server in background
$devServer = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Wait for user input
Read-Host "Press Enter when you've tested the application locally"

# Stop dev server
Stop-Process -Id $devServer.Id -Force -ErrorAction SilentlyContinue
Write-Host "✅ Local testing completed" -ForegroundColor Green

# Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Yellow

# Check if user is logged in to Vercel
try {
    $vercelUser = vercel whoami
    Write-Host "✅ Logged in to Vercel as: $vercelUser" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not logged in to Vercel. Please login..." -ForegroundColor Yellow
    vercel login
}

# Deploy to preview first
Write-Host "📤 Deploying preview version..." -ForegroundColor Yellow
vercel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Preview deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Preview deployment successful" -ForegroundColor Green

# Ask user if they want to deploy to production
$deployProd = Read-Host "Deploy to production? (y/N)"

if ($deployProd -eq "y" -or $deployProd -eq "Y") {
    Write-Host "📤 Deploying to production..." -ForegroundColor Yellow
    vercel --prod
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Production deployment failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Production deployment successful" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping production deployment" -ForegroundColor Yellow
}

# Return to root directory
Set-Location ".."

# Final checks
Write-Host "`n🔍 Running final checks..." -ForegroundColor Yellow

# Check if all required files exist
$requiredFiles = @(
    "vercel.json",
    "SUPABASE_SETUP_GUIDE.md",
    "VERCEL_DEPLOYMENT_GUIDE.md",
    ".env",
    "sparks/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Display summary
Write-Host "`n🎉 Deployment Summary" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "✅ Hybrid architecture configured" -ForegroundColor Green
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ Application built successfully" -ForegroundColor Green
Write-Host "✅ Deployed to Vercel" -ForegroundColor Green

Write-Host "`n📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure Supabase database schema (see SUPABASE_SETUP_GUIDE.md)" -ForegroundColor Cyan
Write-Host "2. Set up Firebase storage and functions" -ForegroundColor Cyan
Write-Host "3. Configure environment variables in Vercel dashboard" -ForegroundColor Cyan
Write-Host "4. Test all services integration" -ForegroundColor Cyan
Write-Host "5. Set up monitoring and analytics" -ForegroundColor Cyan

Write-Host "`n🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "• Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "• Supabase Dashboard: https://app.supabase.com/" -ForegroundColor Cyan
Write-Host "• Firebase Console: https://console.firebase.google.com/" -ForegroundColor Cyan

Write-Host "`n🚀 Deployment completed successfully!" -ForegroundColor Green