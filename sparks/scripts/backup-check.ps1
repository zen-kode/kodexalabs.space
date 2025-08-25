# Backup Verification Script for Sparks Project
# Run this before making major changes to verify your backup system

Write-Host "🔍 Backup System Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check Git status
Write-Host "\n📋 Git Status Check:" -ForegroundColor Yellow
git status --porcelain

if ($LASTEXITCODE -eq 0) {
    $changes = git status --porcelain
    if ($changes) {
        Write-Host "⚠️  You have uncommitted changes!" -ForegroundColor Red
        Write-Host "   Run: git add . && git commit -m 'Backup checkpoint'" -ForegroundColor White
    } else {
        Write-Host "✅ No uncommitted changes - you're safe!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Git not available or not a git repository" -ForegroundColor Red
}

# Show recent commits
Write-Host "\n📚 Recent Backup Points (Last 5 commits):" -ForegroundColor Yellow
git log --oneline -5 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot access git history" -ForegroundColor Red
} else {
    Write-Host "✅ Git history available for recovery" -ForegroundColor Green
}

# Check if important files exist
Write-Host "\n📁 Critical Files Check:" -ForegroundColor Yellow
$criticalFiles = @(
    "package.json",
    "src/app/page.tsx",
    "task-list.md",
    "TRAE-DEVELOPMENT-GUIDE.md"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (MISSING!)" -ForegroundColor Red
    }
}

# Quick build test
Write-Host "\n🔨 Quick Build Test:" -ForegroundColor Yellow
Write-Host "Testing if project builds without errors..." -ForegroundColor White

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    
    # Try a quick build check (just syntax)
    Write-Host "Running quick syntax check..." -ForegroundColor White
    $buildResult = npm run build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Project builds successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Build issues detected - check before making changes" -ForegroundColor Yellow
        Write-Host "   Last few lines of build output:" -ForegroundColor White
        $buildResult | Select-Object -Last 3 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    }
} else {
    Write-Host "⚠️  Dependencies not installed - run 'npm install' first" -ForegroundColor Yellow
}

# Summary
Write-Host "\n📊 Backup System Summary:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Create a quick backup if needed
$uncommitted = git status --porcelain 2>$null
if ($uncommitted) {
    Write-Host "\n🚨 RECOMMENDATION: Create backup before changes" -ForegroundColor Red
    Write-Host "   Quick backup command:" -ForegroundColor White
    Write-Host "   git add . && git commit -m 'Safety checkpoint - $(Get-Date -Format 'yyyy-MM-dd HH:mm')'" -ForegroundColor Yellow
} else {
    Write-Host "\n✅ You're ready to make changes safely!" -ForegroundColor Green
    Write-Host "   Your work is backed up in git commits" -ForegroundColor White
}

Write-Host "\n💡 Recovery Commands (if needed):" -ForegroundColor Cyan
Write-Host "   Undo last commit: git reset --soft HEAD~1" -ForegroundColor White
Write-Host "   Restore file: git checkout -- [filename]" -ForegroundColor White
Write-Host "   See changes: git diff" -ForegroundColor White

Write-Host "\n🎯 Ready to develop with confidence!" -ForegroundColor Green