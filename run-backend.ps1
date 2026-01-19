#!/usr/bin/env pwsh
# Quick Backend Startup and Test
# Run this to verify the backend is working

Write-Host "`n🚀 Smart Waste Management - Backend Startup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

Write-Host "`n📦 Checking environment..." -ForegroundColor Yellow

# Check virtual environment
if (!(Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "✓ Environment ready" -ForegroundColor Green

Write-Host "`n🔧 Starting backend server on port 8080..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the server
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8080 --host 0.0.0.0
