# 🚀 Start Local Development Servers

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Starting Development Servers" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location "c:\dev\Hackathon\backend"
    & .\venv\Scripts\Activate.ps1
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

Write-Host "✓ Backend starting on http://localhost:8000" -ForegroundColor Green

# Wait a bit for backend
Start-Sleep -Seconds 3

# Function to start frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "c:\dev\Hackathon\web"
    npm run dev
}

Write-Host "✓ Frontend starting on http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Servers Running!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Yellow
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Gray
Write-Host ""

# Wait and show logs
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob, $frontendJob
    Remove-Job -Job $backendJob, $frontendJob
    Write-Host "✓ Servers stopped" -ForegroundColor Green
}
