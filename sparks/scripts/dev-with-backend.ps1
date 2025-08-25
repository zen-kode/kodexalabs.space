# Development Server with Backend Selection
# This script allows you to start the development server with either Firebase or Supabase backend

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("firebase", "supabase")]
    [string]$Backend = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Interactive = $false
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Banner {
    Write-ColorOutput "" $White
    Write-ColorOutput "🚀 Sparks Development Server" $Cyan
    Write-ColorOutput "================================" $Cyan
    Write-ColorOutput "" $White
}

function Show-BackendOptions {
    Write-ColorOutput "Available Backend Options:" $Yellow
    Write-ColorOutput "" $White
    Write-ColorOutput "1. 🔥 Firebase (Recommended for Development)" $Green
    Write-ColorOutput "   - Real-time database with Firestore" $White
    Write-ColorOutput "   - Integrated with Genkit AI flows" $White
    Write-ColorOutput "   - Easy setup and configuration" $White
    Write-ColorOutput "" $White
    Write-ColorOutput "2. 🐘 Supabase (Production Ready)" $Green
    Write-ColorOutput "   - PostgreSQL database" $White
    Write-ColorOutput "   - Advanced querying capabilities" $White
    Write-ColorOutput "   - Production-grade features" $White
    Write-ColorOutput "" $White
}

function Get-UserChoice {
    while ($true) {
        $choice = Read-Host "Select backend (1 for Firebase, 2 for Supabase, or 'q' to quit)"
        
        switch ($choice.ToLower()) {
            "1" { return "firebase" }
            "firebase" { return "firebase" }
            "2" { return "supabase" }
            "supabase" { return "supabase" }
            "q" { 
                Write-ColorOutput "Exiting..." $Yellow
                exit 0 
            }
            default {
                Write-ColorOutput "Invalid choice. Please enter 1, 2, or 'q' to quit." $Red
            }
        }
    }
}

function Update-EnvFile {
    param(
        [string]$SelectedBackend
    )
    
    $envFile = ".env"
    $envExampleFile = ".env.example"
    
    # Create .env from .env.example if it doesn't exist
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envExampleFile) {
            Copy-Item $envExampleFile $envFile
            Write-ColorOutput "Created .env file from .env.example" $Green
        } else {
            Write-ColorOutput "Warning: .env.example not found. Creating basic .env file." $Yellow
            New-Item -Path $envFile -ItemType File -Force | Out-Null
        }
    }
    
    # Read current .env content
    $envContent = Get-Content $envFile -ErrorAction SilentlyContinue
    if (-not $envContent) {
        $envContent = @()
    }
    
    # Update or add DATABASE_PROVIDER
    $providerLineExists = $false
    $updatedContent = @()
    
    foreach ($line in $envContent) {
        if ($line -match "^NEXT_PUBLIC_DATABASE_PROVIDER=") {
            $updatedContent += "NEXT_PUBLIC_DATABASE_PROVIDER=$SelectedBackend"
            $providerLineExists = $true
        } else {
            $updatedContent += $line
        }
    }
    
    # Add provider line if it doesn't exist
    if (-not $providerLineExists) {
        $updatedContent += "NEXT_PUBLIC_DATABASE_PROVIDER=$SelectedBackend"
    }
    
    # Write updated content back to .env
    $updatedContent | Set-Content $envFile
    
    Write-ColorOutput "Updated .env file with DATABASE_PROVIDER=$SelectedBackend" $Green
}

