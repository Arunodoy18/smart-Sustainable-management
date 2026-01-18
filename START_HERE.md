# 🌍 Smart Waste Management - START HERE

> **Welcome!** This project has been refactored for **localhost-first development** and is ready for **Render + Netlify deployment**.

---

## 🚀 Quick Start (2 minutes)

### Option 1: Automatic Setup (Recommended)

```powershell
# From project root
.\start-dev.ps1
```

This will:
- Check prerequisites
- Start backend (port 8000)
- Start frontend (port 3000)
- Open two terminal windows

### Option 2: Manual Setup

```powershell
# Terminal 1: Backend
.\start-backend-local.ps1

# Terminal 2: Frontend  
.\start-frontend-local.ps1
```

---

## 📚 Documentation Structure

| File | When to Use |
|------|-------------|
| **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** | ✅ **First time setup** - Step-by-step checklist |
| **[LOCALHOST_GUIDE.md](LOCALHOST_GUIDE.md)** | 🔧 **Development guide** - Complete local setup |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 🚢 **Deploy to production** - Render + Netlify |
| **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)** | 📋 **What changed** - Complete refactoring report |
| **[TESTING_GUIDE.md](TESTING_GUIDE.md)** | 🧪 **Run tests** - Test your changes |
| **[README.md](README.md)** | 📖 **Project overview** - Features & architecture |

---

## 🎯 I Want To...

### 🆕 Set Up for the First Time
1. Read **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)**
2. Configure `.env` files (backend & frontend)
3. Run `.\start-dev.ps1`
4. Visit http://localhost:3000

### 💻 Develop Locally
1. Ensure environment files are configured
2. Run `.\start-dev.ps1`
3. Backend: http://localhost:8000
4. Frontend: http://localhost:3000
5. API Docs: http://localhost:8000/docs

### 🚢 Deploy to Production
1. Ensure local development works
2. Read **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**
3. Deploy backend to Render
4. Deploy frontend to Netlify
5. Configure environment variables

### 📋 Understand What Changed
- Read **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)**
- All Azure references removed
- Localhost-first architecture
- Deployment-ready configuration

### 🧪 Run Tests
```powershell
cd backend
pytest
```

### 🐛 Troubleshoot Issues
1. Check **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** → Common Issues section
2. Check browser console (F12)
3. Check backend terminal logs
4. Verify environment variables

---

## ⚡ Prerequisites

Before starting, you need:

- ✅ Python 3.11+
- ✅ Node.js 18+
- ✅ PostgreSQL (or Supabase)
- ✅ OpenAI API Key
- ✅ Supabase Account
- ✅ Google Maps API Key

---

## 🔑 Configuration Required

### Backend (`backend/.env`)
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
SECRET_KEY=... # Generate with: openssl rand -hex 32
```

### Frontend (`frontend/.env.development`)
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_MAPS_API_KEY=...
```

---

## 🎉 Success Indicators

Your setup is working when:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ http://localhost:8000/health returns `{"status": "ok"}`
- ✅ http://localhost:8000/docs shows API documentation
- ✅ Can create account and login
- ✅ Can upload and classify waste images
- ✅ No CORS errors in browser console

---

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend** | ✅ Ready | FastAPI on port 8000 |
| **Frontend** | ✅ Ready | React on port 3000 |
| **Database** | ✅ Ready | PostgreSQL/Supabase |
| **Auth** | ✅ Ready | Supabase + Google OAuth |
| **AI** | ✅ Ready | GPT-4o Vision |
| **Maps** | ✅ Ready | Google Maps API |
| **Deployment** | ✅ Ready | Render + Netlify |

---

## 🔄 What Was Refactored?

This project was cleaned up from Azure-based deployment to:
- ✅ **Localhost-first** architecture
- ✅ **Removed all Azure** references and scripts
- ✅ **Fixed API URLs** to use localhost:8000
- ✅ **Updated CORS** for local development
- ✅ **Created environment templates** for easy setup
- ✅ **Deployment-ready** for Render (backend) + Netlify (frontend)

See **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)** for complete details.

---

## 🚨 Common Issues

### "Backend won't start"
→ Check `backend/.env` is configured
→ Verify Python 3.11+ installed
→ Activate virtual environment

### "Frontend can't connect"
→ Ensure backend is running on 8000
→ Check `frontend/.env.development` has correct URL
→ Look for CORS errors in browser console

### "Auth not working"
→ Verify Supabase credentials
→ Check Supabase dashboard is active
→ Ensure Google OAuth enabled in Supabase

---

## 📞 Get Help

1. **Setup Issues** → [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
2. **Development Help** → [LOCALHOST_GUIDE.md](LOCALHOST_GUIDE.md)
3. **Deployment Help** → [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. **Technical Details** → [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)

---

## 🎯 Next Steps

1. ✅ Read **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)**
2. ⚙️ Configure environment files
3. 🚀 Run `.\start-dev.ps1`
4. 🎉 Start developing!

---

**Ready to begin?** → Open **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** and follow the checklist!

---

**Last Updated**: January 19, 2026  
**Status**: 🟢 Refactored & Ready for Development
