# Smart Waste Management - Start Frontend
# Run this from the project root directory

Write-Host "🚀 Starting Smart Waste Management Frontend..." -ForegroundColor Green
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "Expected: c:\dev\Smart-waste-ai\" -ForegroundColor Yellow
    exit 1
}

# Navigate to frontend
Set-Location frontend

# Check if .env.development exists
if (-not (Test-Path ".env.development")) {
    Write-Host "⚠️  Warning: .env.development file not found" -ForegroundColor Yellow
    Write-Host "Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.development"
        Write-Host "✓ Created .env.development file - please configure it!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Edit frontend\.env.development with your credentials:" -ForegroundColor Cyan
        Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor White
        Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
        Write-Host "  - VITE_GOOGLE_MAPS_API_KEY" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter after configuring .env.development to continue"
    }
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚙️  Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 Frontend Starting!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:     http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure backend is running!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start development server
npm run dev
