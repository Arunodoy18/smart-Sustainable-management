# 🚀 Start Backend Server
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ♻️  SMART WASTE AI - BACKEND" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "backend"
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "⚠️  Virtual environment not found. Running with global python..." -ForegroundColor Yellow
}

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
