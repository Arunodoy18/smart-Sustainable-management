# 🚀 IMPORTANT: Start Docker Desktop First!

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Smart Waste Management - Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker ps | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker Desktop is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop application" -ForegroundColor White
    Write-Host "2. Wait for it to fully start" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ Docker is running" -ForegroundColor Green

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes on first run (downloading images)" -ForegroundColor Gray
Write-Host ""

# Stop existing containers
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Services are starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Write-Host "(This takes about 30-60 seconds)" -ForegroundColor Gray
    
    # Wait for backend to be healthy
    $maxAttempts = 30
    $attempt = 0
    $backendReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $backendReady) {
        Start-Sleep -Seconds 2
        $attempt++
        Write-Host "." -NoNewline -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
            }
        } catch {
            # Still waiting
        }
    }
    
    Write-Host ""
    Write-Host ""
    
    if ($backendReady) {
        Write-Host "======================================" -ForegroundColor Green
        Write-Host "  🎉 SUCCESS! Everything is running!" -ForegroundColor Green
        Write-Host "======================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application:" -ForegroundColor Cyan
        Write-Host "  Frontend:      " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:3000" -ForegroundColor Yellow
        Write-Host "  API Docs:      " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:8000/docs" -ForegroundColor Yellow
        Write-Host "  Backend API:   " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:8000" -ForegroundColor Yellow
        Write-Host "  Database UI:   " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:8080" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Container Status:" -ForegroundColor Cyan
        docker-compose ps
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
        Write-Host "2. Upload a waste image" -ForegroundColor White
        Write-Host "3. See the AI classification!" -ForegroundColor White
        Write-Host ""
        Write-Host "To view logs:     docker-compose logs -f" -ForegroundColor Gray
        Write-Host "To stop services: docker-compose down" -ForegroundColor Gray
        Write-Host ""
        
        # Open browser automatically
        Write-Host "Opening frontend in your browser..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:3000"
        
    } else {
        Write-Host "⚠ Services started but backend not responding yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This might be normal if:" -ForegroundColor White
        Write-Host "- First time starting (still downloading/building)" -ForegroundColor Gray
        Write-Host "- Database is initializing" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check status:" -ForegroundColor Cyan
        docker-compose ps
        Write-Host ""
        Write-Host "View logs:" -ForegroundColor Cyan
        Write-Host "  docker-compose logs backend" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Try accessing in 1-2 minutes:" -ForegroundColor Cyan
        Write-Host "  http://localhost:3000" -ForegroundColor Yellow
    }
    
} else {
    Write-Host ""
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Docker Desktop not running" -ForegroundColor White
    Write-Host "2. Ports already in use (8000, 3000, 5432)" -ForegroundColor White
    Write-Host "3. Not enough disk space" -ForegroundColor White
    Write-Host ""
    Write-Host "View error logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try resetting:" -ForegroundColor Cyan
    Write-Host "  docker-compose down -v" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