function Validate-BackendConfig {
    param(
        [string]$SelectedBackend
    )
    
    $envFile = ".env"
    if (-not (Test-Path $envFile)) {
        Write-ColorOutput "Warning: .env file not found. Some features may not work properly." $Yellow
        return $false
    }
    
    $envContent = Get-Content $envFile
    $missingVars = @()
    
    if ($SelectedBackend -eq "firebase") {
        $requiredVars = @(
            "NEXT_PUBLIC_FIREBASE_API_KEY",
            "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
            "GEMINI_API_KEY"
        )
        
        foreach ($var in $requiredVars) {
            $found = $envContent | Where-Object { $_ -match "^$var=" -and $_ -notmatch "=your_.*_here$" -and $_ -notmatch "=$" }
            if (-not $found) {
                $missingVars += $var
            }
        }
    } elseif ($SelectedBackend -eq "supabase") {
        $requiredVars = @(
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "GEMINI_API_KEY"
        )
        
        foreach ($var in $requiredVars) {
            $found = $envContent | Where-Object { $_ -match "^$var=" -and $_ -notmatch "=your_.*_here$" -and $_ -notmatch "=$" }
            if (-not $found) {
                $missingVars += $var
            }
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-ColorOutput "" $White
        Write-ColorOutput "⚠️  Missing or incomplete configuration:" $Yellow
        foreach ($var in $missingVars) {
            Write-ColorOutput "   - $var" $Red
        }
        Write-ColorOutput "" $White
        Write-ColorOutput "Please update your .env file with the required values." $Yellow
        Write-ColorOutput "You can continue, but some features may not work properly." $Yellow
        Write-ColorOutput "" $White
        
        $continue = Read-Host "Continue anyway? (y/N)"
        return ($continue.ToLower() -eq "y" -or $continue.ToLower() -eq "yes")
    }
    
    return $true
}

function Start-DevServer {
    param(
        [string]$SelectedBackend
    )
    
    Write-ColorOutput "" $White
    Write-ColorOutput "🚀 Starting development server with $SelectedBackend backend..." $Green
    Write-ColorOutput "" $White
    
    # Start the development server
    try {
        if ($SelectedBackend -eq "firebase") {
            Write-ColorOutput "Starting Next.js dev server and Genkit..." $Cyan
            Write-ColorOutput "" $White
            
            # Start both Next.js and Genkit in parallel
            $job1 = Start-Job -ScriptBlock { 
                Set-Location $using:PWD
                npm run dev 
            }
            
            $job2 = Start-Job -ScriptBlock { 
                Set-Location $using:PWD
                Start-Sleep 3  # Wait a bit for Next.js to start
                npm run genkit:dev 
            }
            
            Write-ColorOutput "Development servers started!" $Green
            Write-ColorOutput "" $White
            Write-ColorOutput "📱 Next.js: http://localhost:9002" $Cyan
            Write-ColorOutput "🤖 Genkit: http://localhost:4000" $Cyan
            Write-ColorOutput "" $White
            Write-ColorOutput "Press Ctrl+C to stop all servers" $Yellow
            
            # Wait for jobs and handle cleanup
            try {
                Wait-Job $job1, $job2
            } finally {
                Remove-Job $job1, $job2 -Force
            }
        } else {
            Write-ColorOutput "Starting Next.js dev server with Supabase..." $Cyan
            Write-ColorOutput "" $White
            npm run dev
        }
    } catch {
        Write-ColorOutput "Error starting development server: $($_.Exception.Message)" $Red
        exit 1
    }
}

# Main execution
Show-Banner

# Determine backend selection
if ($Backend -eq "") {
    if ($Interactive -or $args.Count -eq 0) {
        Show-BackendOptions
        $Backend = Get-UserChoice
    } else {
        # Default to firebase for development
        $Backend = "firebase"
        Write-ColorOutput "No backend specified, defaulting to Firebase for development." $Yellow
        Write-ColorOutput "Use -Backend parameter to specify: firebase or supabase" $White
        Write-ColorOutput "" $White
    }
}

Write-ColorOutput "Selected Backend: $Backend" $Green
Write-ColorOutput "" $White

# Update environment configuration
Update-EnvFile -SelectedBackend $Backend

# Validate configuration
if (-not (Validate-BackendConfig -SelectedBackend $Backend)) {
    Write-ColorOutput "Configuration validation failed. Exiting." $Red
    exit 1
}

# Start development server
Start-DevServer -SelectedBackend $Backend