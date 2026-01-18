# Smart Waste Management - Start Backend
# Run this from the project root directory

Write-Host "🚀 Starting Smart Waste Management Backend..." -ForegroundColor Green
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "backend\app\main.py")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "Expected: c:\dev\Smart-waste-ai\" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend
Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\activate.ps1")) {
    Write-Host "⚙️  Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "✓ Activating virtual environment..." -ForegroundColor Cyan
& "venv\Scripts\activate.ps1"

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file - please configure it!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Edit backend\.env with your credentials:" -ForegroundColor Cyan
        Write-Host "  - DATABASE_URL" -ForegroundColor White
        Write-Host "  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
        Write-Host "  - OPENAI_API_KEY" -ForegroundColor White
        Write-Host "  - SECRET_KEY (generate with: openssl rand -hex 32)" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter after configuring .env to continue"
    }
}

# Install dependencies if needed
Write-Host "✓ Checking dependencies..." -ForegroundColor Cyan
pip install -q -r requirements.txt

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 Backend Starting!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Backend:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Health:      http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start server
uvicorn app.main:app --reload --port 8000
