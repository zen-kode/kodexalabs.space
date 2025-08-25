# Setup script for automated changelog system
# This script configures git hooks and ensures proper permissions

Write-Host "Setting up automated changelog system..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Ensure scripts directory exists
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
    Write-Host "Created scripts directory" -ForegroundColor Yellow
}

# Check if changelog file exists
$changelogFile = "src/app/(main)/changelogs/page.tsx"
if (-not (Test-Path $changelogFile)) {
    Write-Host "Warning: Changelog file not found at $changelogFile" -ForegroundColor Yellow
    Write-Host "The automated system will still be set up, but won't work until the file exists." -ForegroundColor Yellow
} else {
    Write-Host "Changelog file found" -ForegroundColor Green
}

# Check if git hooks exist
$hookFiles = @(
    ".git/hooks/post-commit",
    ".git/hooks/post-commit.ps1",
    ".git/hooks/post-commit.sh",
    "scripts/update-changelog.js"
)

$allHooksExist = $true
foreach ($hookFile in $hookFiles) {
    if (Test-Path $hookFile) {
        Write-Host "Found: $hookFile" -ForegroundColor Green
    } else {
        Write-Host "Missing: $hookFile" -ForegroundColor Red
        $allHooksExist = $false
    }
}

if (-not $allHooksExist) {
    Write-Host "Some required files are missing. Please ensure all hook files are created." -ForegroundColor Red
    exit 1
}

# Make hooks executable (for Git Bash compatibility)
if (Get-Command "chmod" -ErrorAction SilentlyContinue) {
    chmod +x .git/hooks/post-commit
    chmod +x .git/hooks/post-commit.sh
    Write-Host "Made hooks executable" -ForegroundColor Green
} else {
    Write-Host "chmod not available - hooks may not be executable in Git Bash" -ForegroundColor Yellow
}

# Test the changelog update script
Write-Host "Testing changelog update script..." -ForegroundColor Cyan
try {
    # Test with dummy data
    $testArgs = @(
        "scripts/update-changelog.js",
        "abc1234",
        "Test commit message",
        "Test Author",
        "2024-01-20"
    )
    
    # Run in test mode
    $env:CHANGELOG_TEST_MODE = "true"
    & node $testArgs
    $env:CHANGELOG_TEST_MODE = $null
    
    Write-Host "Changelog script test completed" -ForegroundColor Green
} catch {
    Write-Host "Changelog script test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This might be normal if the changelog structure is different than expected." -ForegroundColor Yellow
}

# Configure git to use hooks
Write-Host "Configuring git settings..." -ForegroundColor Cyan
git config core.hooksPath .git/hooks
Write-Host "Git hooks path configured" -ForegroundColor Green

# Summary
Write-Host "" 
Write-Host "Automated changelog system setup complete!" -ForegroundColor Green
Write-Host "" 
Write-Host "What happens now:" -ForegroundColor Cyan
Write-Host "  - Every git commit will automatically update the changelog" -ForegroundColor White
Write-Host "  - Commit messages are analyzed and categorized" -ForegroundColor White
Write-Host "  - Version numbers are automatically incremented" -ForegroundColor White
Write-Host "  - A follow-up commit with [AUTO-CHANGELOG] will be created" -ForegroundColor White
Write-Host "" 
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  - Use 'feat:' prefix for new features (minor version bump)" -ForegroundColor White
Write-Host "  - Use 'fix:' prefix for bug fixes (patch version bump)" -ForegroundColor White
Write-Host "  - Use 'BREAKING:' for breaking changes (major version bump)" -ForegroundColor White
Write-Host "  - Commits with [AUTO-CHANGELOG] are automatically skipped" -ForegroundColor White
Write-Host "" 
Write-Host "Ready to go! Make your next commit to see it in action." -ForegroundColor Green