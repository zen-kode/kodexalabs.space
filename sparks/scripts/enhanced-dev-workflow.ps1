#!/usr/bin/env pwsh
# Enhanced Interactive Development Workflow Script for Firebase/Supabase Backend Selection

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('firebase', 'supabase', 'auto')]
    [string]$Backend = '',
    
    [Parameter(Mandatory=$false)]
    [switch]$Interactive = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Status = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 9002,
    
    [Parameter(Mandatory=$false)]
    [switch]$Setup = $false
)

# Enhanced color functions for better UX
function Write-ColorText {
    param([string]$Text, [string]$Color = 'White')
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success { param([string]$Text) Write-ColorText "✅ $Text" 'Green' }
function Write-Warning { param([string]$Text) Write-ColorText "⚠️  $Text" 'Yellow' }
function Write-Error { param([string]$Text) Write-ColorText "❌ $Text" 'Red' }
function Write-Info { param([string]$Text) Write-ColorText "ℹ️  $Text" 'Cyan' }
function Write-Header { param([string]$Text) Write-ColorText "\n🚀 === $Text ===" 'Magenta' }
function Write-Step { param([string]$Text) Write-ColorText "📋 $Text" 'Blue' }

# Configuration
$EnvFile = '.env'
$ExampleEnvFile = '.env.example'

# Required environment variables for each backend
$FirebaseRequiredVars = @('NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'GEMINI_API_KEY')
$SupabaseRequiredVars = @('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'GEMINI_API_KEY')

function Show-Banner {
    Clear-Host
    Write-ColorText "\n" 'White'
    Write-ColorText "╔══════════════════════════════════════════════════════════════╗" 'Magenta'
    Write-ColorText "║          🔥 SPARKS INTERACTIVE DEV WORKFLOW 🔥              ║" 'Magenta'
    Write-ColorText "║        Firebase & Supabase Backend Manager v2.0             ║" 'Magenta'
    Write-ColorText "╚══════════════════════════════════════════════════════════════╝" 'Magenta'
    Write-ColorText "\n" 'White'
}

function Test-PortAvailability {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

function Get-AvailablePort {
    param([int]$StartPort = 9002)
    
    for ($port = $StartPort; $port -lt ($StartPort + 100); $port++) {
        if (Test-PortAvailability $port) {
            return $port
        }
    }
    return $StartPort
}

function Get-CurrentBackend {
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        if ($envContent -match 'NEXT_PUBLIC_DATABASE_PROVIDER=(.+)') {
            return $matches[1].Trim()
        }
    }
    return 'none'
}

function Set-BackendProvider {
    param([string]$Provider)
    
    Write-Step "Configuring backend provider: $Provider"
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        if ($envContent -match 'NEXT_PUBLIC_DATABASE_PROVIDER=.+') {
            $envContent = $envContent -replace 'NEXT_PUBLIC_DATABASE_PROVIDER=.+', "NEXT_PUBLIC_DATABASE_PROVIDER=$Provider"
        } else {
            $envContent += "\nNEXT_PUBLIC_DATABASE_PROVIDER=$Provider\n"
        }
        Set-Content -Path $EnvFile -Value $envContent -NoNewline
    } else {
        Write-Warning ".env file not found. Creating from .env.example..."
        if (Test-Path $ExampleEnvFile) {
            Copy-Item $ExampleEnvFile $EnvFile
            $envContent = Get-Content $EnvFile -Raw
            $envContent += "\nNEXT_PUBLIC_DATABASE_PROVIDER=$Provider\n"
            Set-Content -Path $EnvFile -Value $envContent -NoNewline
        } else {
            Write-Error ".env.example file not found!"
            return $false
        }
    }
    
    Write-Success "Backend provider configured: $Provider"
    return $true
}

function Test-EnvironmentVariables {
    param([string]$Backend)
    
    Write-Step "Validating environment variables for $Backend..."
    
    $requiredVars = if ($Backend -eq 'firebase') { $FirebaseRequiredVars } else { $SupabaseRequiredVars }
    $missingVars = @()
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        foreach ($var in $requiredVars) {
            if ($envContent -notmatch "$var=.+") {
                $missingVars += $var
            }
        }
    } else {
        $missingVars = $requiredVars
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Warning "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-ColorText "   ❌ $var" 'Red'
        }
        Write-Info "Please add these variables to your .env file before continuing."
        return $false
    }
    
    Write-Success "All required environment variables are configured"
    return $true
}

