# 🚀 Quick Start Guide

Get your Smart Waste Management AI system running in **5 minutes**!

## Prerequisites

- **Docker Desktop** installed ([Download](https://www.docker.com/products/docker-desktop))
- **Git** installed
- **8GB RAM** minimum
- **Ports available**: 3000, 8000, 5432, 8080

---

## Step 1: Clone & Setup

```powershell
# Clone repository
git clone <your-repo-url>
cd Hackathon

# Copy environment file
copy .env.example .env
```

---

## Step 2: Launch Services

```powershell
# Start all containers
docker-compose up -d

# Wait ~30 seconds for services to initialize
```

---

## Step 3: Verify Deployment

```powershell
# Check container status
docker-compose ps

# You should see:
# - waste-management-frontend (port 3000)
# - waste-management-backend (port 8000)
# - waste-management-db (port 5432)
# - waste-management-adminer (port 8080)
```

---

## Step 4: Access Application

Open your browser:

### 🎨 Frontend Application
**http://localhost:3000**

Features:
- Upload waste images
- View classification results
- Check history
- See analytics dashboard
- Driver collection portal

### 📚 API Documentation
**http://localhost:8000/docs**

Interactive Swagger UI to test all endpoints

### 🗄️ Database Admin
**http://localhost:8080**

Connection details:
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: waste_management

---

## Step 5: Test the System

### Option A: Use the Frontend

1. Go to **http://localhost:3000**
2. Click "Upload Image" or "Use Camera"
3. Select/capture a waste image
4. Click "Classify Waste"
5. View results with recommendations!

### Option B: Test API with PowerShell

```powershell
# Run test script
.\test-api.ps1
```

### Option C: Manual API Test

```powershell
# Classify waste
$body = @{
    user_id = 1
    image_url = "https://example.com/waste.jpg"
    location = @{ lat = 0; lng = 0 }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/waste/classify" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 📊 What You'll See

### Classification Response Example:

```json
{
  "success": true,
  "data": {
    "waste_entry": {
      "id": 1,
      "waste_type": "plastic",
      "confidence": 0.92,
      "is_recyclable": true,
      "risk_level": "medium"
    },
    "recommendation": {
      "action": "Recycle",
      "instructions": [
        "Rinse the plastic container",
        "Remove labels if possible",
        "Place in dry recyclable bin"
      ],
      "impact": "Reduces landfill plastic by 80%, saves 5.7 kWh energy/kg",
      "confidence_message": "High confidence (92%) - Proceed with recommended action"
    }
  }
}
```

---

## 🎯 Demo Scenarios

### Scenario 1: High Confidence Plastic
- Upload plastic bottle image
- Expect: Clear recycling instructions
- Confidence: >80%

### Scenario 2: E-Waste Detection
- Upload electronics image
- Expect: Special disposal instructions
- Risk Level: High

### Scenario 3: Driver Collection
1. Go to Driver Portal
2. View pending pickups
3. Click "Collect"
4. Upload proof photo
5. Confirm collection

---

## 🛑 Stop Services

```powershell
# Stop all containers
docker-compose down

# Stop and remove all data (reset)
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Problem: Port already in use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <process_id> /F
```

### Problem: Database connection failed

```powershell
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Problem: Frontend not loading

```powershell
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Problem: Backend errors

```powershell
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

---

## 📖 Next Steps

1. **Explore Features**:
   - Try different waste types
   - Check analytics dashboard
   - Test driver portal

2. **Read Documentation**:
   - [README.md](README.md) - Full system overview
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
   - API Docs: http://localhost:8000/docs

3. **Customize**:
   - Add your OpenAI API key for real AI classification
   - Configure cloud storage for images
   - Set up authentication

4. **Deploy**:
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md) for cloud deployment
   - Use provided Kubernetes configs
   - Set up CI/CD pipeline

---

## 💡 Tips

- **Demo Mode**: System works with mock classification (no API key needed)
- **Production**: Add real OpenAI API key to `.env` file
- **Performance**: Backend auto-scales with Docker Compose
- **Database**: Data persists in Docker volumes

---

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- Restart everything: `docker-compose restart`
- Reset database: `docker-compose down -v && docker-compose up -d`
- Review: [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎉 Success!

You now have a fully functional AI-powered waste management system!

**What's working:**
- ✅ Frontend UI with image upload
- ✅ Backend API with intelligent agents
- ✅ PostgreSQL database
- ✅ Real-time analytics
- ✅ Driver collection verification

**Judge-ready features:**
- ✅ Confidence-aware recommendations
- ✅ Safety-first design (low confidence → manual review)
- ✅ Accountability trail (driver verification)
- ✅ Environmental impact tracking
- ✅ SDG alignment

---

**🌍 Built for a sustainable future! ♻️**
