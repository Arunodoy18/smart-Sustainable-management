#!/usr/bin/env pwsh
# Quick Frontend Startup
# Run this after backend is running

Write-Host "`n🌐 Smart Waste Management - Frontend Startup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

Write-Host "`n📦 Checking environment..." -ForegroundColor Yellow

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  Creating .env.local file..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_URL=http://localhost:8080
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "✓ Created .env.local" -ForegroundColor Green
}

Write-Host "✓ Environment ready" -ForegroundColor Green

Write-Host "`n🎨 Starting frontend on port 3000..." -ForegroundColor Yellow
Write-Host "   Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the dev server
npm run dev
