#!/usr/bin/env pwsh
# Hybrid Architecture Deployment Script
# Deploys Supabase + Firebase + Vercel stack

param(
    [string]$Environment = "production",
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$Verbose
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "\n🚀 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Error "Missing .env file. Please create one with required environment variables."
        Write-Host "Required variables:"
        Write-Host "  - NEXT_PUBLIC_SUPABASE_URL"
        Write-Host "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        Write-Host "  - SUPABASE_SERVICE_ROLE_KEY"
        Write-Host "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        Write-Host "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
        Write-Host "  - FIREBASE_PRIVATE_KEY"
        Write-Host "  - VERCEL_TOKEN"
        exit 1
    }
    Write-Success "Environment file found"
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites"
    
    $missing = @()
    
    if (-not (Test-Command "node")) { $missing += "Node.js" }
    if (-not (Test-Command "npm")) { $missing += "npm" }
    if (-not (Test-Command "git")) { $missing += "Git" }
    if (-not (Test-Command "vercel")) { $missing += "Vercel CLI" }
    if (-not (Test-Command "firebase")) { $missing += "Firebase CLI" }
    if (-not (Test-Command "supabase")) { $missing += "Supabase CLI" }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing prerequisites: $($missing -join ', ')"
        Write-Host "\nInstall missing tools:"
        Write-Host "  npm install -g vercel firebase-tools @supabase/cli"
        exit 1
    }
    
    Write-Success "All prerequisites installed"
}

function Install-Dependencies {
    Write-Step "Installing dependencies"
    
    if (-not (Test-Path "sparks/package.json")) {
        Write-Error "package.json not found in sparks directory"
        exit 1
    }
    
    Push-Location "sparks"
    try {
        if ($Verbose) {
            npm install
        } else {
            npm install --silent
        }
        Write-Success "Dependencies installed"
    } finally {
        Pop-Location
    }
}

function Run-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests (--SkipTests flag provided)"
        return
    }
    
    Write-Step "Running tests"
    
    Push-Location "sparks"
    try {
        # Type checking
        Write-Host "Running type check..."
        npm run type-check
        
        # Linting
        Write-Host "Running linter..."
        npm run lint
        
        # Unit tests (if available)
        if (Test-Path "__tests__" -PathType Container) {
            Write-Host "Running unit tests..."
            npm run test
        }
        
        Write-Success "All tests passed"
    } catch {
        Write-Error "Tests failed: $($_.Exception.Message)"
        exit 1
    } finally {
        Pop-Location
    }
}

function Build-Application {
    if ($SkipBuild) {
        Write-Warning "Skipping build (--SkipBuild flag provided)"
        return
    }
    
    Write-Step "Building application"
    
    Push-Location "sparks"
    try {
        if ($Verbose) {
            npm run build
        } else {
            npm run build --silent
        }
        Write-Success "Application built successfully"
    } catch {
        Write-Error "Build failed: $($_.Exception.Message)"
        exit 1
    } finally {
        Pop-Location
    }
}

