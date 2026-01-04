# 🚀 Complete Setup Instructions

## Prerequisites

Before starting, ensure you have:
- ✅ Docker Desktop installed and **RUNNING**
- ✅ Node.js 18+ (for local frontend development)
- ✅ Python 3.11+ (for local backend development)
- ✅ Git

## Setup Options

Choose your preferred setup method:

### 🐳 Option 1: Docker (Recommended - Production-Like)

#### Step 1: Start Docker Desktop
**IMPORTANT:** Open Docker Desktop and wait for it to fully start.

Check if Docker is running:
```powershell
docker ps
```

If you see an error, Docker Desktop isn't running. Start it first!

#### Step 2: Build and Run
```powershell
cd c:\dev\Hackathon
docker-compose up --build -d
```

#### Step 3: Wait for Services
```powershell
# Watch logs to see when everything is ready
docker-compose logs -f backend
```

Wait for: `Application startup complete`

#### Step 4: Access Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Backend: http://localhost:8000
- Database Admin: http://localhost:8080

#### Step 5: Test It
```powershell
# Test backend health
curl http://localhost:8000/api/v1/health

# Or use the test script
.\test-api.ps1
```

---

### 💻 Option 2: Local Development (No Docker)

Perfect if Docker Desktop isn't available or you want faster iteration.

#### Step 1: Setup Backend

```powershell
# Navigate to backend
cd c:\dev\Hackathon\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Install PostgreSQL locally or use SQLite
# For SQLite, update DATABASE_URL in .env:
# DATABASE_URL=sqlite:///./waste_management.db

# Run database migrations
# (We'll create alembic migrations)

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 2: Setup Frontend (New Terminal)

```powershell
# Navigate to frontend
cd c:\dev\Hackathon\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Step 3: Access Application
- Frontend: http://localhost:5173 (Vite dev server)
- API Docs: http://localhost:8000/docs
- Backend: http://localhost:8000

---

## 🧪 Testing Your Setup

### Quick Health Check
```powershell
# Test backend
curl http://localhost:8000/api/v1/health

# Or visit in browser:
# http://localhost:8000/docs
```

### Complete API Test
```powershell
.\test-api.ps1
```

### Manual Frontend Test
1. Open http://localhost:3000 (Docker) or http://localhost:5173 (local)
2. Upload a test image
3. Click "Classify Waste"
4. Verify results appear

---

## 🔧 Troubleshooting

### Problem: "Docker cannot find file"
**Solution:** Docker Desktop isn't running
```powershell
# Start Docker Desktop application
# Wait 30 seconds for it to fully start
# Then retry: docker-compose up -d
```

### Problem: "Port already in use"
**Solution:** Stop conflicting services
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Problem: Frontend shows "Cannot connect to API"
**Solution:** Check backend is running
```powershell
# Check backend logs
docker-compose logs backend

# Or restart backend
docker-compose restart backend
```

### Problem: Database connection error
**Solution:** Reset database
```powershell
# Stop everything
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Problem: "localhost refused to connect"
**Checklist:**
1. ✅ Docker Desktop is running? (`docker ps` should work)
2. ✅ Containers are running? (`docker-compose ps`)
3. ✅ Waited 30 seconds after starting? (startup takes time)
4. ✅ Correct URL? (http://localhost:3000, not :5173)

---

## 📊 Verify Everything Works

Run this complete verification:

```powershell
# 1. Check Docker
docker --version
docker ps

# 2. Check containers
docker-compose ps

# 3. Check backend health
curl http://localhost:8000/api/v1/health

# 4. Run API tests
.\test-api.ps1

# 5. Open frontend
start http://localhost:3000
```

---

## 🛑 Stopping Services

### Docker
```powershell
# Stop services (keep data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Local Development
```powershell
# Press Ctrl+C in each terminal window
# Backend: Ctrl+C
# Frontend: Ctrl+C
```

---

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Azure deployment
- AWS deployment
- GCP deployment
- Kubernetes deployment

---

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
ENVIRONMENT=production
SECRET_KEY=your-secret-key
LOG_LEVEL=INFO
```

### Frontend (environment variables)
Update [vite.config.js](frontend/vite.config.js):
```javascript
export default defineConfig({
  define: {
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:8000')
  }
})
```

---

## 🎯 Quick Reference

### Docker Commands
```powershell
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f backend    # View logs
docker-compose ps                 # Check status
docker-compose restart backend    # Restart service
docker-compose down -v            # Reset everything
```

### Development Commands
```powershell
# Backend
uvicorn app.main:app --reload

# Frontend
npm run dev

# Tests
pytest
npm test
```

---

## ✅ Success Checklist

- [ ] Docker Desktop is running
- [ ] `docker ps` works without error
- [ ] `docker-compose up -d` successful
- [ ] `docker-compose ps` shows all services running
- [ ] http://localhost:8000/docs loads
- [ ] http://localhost:3000 loads
- [ ] Can upload image and classify waste
- [ ] `.\test-api.ps1` passes all tests

---

## 🆘 Still Having Issues?

1. **Read error messages carefully** - They usually tell you exactly what's wrong
2. **Check Docker Desktop** - Make sure it's running (green icon in system tray)
3. **View logs** - `docker-compose logs backend` shows what's happening
4. **Start fresh** - `docker-compose down -v` then `docker-compose up -d`
5. **Check this file** - All common issues are documented here

---

## 🎉 You're Ready!

Once everything is running:
- Read [MVP_COMPLETE.md](MVP_COMPLETE.md) for demo preparation
- Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical details
- Practice your demo flow
- Check all features work

**Good luck! 🌟**
