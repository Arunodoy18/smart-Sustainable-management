# Smart Waste Management - Quick Start
# Starts both backend and frontend in separate terminals

Write-Host ""
Write-Host "🌍 Smart Waste Management - Quick Start" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "backend\app\main.py") -or -not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "Expected: c:\dev\Smart-waste-ai\" -ForegroundColor Yellow
    exit 1
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Install Python 3.11+ from python.org" -ForegroundColor Red
    exit 1
}

# Check Node
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start backend in new terminal
Write-Host "🔧 Starting Backend (port 8000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-File", "start-backend-local.ps1"

Start-Sleep -Seconds 3

# Start frontend in new terminal
Write-Host "🎨 Starting Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-File", "start-frontend-local.ps1"

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ Services Starting!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Backend:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Check the new terminal windows for logs" -ForegroundColor Yellow
Write-Host "⏱️  Wait ~10 seconds for services to be ready" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
