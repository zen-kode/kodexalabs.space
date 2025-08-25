$errors = @()
$tokens = @()
$ast = [System.Management.Automation.Language.Parser]::ParseFile(
    'e:\sparks1111\scripts\setup-mcp-config.ps1',
    [ref]$tokens,
    [ref]$errors
)

if ($errors.Count -gt 0) {
    Write-Host "Syntax errors found:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "Line $($err.Extent.StartLineNumber): $($err.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "No syntax errors found!" -ForegroundColor Green
}