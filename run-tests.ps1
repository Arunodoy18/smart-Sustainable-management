# 🧪 Smart Waste Management - API Test Suite

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  API Test Suite" -ForegroundColor Green
Write-Host "======================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "Test 1: Backend Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/docs" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "✓ Backend is accessible!" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Classify Waste
Write-Host "`nTest 2: Waste Classification..." -ForegroundColor Yellow
try {
    $classifyData = @{
        image_url = "test_bottle.jpg"
        user_id = 1
    } | ConvertTo-Json

    $classify = Invoke-RestMethod -Uri "$baseUrl/api/v1/waste/classify" `
        -Method POST `
        -Body $classifyData `
        -ContentType "application/json" `
        -TimeoutSec 10

    if ($classify.success -eq $true) {
        Write-Host "✓ Classification successful!" -ForegroundColor Green
        Write-Host "  Waste Type: $($classify.data.classification.waste_type)" -ForegroundColor Gray
        Write-Host "  Confidence: $($classify.data.classification.confidence_score)%" -ForegroundColor Gray
        Write-Host "  Recyclable: $($classify.data.segregation.is_recyclable)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "✗ Classification returned success=false" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Classification failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Get User Entries
Write-Host "`nTest 3: Get User History..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/api/v1/waste/user/1/entries?page=1&page_size=10" `
        -Method GET `
        -TimeoutSec 10

    if ($history.success -eq $true) {
        Write-Host "✓ History retrieved successfully!" -ForegroundColor Green
        Write-Host "  Total Entries: $($history.data.total)" -ForegroundColor Gray
        Write-Host "  Current Page: $($history.data.page)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "✗ History returned success=false" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ History retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Get Analytics
Write-Host "`nTest 4: Get Analytics..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "$baseUrl/api/v1/waste/analytics?user_id=1" `
        -Method GET `
        -TimeoutSec 10

    if ($analytics.success -eq $true) {
        Write-Host "✓ Analytics retrieved successfully!" -ForegroundColor Green
        Write-Host "  Total Waste Classified: $($analytics.data.total_waste_classified)" -ForegroundColor Gray
        Write-Host "  Recycling Rate: $($analytics.data.recycling_rate)%" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "✗ Analytics returned success=false" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Analytics retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Frontend Accessibility
Write-Host "`nTest 5: Frontend Accessibility..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($frontend.StatusCode -eq 200) {
        Write-Host "✓ Frontend is accessible!" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ Frontend returned status: $($frontend.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Database UI
Write-Host "`nTest 6: Database UI Accessibility..." -ForegroundColor Yellow
try {
    $dbui = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 10
    if ($dbui.StatusCode -eq 200) {
        Write-Host "✓ Database UI is accessible!" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ Database UI returned status: $($dbui.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Database UI not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Green
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Tests Passed: " -NoNewline -ForegroundColor White
Write-Host "$testsPassed" -ForegroundColor Green

if ($testsFailed -gt 0) {
    Write-Host "Tests Failed: " -NoNewline -ForegroundColor White
    Write-Host "$testsFailed" -ForegroundColor Red
} else {
    Write-Host "Tests Failed: " -NoNewline -ForegroundColor White
    Write-Host "0" -ForegroundColor Green
}

Write-Host "`nTotal Tests: $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 All tests passed! Your MVP is working perfectly!`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Check the error messages above.`n" -ForegroundColor Yellow
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Test the UI by uploading waste images" -ForegroundColor White
Write-Host "  3. Check all pages: Home, History, Analytics, Driver" -ForegroundColor White
Write-Host ""
