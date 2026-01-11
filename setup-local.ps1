# 🚀 Local Development Setup (No Docker Required)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Local Development Setup" -ForegroundColor Green
Write-Host "  (No Docker Required)" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from python.org" -ForegroundColor Yellow
    exit 1
}

# Check Node
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Step 1: Backend Setup" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Push-Location backend

Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  Virtual environment already exists" -ForegroundColor Gray
} else {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
pip install --quiet --disable-pip-version-check -r requirements.txt
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Create SQLite env file
Write-Host "Configuring database (SQLite)..." -ForegroundColor Yellow
$envContent = @"
DATABASE_URL=sqlite:///./waste_management.db
ENVIRONMENT=development
LOG_LEVEL=INFO
SECRET_KEY=dev-secret-key-change-in-production
API_V1_PREFIX=/api/v1
PROJECT_NAME=Smart Waste Management System
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]
"@
Set-Content -Path ".env" -Value $envContent
Write-Host "✓ Database configured" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Step 2: Frontend Setup" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Frontend Setup
Push-Location frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install --silent
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  🎉 Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Write-Host "To start development:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  uvicorn app.main:app --reload" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the start script:" -ForegroundColor Cyan
Write-Host "  .\start-local.ps1" -ForegroundColor Yellow
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
