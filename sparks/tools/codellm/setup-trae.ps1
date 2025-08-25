# Trae IDE Setup Script for Sparks AI Toolkit
# This script initializes and verifies the .codellm configuration for Trae IDE

Write-Host "[SETUP] Initializing Trae IDE Configuration for Sparks..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if .codellm directory exists
if (-not (Test-Path ".codellm")) {
    Write-Host "[ERROR] .codellm directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "[CHECK] Verifying .codellm directory structure..." -ForegroundColor Yellow

# Verify configuration files
$configFiles = @(
    ".codellm/trae-config.json",
    ".codellm/README.md",
    ".codellm/validate-config.js"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] $file" -ForegroundColor Red
    }
}

# Check rules directory
if (Test-Path ".codellm/rules") {
    $ruleFiles = Get-ChildItem ".codellm/rules" -Filter "*.mdc"
    Write-Host "   [OK] .codellm/rules ($($ruleFiles.Count) rule files)" -ForegroundColor Green
    
    foreach ($rule in $ruleFiles) {
        Write-Host "      [RULE] $($rule.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "   [MISSING] .codellm/rules" -ForegroundColor Red
}

Write-Host ""
Write-Host "[VALIDATE] Running configuration validation..." -ForegroundColor Yellow

# Run validation script
try {
    $validationResult = node ".codellm/validate-config.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Configuration validation passed!" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] Configuration validation failed!" -ForegroundColor Red
        Write-Host $validationResult
    }
} catch {
    Write-Host "[WARNING] Could not run validation (Node.js required)" -ForegroundColor Yellow
    Write-Host "   Please ensure Node.js is installed to run validation" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[SUMMARY] Trae IDE Integration Summary:" -ForegroundColor Cyan
Write-Host "   * Configuration file: .codellm/trae-config.json" -ForegroundColor White
Write-Host "   * Rules directory: .codellm/rules/" -ForegroundColor White
Write-Host "   * Documentation: .codellm/README.md" -ForegroundColor White
Write-Host "   * Validation script: .codellm/validate-config.js" -ForegroundColor White

Write-Host ""
Write-Host "[TRIGGERS] Key Triggers:" -ForegroundColor Cyan
Write-Host "   * Task Orchestrator: @666" -ForegroundColor White
Write-Host "   * Guidance: 'guide me', 'help', 'stuck', 'lost'" -ForegroundColor White
Write-Host "   * Health Check: Runs on project open" -ForegroundColor White

Write-Host ""
Write-Host "[COMMANDS] Development Commands:" -ForegroundColor Cyan
Write-Host "   * npm run dev          (Interactive CLI with backend selection)" -ForegroundColor White
Write-Host "   * npm run dev:auto     (Auto-detect backend)" -ForegroundColor White
Write-Host "   * npm run dev:simple   (Port 9002 fallback)" -ForegroundColor White
Write-Host "   * npm run genkit:dev   (AI development)" -ForegroundColor White
Write-Host "   * npm run genkit:watch (AI with file watching)" -ForegroundColor White

Write-Host ""
Write-Host "[NEXT] Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open this project in Trae IDE" -ForegroundColor White
Write-Host "   2. Trae IDE will automatically detect the .codellm configuration" -ForegroundColor White
Write-Host "   3. Try typing '@666' to activate the task orchestrator" -ForegroundColor White
Write-Host "   4. Use 'guide me' when you need direction" -ForegroundColor White
Write-Host "   5. Check .codellm/README.md for detailed documentation" -ForegroundColor White

Write-Host ""
Write-Host "[SUCCESS] Trae IDE configuration is ready!" -ForegroundColor Green
Write-Host "   The Sparks AI Toolkit is now optimized for Trae IDE integration." -ForegroundColor Gray
Write-Host ""