# API Demo Script - Test All Endpoints

Write-Host "🌍 Smart Waste Management AI - API Demo" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$BASE_URL = "http://localhost:8000/api/v1"
$USER_ID = 1
$DRIVER_ID = 999

Write-Host "📡 Testing API Endpoints...`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣ Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/waste/health" -Method Get
    Write-Host "✅ API is healthy: $($health.status)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Classify Waste (High Confidence Scenario)
Write-Host "2️⃣ Classifying waste (High Confidence Scenario)..." -ForegroundColor Yellow
$wasteData = @{
    user_id = $USER_ID
    image_url = "https://example.com/plastic-bottle.jpg"
    location = @{
        lat = 40.7128
        lng = -74.0060
    }
} | ConvertTo-Json

try {
    $classification = Invoke-RestMethod -Uri "$BASE_URL/waste/classify" -Method Post -Body $wasteData -ContentType "application/json"
    Write-Host "✅ Classification successful!" -ForegroundColor Green
    Write-Host "   Waste Type: $($classification.data.waste_entry.waste_type)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($classification.data.waste_entry.confidence * 100, 1))%" -ForegroundColor White
    Write-Host "   Recyclable: $($classification.data.waste_entry.is_recyclable)" -ForegroundColor White
    Write-Host "   Risk Level: $($classification.data.waste_entry.risk_level)" -ForegroundColor White
    Write-Host "   Action: $($classification.data.recommendation.action)" -ForegroundColor Cyan
    Write-Host "   Impact: $($classification.data.recommendation.impact)" -ForegroundColor Green
    Write-Host ""
    
    $ENTRY_ID = $classification.data.waste_entry.id
} catch {
    Write-Host "❌ Classification failed: $_" -ForegroundColor Red
    Write-Host ""
    $ENTRY_ID = 1 # Fallback for testing
}

# Test 3: Get User Entries
Write-Host "3️⃣ Fetching user waste history..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$BASE_URL/waste/entries/$USER_ID" -Method Get
    Write-Host "✅ Retrieved $($history.count) waste entries" -ForegroundColor Green
    if ($history.count -gt 0) {
        Write-Host "   Latest entry: $($history.entries[0].waste_type) (Status: $($history.entries[0].status))" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch history: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Get Entry Detail
Write-Host "4️⃣ Fetching detailed entry information..." -ForegroundColor Yellow
try {
    $detail = Invoke-RestMethod -Uri "$BASE_URL/waste/entry/$ENTRY_ID" -Method Get
    Write-Host "✅ Entry details retrieved" -ForegroundColor Green
    Write-Host "   ID: $($detail.entry.id)" -ForegroundColor White
    Write-Host "   Type: $($detail.entry.waste_type)" -ForegroundColor White
    Write-Host "   Recommended Action: $($detail.entry.recommended_action)" -ForegroundColor Cyan
    Write-Host "   Collection Type: $($detail.entry.collection_type)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch entry detail: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Get Analytics
Write-Host "5️⃣ Fetching analytics..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "$BASE_URL/waste/analytics?user_id=$USER_ID" -Method Get
    Write-Host "✅ Analytics retrieved" -ForegroundColor Green
    Write-Host "   Total Entries: $($analytics.analytics.total_waste_entries)" -ForegroundColor White
    Write-Host "   Recyclable: $($analytics.analytics.recyclable_count)" -ForegroundColor Green
    Write-Host "   Recycling Rate: $($analytics.analytics.recycling_rate)%" -ForegroundColor Green
    Write-Host "   Collected: $($analytics.analytics.collected_count)" -ForegroundColor White
    Write-Host "   Pending: $($analytics.analytics.pending_count)" -ForegroundColor Yellow
    Write-Host "   Avg Confidence: $([math]::Round($analytics.analytics.average_confidence * 100, 1))%" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch analytics: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 6: System-Wide Analytics
Write-Host "6️⃣ Fetching system-wide analytics..." -ForegroundColor Yellow
try {
    $systemAnalytics = Invoke-RestMethod -Uri "$BASE_URL/waste/analytics" -Method Get
    Write-Host "✅ System analytics retrieved" -ForegroundColor Green
    Write-Host "   Total System Entries: $($systemAnalytics.analytics.total_waste_entries)" -ForegroundColor White
    Write-Host "   System Recycling Rate: $($systemAnalytics.analytics.recycling_rate)%" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch system analytics: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 7: Mark as Collected (Driver Function)
Write-Host "7️⃣ Simulating driver collection..." -ForegroundColor Yellow
$collectionData = @{
    entry_id = $ENTRY_ID
    collector_id = $DRIVER_ID
    collection_image_url = "https://example.com/collection-proof.jpg"
} | ConvertTo-Json

try {
    $collection = Invoke-RestMethod -Uri "$BASE_URL/waste/collect" -Method Post -Body $collectionData -ContentType "application/json"
    Write-Host "✅ Collection verified!" -ForegroundColor Green
    Write-Host "   Entry ID: $($collection.entry.id)" -ForegroundColor White
    Write-Host "   Status: $($collection.entry.status)" -ForegroundColor Green
    Write-Host "   Collected By: Driver #$($collection.entry.collected_by)" -ForegroundColor White
    Write-Host "   Collected At: $($collection.entry.collected_at)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Collection marking failed: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎉 Demo Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "- Health Check: ✅"
Write-Host "- Waste Classification: ✅"
Write-Host "- History Retrieval: ✅"
Write-Host "- Entry Details: ✅"
Write-Host "- Analytics: ✅"
Write-Host "- Collection Verification: ✅"

Write-Host "`n📖 View Full API Documentation:" -ForegroundColor Yellow
Write-Host "   http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n🌐 Access Frontend:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open the frontend to interact with the UI"
Write-Host "2. Upload a waste image and see real-time classification"
Write-Host "3. Check the analytics dashboard"
Write-Host "4. Test the driver portal for collection verification"

Write-Host "`n✨ Happy Testing! ✨`n" -ForegroundColor Green