function Deploy-Supabase {
    Write-Step "Deploying Supabase migrations"
    
    try {
        # Check if logged in
        $loginCheck = supabase projects list 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Not logged into Supabase. Please run: supabase login"
            if (-not $DryRun) {
                supabase login
            }
        }
        
        if ($DryRun) {
            Write-Host "[DRY RUN] Would deploy Supabase migrations"
        } else {
            # Deploy database migrations
            supabase db push
            
            # Generate types
            Push-Location "sparks"
            npm run supabase:types
            Pop-Location
        }
        
        Write-Success "Supabase deployment completed"
    } catch {
        Write-Error "Supabase deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

function Deploy-Firebase {
    Write-Step "Deploying Firebase functions and storage"
    
    try {
        # Check if logged in
        $loginCheck = firebase projects:list 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Not logged into Firebase. Please run: firebase login"
            if (-not $DryRun) {
                firebase login
            }
        }
        
        if ($DryRun) {
            Write-Host "[DRY RUN] Would deploy Firebase functions and storage rules"
        } else {
            # Deploy only functions and storage (not hosting)
            firebase deploy --only functions,storage
        }
        
        Write-Success "Firebase deployment completed"
    } catch {
        Write-Error "Firebase deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

function Deploy-Vercel {
    Write-Step "Deploying to Vercel"
    
    try {
        # Check if logged in
        $loginCheck = vercel whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Not logged into Vercel. Please run: vercel login"
            if (-not $DryRun) {
                vercel login
            }
        }
        
        Push-Location "sparks"
        try {
            if ($DryRun) {
                Write-Host "[DRY RUN] Would deploy to Vercel"
            } else {
                if ($Environment -eq "production") {
                    vercel --prod
                } else {
                    vercel
                }
            }
        } finally {
            Pop-Location
        }
        
        Write-Success "Vercel deployment completed"
    } catch {
        Write-Error "Vercel deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

function Test-Deployment {
    Write-Step "Testing deployment"
    
    try {
        # Get Vercel URL
        Push-Location "sparks"
        $vercelUrl = vercel ls --scope=team 2>$null | Select-String "https://" | Select-Object -First 1
        Pop-Location
        
        if ($vercelUrl) {
            $url = $vercelUrl.ToString().Trim()
            Write-Host "Testing health endpoint: $url/api/health"
            
            if (-not $DryRun) {
                $response = Invoke-RestMethod -Uri "$url/api/health" -Method GET -TimeoutSec 30
                
                if ($response.status -eq "healthy") {
                    Write-Success "Health check passed - all services operational"
                } elseif ($response.status -eq "degraded") {
                    Write-Warning "Health check shows degraded performance"
                    Write-Host $response.message
                } else {
                    Write-Error "Health check failed"
                    Write-Host $response.message
                }
            } else {
                Write-Host "[DRY RUN] Would test health endpoint"
            }
        } else {
            Write-Warning "Could not determine Vercel URL for testing"
        }
    } catch {
        Write-Warning "Deployment test failed: $($_.Exception.Message)"
    }
}

function Show-Summary {
    Write-Step "Deployment Summary"
    
    Write-Host "\n📊 Hybrid Architecture Deployment Complete!"
    Write-Host "\n🏗️  Architecture:"
    Write-Host "   • Supabase: Database + Authentication"
    Write-Host "   • Firebase: Storage + Functions + Analytics"
    Write-Host "   • Vercel: Hosting + Edge Functions"
    
    Write-Host "\n🔗 Useful Commands:"
    Write-Host "   • Health Check: curl <vercel-url>/api/health"
    Write-Host "   • Supabase Dashboard: supabase dashboard"
    Write-Host "   • Firebase Console: firebase open"
    Write-Host "   • Vercel Dashboard: vercel dashboard"
    
    Write-Host "\n📚 Documentation:"
    Write-Host "   • Architecture: ./HYBRID_ARCHITECTURE.md"
    Write-Host "   • Supabase Setup: ./SUPABASE_SETUP_GUIDE.md"
    Write-Host "   • Firebase Setup: ./FIREBASE_STEP_BY_STEP_SETUP.md"
    Write-Host "   • Vercel Setup: ./VERCEL_DEPLOYMENT_GUIDE.md"
}

# Main execution
try {
    Write-ColorOutput "\n🚀 Hybrid Architecture Deployment Script" $Blue
    Write-ColorOutput "Environment: $Environment" $Yellow
    
    if ($DryRun) {
        Write-ColorOutput "[DRY RUN MODE - No actual deployments will be made]" $Yellow
    }
    
    Test-EnvFile
    Test-Prerequisites
    Install-Dependencies
    Run-Tests
    Build-Application
    Deploy-Supabase
    Deploy-Firebase
    Deploy-Vercel
    Test-Deployment
    Show-Summary
    
    Write-Success "\n🎉 Deployment completed successfully!"
    
} catch {
    Write-Error "\n💥 Deployment failed: $($_.Exception.Message)"
    Write-Host "\nFor help, check the documentation or run with -Verbose flag"
    exit 1
}