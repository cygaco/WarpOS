# WarpOS Installer for Windows
# Run: powershell -ExecutionPolicy Bypass -File install.ps1 <target-project-path>
#
# Or from your project directory:
# powershell -ExecutionPolicy Bypass -File ..\WarpOS\install.ps1 .

param(
    [string]$TargetPath = "."
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  WarpOS Installer" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    if ($nodeVersion) {
        $major = [int]($nodeVersion -replace '^v(\d+).*', '$1')
        if ($major -ge 18) {
            Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Node.js $nodeVersion — need 18 or newer" -ForegroundColor Red
            Write-Host "    Download from https://nodejs.org" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    Write-Host "    Download from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check Git
try {
    $gitVersion = & git --version 2>$null
    if ($gitVersion) {
        Write-Host "  ✓ Git installed" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Git not found" -ForegroundColor Red
    Write-Host "    Download from https://git-scm.com" -ForegroundColor Yellow
    exit 1
}

# Resolve paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WarpOSDir = $ScriptDir
$TargetDir = Resolve-Path $TargetPath -ErrorAction SilentlyContinue

if (-not $TargetDir) {
    $TargetDir = $TargetPath
}

Write-Host ""
Write-Host "  Installing WarpOS into: $TargetDir" -ForegroundColor Cyan
Write-Host ""

# Run the Node.js installer
& node "$WarpOSDir\scripts\warp-setup.js" "$TargetDir"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  WarpOS installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Open Claude Code in your project and type /warp:tour" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "  Installation failed. Check the errors above." -ForegroundColor Red
    exit 1
}