function Show-BackendStatus {
    $currentBackend = Get-CurrentBackend
    
    Write-Header "Current Backend Configuration"
    
    if ($currentBackend -eq 'none') {
        Write-Warning "No backend provider configured"
    } else {
        Write-Success "Current provider: $currentBackend"
        
        # Test environment variables
        $envValid = Test-EnvironmentVariables $currentBackend
        
        if ($envValid) {
            Write-Success "Environment configuration: Valid ✅"
        } else {
            Write-Error "Environment configuration: Invalid ❌"
        }
    }
    
    Write-Info "Available backends:"
    Write-ColorText "  🔥 Firebase  - Development & AI integration" 'Yellow'
    Write-ColorText "  🐘 Supabase  - Production & scalability" 'Blue'
    
    Write-ColorText "\nPress any key to continue..." 'Gray'
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-InteractiveMenu {
    Write-Header "Backend Selection Menu"
    
    $currentBackend = Get-CurrentBackend
    if ($currentBackend -ne 'none') {
        Write-Info "Current backend: $currentBackend"
    }
    
    Write-ColorText "\nSelect your backend:"
    Write-ColorText "1. 🔥 Firebase (Development + AI Features)" 'Yellow'
    Write-ColorText "2. 🐘 Supabase (Production Ready)" 'Blue'
    Write-ColorText "3. 📊 Show current status" 'Cyan'
    Write-ColorText "4. ⚙️  Setup environment" 'Green'
    Write-ColorText "5. 🚪 Exit" 'Red'
    
    do {
        Write-ColorText "\n➤ " 'White' -NoNewline
        $choice = Read-Host "Enter your choice (1-5)"
        
        switch ($choice) {
            '1' {
                Write-Success "Selected: Firebase"
                return 'firebase'
            }
            '2' {
                Write-Success "Selected: Supabase"
                return 'supabase'
            }
            '3' {
                Show-BackendStatus
                Show-InteractiveMenu
                return
            }
            '4' {
                Start-EnvironmentSetup
                Show-InteractiveMenu
                return
            }
            '5' {
                Write-Info "Goodbye! 👋"
                exit 0
            }
            default {
                Write-Warning "Invalid choice. Please enter 1-5."
                continue
            }
        }
    } while ($true)
}

function Start-EnvironmentSetup {
    Write-Header "Environment Setup"
    
    if (-not (Test-Path $EnvFile)) {
        if (Test-Path $ExampleEnvFile) {
            Write-Step "Creating .env file from .env.example..."
            Copy-Item $ExampleEnvFile $EnvFile
            Write-Success ".env file created successfully"
        } else {
            Write-Error ".env.example file not found!"
            return
        }
    }
    
    Write-Info "Please edit the .env file with your configuration:"
    Write-ColorText "  📝 Open .env file in your editor" 'Yellow'
    Write-ColorText "  🔑 Add your API keys and configuration" 'Yellow'
    Write-ColorText "  💾 Save the file" 'Yellow'
    
    Write-ColorText "\nPress any key when ready..." 'Gray'
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Start-NpmCommand {
    param([string]$Command, [string]$Description, [bool]$Background = $false)
    
    Write-Step $Description
    
    try {
        if ($Background) {
            # Start in background for Genkit
            $processInfo = New-Object System.Diagnostics.ProcessStartInfo
            $processInfo.FileName = "cmd.exe"
            $processInfo.Arguments = "/c npm $Command"
            $processInfo.UseShellExecute = $false
            $processInfo.CreateNoWindow = $true
            $process = [System.Diagnostics.Process]::Start($processInfo)
            Write-Success "Started $Description in background (PID: $($process.Id))"
            return $process
        } else {
            # Run in foreground
            $expression = "npm $Command"
            Write-Info "Executing: $expression"
            Invoke-Expression $expression
        }
    } catch {
        Write-Error "Failed to execute: npm $Command"
        Write-Error $_.Exception.Message
        return $null
    }
}

function Start-DevelopmentServer {
    param([string]$Backend, [int]$Port)
    
    Write-Header "Starting Development Server"
    
    # Validate environment
    if (-not (Test-EnvironmentVariables $Backend)) {
        Write-Error "Cannot start server due to missing environment variables"
        Write-Info "To fix this:"
        Write-Info "1. Run this script with -Setup flag"
        Write-Info "2. Or manually edit your .env file"
        Write-Info "3. Then run this script again"
        
        Write-ColorText "\nWould you like to setup environment now? (y/n): " 'Yellow' -NoNewline
        $response = Read-Host
        if ($response -eq 'y' -or $response -eq 'Y') {
            Start-EnvironmentSetup
            if (-not (Test-EnvironmentVariables $Backend)) {
                Write-Error "Environment setup incomplete. Exiting."
                exit 1
            }
        } else {
            exit 1
        }
    }
    
    # Check port availability
    if (-not (Test-PortAvailability $Port)) {
        Write-Warning "Port $Port is already in use"
        $availablePort = Get-AvailablePort $Port
        Write-Info "Using available port: $availablePort"
        $Port = $availablePort
    }
    
    Write-Success "Starting development server with $Backend backend on port $Port"
    Write-Info "Server will be available at: http://localhost:$Port"
    
    if ($Backend -eq 'firebase') {
        Write-Info "Firebase features enabled:"
        Write-Info "   🤖 AI processing with Genkit"
        Write-Info "   🔥 Real-time database"
        Write-Info "   🔐 Authentication"
        Write-Info "\nStarting Next.js + Genkit servers..."
        
        # Start Genkit in background
        $genkitProcess = Start-NpmCommand "run genkit:dev" "Starting Genkit AI server" $true
        
        if ($genkitProcess) {
            Write-Info "Waiting for Genkit to initialize..."
            Start-Sleep -Seconds 3
            
            # Start Next.js in foreground
            Start-NpmCommand "run dev:next-only -- -p $Port" "Starting Next.js development server"
        } else {
            Write-Warning "Genkit failed to start. Starting Next.js only..."
            Start-NpmCommand "run dev:next-only -- -p $Port" "Starting Next.js development server"
        }
    } else {
        Write-Info "Supabase features enabled:"
        Write-Info "   🐘 PostgreSQL database"
        Write-Info "   🔒 Row Level Security"
        Write-Info "   📡 Real-time subscriptions"
        Write-Info "\nStarting Next.js server..."
        
        # Start Next.js for Supabase
        Start-NpmCommand "run dev:next-only -- -p $Port" "Starting Next.js development server"
    }
}

function Get-AutoBackend {
    Write-Step "Auto-detecting backend configuration..."
    
    if (Test-Path $EnvFile) {
        $envContent = Get-Content $EnvFile -Raw
        
        $hasFirebase = ($envContent -match 'NEXT_PUBLIC_FIREBASE_API_KEY=.+') -and 
                      ($envContent -match 'NEXT_PUBLIC_FIREBASE_PROJECT_ID=.+')
        $hasSupabase = ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL=.+') -and 
                      ($envContent -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.+')
        
        if ($hasFirebase -and -not $hasSupabase) {
            Write-Success "Auto-detected: Firebase (based on environment variables)"
            return 'firebase'
        } elseif ($hasSupabase -and -not $hasFirebase) {
            Write-Success "Auto-detected: Supabase (based on environment variables)"
            return 'supabase'
        } elseif ($hasFirebase -and $hasSupabase) {
            $current = Get-CurrentBackend
            if ($current -ne 'none') {
                Write-Success "Auto-detected: $current (from current configuration)"
                return $current
            }
        }
    }
    
    Write-Warning "Could not auto-detect backend. Please choose manually."
    return ''
}

# Main script logic
Show-Banner

# Handle setup mode
if ($Setup) {
    Start-EnvironmentSetup
    exit 0
}

# Handle status mode
if ($Status) {
    Show-BackendStatus
    exit 0
}

# Determine backend
$selectedBackend = ''

if ($Interactive -or $Backend -eq '') {
    $selectedBackend = Show-InteractiveMenu
} elseif ($Backend -eq 'auto') {
    $selectedBackend = Get-AutoBackend
    if ($selectedBackend -eq '') {
        $selectedBackend = Show-InteractiveMenu
    }
} else {
    $selectedBackend = $Backend
    Write-Success "Using specified backend: $selectedBackend"
}

# Validate backend selection
if ($selectedBackend -notin @('firebase', 'supabase')) {
    Write-Error "Invalid backend selection: $selectedBackend"
    exit 1
}

# Set the backend provider
if (-not (Set-BackendProvider $selectedBackend)) {
    Write-Error "Failed to configure backend"
    exit 1
}

# Start the development server
Start-DevelopmentServer $selectedBackend $Port