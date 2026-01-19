# Quick Backend Test Script
Write-Host "🔍 Testing Backend API..." -ForegroundColor Cyan
Write-Host ""

# Test health endpoint
Write-Host "Testing /health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "✅ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test auth endpoints existence
Write-Host "Testing auth endpoints..." -ForegroundColor Yellow
try {
    # This will fail but shows the endpoint is reachable
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/me" -Method Get -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Auth endpoints are working (401 Unauthorized is expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Auth endpoint response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🌐 Open http://localhost:8080/docs to see all endpoints" -ForegroundColor Cyan
