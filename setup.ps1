# 🚀 Quick Setup Script for Smart Waste Management AI

Write-Host "`n🌍 Smart Waste Management AI - Setup Script" -ForegroundColor Green
Write-Host "=============================================`n" -ForegroundColor Green

$ErrorActionPreference = "Stop"

# Check Docker
Write-Host "📦 Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
Write-Host "`n📦 Checking Docker Compose..." -ForegroundColor Cyan
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found." -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "`n⚙️  Checking environment configuration..." -ForegroundColor Cyan
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "   💡 Edit .env to add your API keys for production" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if containers are already running
Write-Host "`n🔍 Checking for existing containers..." -ForegroundColor Cyan
$runningContainers = docker-compose ps -q
if ($runningContainers) {
    Write-Host "⚠️  Containers already running. Stopping them first..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Stopped existing containers" -ForegroundColor Green
}

# Pull images (if needed)
Write-Host "`n📥 Pulling required Docker images..." -ForegroundColor Cyan
docker-compose pull

# Start services
Write-Host "`n🚀 Starting all services..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Yellow

docker-compose up -d

Write-Host "`n⏳ Waiting for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check service health
Write-Host "`n🏥 Checking service health..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$backendHealthy = $false

while ($attempt -lt $maxAttempts -and -not $backendHealthy) {
    $attempt++
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/health" -TimeoutSec 2
        if ($health.status -eq "healthy") {
            $backendHealthy = $true
            Write-Host "✅ Backend API is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   Attempt $attempt/$maxAttempts - waiting for backend..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendHealthy) {
    Write-Host "⚠️  Backend took longer than expected. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

# Display container status
Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n" -NoNewline
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "✨ Setup Complete! Your application is ready! ✨" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

Write-Host "`n🌐 Access Your Application:" -ForegroundColor Cyan
Write-Host "   Frontend:        " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "   Backend API:     " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8000/docs" -ForegroundColor Green
Write-Host "   Database Admin:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Green

Write-Host "`n📖 Quick Start:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in your browser"
Write-Host "   2. Click 'Upload Image' or 'Use Camera'"
Write-Host "   3. Select a waste image"
Write-Host "   4. Click 'Classify Waste' to see AI recommendations!"

Write-Host "`n🧪 Test the API:" -ForegroundColor Cyan
Write-Host "   Run: .\test-api.ps1"

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   README.md       - Project overview"
Write-Host "   QUICKSTART.md   - Quick start guide"
Write-Host "   DEPLOYMENT.md   - Production deployment"

Write-Host "`n🛑 To Stop Services:" -ForegroundColor Cyan
Write-Host "   docker-compose down"

Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:       docker-compose logs -f"
Write-Host "   Restart:         docker-compose restart"
Write-Host "   Status:          docker-compose ps"
Write-Host "   Shell access:    docker exec -it waste-management-backend /bin/bash"

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Demo mode works without API keys"
Write-Host "   • Add OpenAI API key to .env for real AI classification"
Write-Host "   • Check logs if something doesn't work: docker-compose logs"

Write-Host "`n🎉 Happy Hacking! 🌍♻️`n" -ForegroundColor Green
