# ✅ Complete Testing & Verification Guide

## Quick Health Check

Run this to verify everything works:

```powershell
# Check Docker (if using Docker)
docker ps

# Check backend health
curl http://localhost:8000/api/v1/health

# Or use the automated test
.\test-api.ps1
```

---

## Testing Scenarios

### 1. Basic Upload and Classification

**Test Case:** User uploads waste image

**Steps:**
1. Open http://localhost:3000
2. Click "Upload Image" button
3. Select any image file (or use camera)
4. Click "Classify Waste"
5. Wait for results (2-3 seconds)

**Expected Results:**
- ✓ Image preview appears
- ✓ Loading spinner shows
- ✓ Results display with:
  - Waste type (e.g., "Plastic Bottle")
  - Confidence score (e.g., 85%)
  - Recyclability status
  - Recommended actions
  - Environmental impact metrics

**Screenshot:** Show confidence badge color-coded

---

### 2. History Tracking

**Test Case:** View previous submissions

**Steps:**
1. Navigate to "History" page
2. View list of entries
3. Click on any entry for details

**Expected Results:**
- ✓ Table shows all submissions
- ✓ Columns: Image, Type, Confidence, Status, Date
- ✓ Detail modal opens with full information
- ✓ Collection status is visible

---

### 3. Analytics Dashboard

**Test Case:** View metrics and charts

**Steps:**
1. Navigate to "Analytics" page
2. Review metrics cards
3. Check pie chart (waste categories)
4. Check bar chart (collection status)

**Expected Results:**
- ✓ 4 metric cards show numbers
- ✓ Pie chart displays waste distribution
- ✓ Bar chart shows status breakdown
- ✓ SDG alignment section visible

---

### 4. Driver Collection

**Test Case:** Driver marks item as collected

**Steps:**
1. Navigate to "Driver" page
2. View pending pickups
3. Click "Mark Collected" on an item
4. Upload collection photo
5. Submit

**Expected Results:**
- ✓ Pending items list displays
- ✓ Modal opens for collection
- ✓ Can upload image
- ✓ Status updates to "Collected"
- ✓ Driver stats update

---

### 5. API Endpoint Testing

**Test Case:** All API endpoints respond correctly

Run the automated test:
```powershell
.\test-api.ps1
```

**Expected Results:**
```
Testing Backend Health...
✓ Health check passed

Testing Waste Classification...
✓ Classification successful
  Waste Type: Plastic Bottle
  Confidence: 85%
  Is Recyclable: Yes

Testing User Entries...
✓ Retrieved user entries
  Total Entries: 1

Testing Entry Detail...
✓ Entry detail retrieved

Testing Analytics...
✓ Analytics retrieved
  Total Waste: 1
  Recycling Rate: 100%

Testing Collection Update...
✓ Collection status updated

All tests passed! ✓
```

---

## Performance Testing

### Load Test

```powershell
# Install Apache Bench
# Windows: Download from Apache website

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:8000/api/v1/health
```

**Expected Results:**
- Requests per second: > 50
- Time per request: < 200ms
- No failed requests

---

## Security Testing

### 1. CORS Verification

```javascript
// Try cross-origin request from browser console
fetch('http://localhost:8000/api/v1/health', {
  method: 'GET',
  headers: {'Origin': 'http://evil-site.com'}
})
```

**Expected:** CORS error (blocked)

### 2. SQL Injection Test

```powershell
# Try malicious input
curl -X POST http://localhost:8000/api/v1/waste/classify `
  -H "Content-Type: application/json" `
  -d '{"image_url": "test.jpg'; DROP TABLE waste_entries;--"}'
```

**Expected:** Request handled safely, no database damage

### 3. File Upload Limits

Try uploading very large file (> 10MB)

**Expected:** Error message about file size

---

## Integration Testing

### Complete User Flow

**Scenario:** New user classifies waste, views history, sees analytics

```powershell
# 1. Classify waste
$classifyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/classify" `
  -Method POST -Body (@{image_url="test.jpg"; user_id=1} | ConvertTo-Json) `
  -ContentType "application/json"

# 2. Get history
$historyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/user/1/entries"

# 3. Get analytics
$analyticsResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/analytics?user_id=1"

Write-Host "✓ Complete flow successful"
```

---

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Test Features:**
- Image upload
- Camera capture
- Chart rendering
- Responsive design

---

## Mobile Responsiveness

Test on mobile devices or use browser dev tools:

```
1. Open Chrome DevTools (F12)
2. Click device toolbar icon
3. Select various devices:
   - iPhone 12 Pro
   - iPad
   - Samsung Galaxy S20
```

**Check:**
- [ ] Layout adapts to screen size
- [ ] Buttons are clickable
- [ ] Text is readable
- [ ] Camera works on mobile

---

## Database Testing

### Data Integrity

```sql
-- Connect to database (via Adminer at localhost:8080)
-- System: PostgreSQL
-- Server: postgres
-- Username: postgres
-- Password: postgres
-- Database: waste_management

-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check waste entries
SELECT * FROM waste_entries LIMIT 5;

-- Check users
SELECT * FROM users LIMIT 5;

-- Verify relationships
SELECT 
  we.id,
  we.waste_type,
  u.username as submitted_by,
  collector.username as collected_by
FROM waste_entries we
LEFT JOIN users u ON we.user_id = u.id
LEFT JOIN users collector ON we.collected_by = collector.id;
```

---

## Error Handling Testing

### 1. Network Failure

**Test:** Disconnect network and try classification

**Expected:** User-friendly error message, not crash

### 2. Invalid Data

```powershell
# Send invalid JSON
curl -X POST http://localhost:8000/api/v1/waste/classify `
  -H "Content-Type: application/json" `
  -d '{"invalid": "data"}'
```

