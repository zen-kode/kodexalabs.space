# Vercel Deployment Setup Script
# This script helps set up your project for Vercel deployment

Write-Host "🚀 Vercel Deployment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Vercel CLI is installed
Write-Host "\n📋 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI installed: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check environment variables
Write-Host "\n🔧 Checking environment variables..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $hasSupabaseUrl = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }
    $hasSupabaseKey = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }
    
    if ($hasSupabaseUrl -and $hasSupabaseKey) {
        Write-Host "✅ Supabase environment variables found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Missing Supabase environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

# Check vercel.json
Write-Host "\n📄 Checking Vercel configuration..." -ForegroundColor Yellow
if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
}

Write-Host "\n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Login to Vercel: vercel login" -ForegroundColor White
Write-Host "2. Deploy your project: vercel" -ForegroundColor White
Write-Host "3. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "4. Configure Supabase Site URL with your Vercel domain" -ForegroundColor White

Write-Host "\n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Vercel setup: docs/vercel-deployment.md" -ForegroundColor White
Write-Host "- Supabase setup: docs/supabase-setup.md" -ForegroundColor White

# Offer to start deployment
Write-Host "\n🚀 Ready to deploy?" -ForegroundColor Cyan
$deploy = Read-Host "Do you want to start the deployment process now? (y/n)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "\n🔐 Logging into Vercel..." -ForegroundColor Yellow
    vercel login
    
    Write-Host "\n🚀 Starting deployment..." -ForegroundColor Yellow
    vercel
} else {
    Write-Host "\n👍 No problem! Run 'vercel login' and 'vercel' when you're ready." -ForegroundColor Green
}

Write-Host "\n✨ Setup complete!" -ForegroundColor Green