**Expected:** 422 Validation Error with clear message

### 3. Missing Resource

```powershell
# Try to get non-existent entry
curl http://localhost:8000/api/v1/waste/entries/999999
```

**Expected:** 404 Not Found

---

## Docker-Specific Tests

### Container Health

```powershell
# Check all containers are healthy
docker-compose ps

# Expected output:
# waste-backend      running (healthy)
# waste-frontend     running
# waste-postgres     running (healthy)
# waste-adminer      running
```

### Container Logs

```powershell
# Check for errors in logs
docker-compose logs backend | Select-String "ERROR"
docker-compose logs frontend | Select-String "ERROR"
```

**Expected:** No critical errors

### Container Restart

```powershell
# Test automatic restart
docker-compose restart backend

# Wait 10 seconds
Start-Sleep -Seconds 10

# Check health
curl http://localhost:8000/api/v1/health
```

**Expected:** Service recovers automatically

---

## Local Development Tests

### Backend Standalone

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/docs
```

**Expected:** Swagger UI loads

### Frontend Standalone

```powershell
cd frontend
npm run dev

# Open http://localhost:5173
```

**Expected:** App loads with warning about backend

---

## Automated Test Suite

Create `run-all-tests.ps1`:

```powershell
Write-Host "🧪 Running Complete Test Suite" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health"
    Write-Host "   ✓ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend is not responding" -ForegroundColor Red
    exit 1
}

# 2. Classification Test
Write-Host "2. Waste Classification..." -ForegroundColor Yellow
$classifyData = @{
    image_url = "test_bottle.jpg"
    user_id = 1
} | ConvertTo-Json

try {
    $classify = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/classify" `
        -Method POST -Body $classifyData -ContentType "application/json"
    Write-Host "   ✓ Classification works" -ForegroundColor Green
    Write-Host "     Type: $($classify.data.classification.waste_type)" -ForegroundColor Gray
    Write-Host "     Confidence: $($classify.data.classification.confidence_score)%" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Classification failed" -ForegroundColor Red
}

# 3. History Test
Write-Host "3. User History..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/user/1/entries"
    Write-Host "   ✓ History retrieval works" -ForegroundColor Green
    Write-Host "     Total Entries: $($history.data.total)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ History failed" -ForegroundColor Red
}

# 4. Analytics Test
Write-Host "4. Analytics..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/analytics?user_id=1"
    Write-Host "   ✓ Analytics works" -ForegroundColor Green
    Write-Host "     Total Waste: $($analytics.data.total_waste_classified)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Analytics failed" -ForegroundColor Red
}

# 5. Frontend Check
Write-Host "5. Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Frontend not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test Suite Complete!" -ForegroundColor Green
```

---

## Production Readiness Checklist

Before deploying to production:

### Security
- [ ] Environment variables set
- [ ] SECRET_KEY is random and secure
- [ ] Database has strong password
- [ ] HTTPS/TLS configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### Performance
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Static files use CDN
- [ ] Compression enabled
- [ ] Load testing passed

### Reliability
- [ ] Health checks configured
- [ ] Auto-restart enabled
- [ ] Database backups automated
- [ ] Monitoring and alerts set up
- [ ] Logging configured

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Environment variables documented
- [ ] Troubleshooting guide created

---

## Common Issues and Solutions

### Issue: "Cannot connect to API"

**Solutions:**
1. Check backend is running: `curl http://localhost:8000/api/v1/health`
2. Check CORS settings in backend
3. Update frontend API URL in `vite.config.js`

### Issue: "Database connection failed"

**Solutions:**
1. Check PostgreSQL is running: `docker-compose ps`
2. Verify DATABASE_URL is correct
3. Check database logs: `docker-compose logs postgres`

### Issue: "Port already in use"

**Solutions:**
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Issue: "Docker build fails"

**Solutions:**
1. Check Dockerfile syntax
2. Verify all files exist
3. Clear Docker cache: `docker system prune -a`
4. Check disk space

---

## Metrics to Track

### Key Performance Indicators (KPIs)

1. **Classification Accuracy:** Confidence score distribution
2. **Response Time:** < 2 seconds for classification
3. **Uptime:** > 99.9%
4. **Error Rate:** < 0.1%
5. **User Engagement:** Daily active users

### Success Metrics

- Classification requests per day
- Recycling rate improvement
- Driver collection efficiency
- User retention rate

---

## Final Verification

Before demo/submission:

```powershell
# Run complete verification
.\run-all-tests.ps1

# Check all pages
start http://localhost:3000          # Home
start http://localhost:3000/history  # History
start http://localhost:3000/analytics # Analytics
start http://localhost:3000/driver   # Driver

# Verify API docs
start http://localhost:8000/docs

# Check database
start http://localhost:8080
```

**✅ If all tests pass, you're ready to demo!**

---

## Demo Script

### 5-Minute Demo Flow

**Minute 1: Problem**
- "60-80% of recyclables are contaminated"
- "Costs millions, harms environment"

**Minute 2: Solution**
- "AI-powered waste classification"
- "Confidence-aware recommendations"
- Show: Upload → Classify → Results

**Minute 3: Features**
- History tracking
- Analytics dashboard
- Driver accountability

**Minute 4: Technology**
- FastAPI + React
- PostgreSQL database
- Docker deployable
- Production-ready

**Minute 5: Impact**
- Environmental metrics
- SDG alignment
- Scalability

**Practice this until smooth!**

---

## Support Resources

- [START_HERE.md](START_HERE.md) - Quick start guide
- [MVP_COMPLETE.md](MVP_COMPLETE.md) - Complete feature guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical details
- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - Detailed setup
- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Cloud deployment

---

**You're all set for an amazing demo! 🚀**
