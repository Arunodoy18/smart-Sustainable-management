# ✅ Setup Checklist - Smart Waste Management

Use this checklist to verify your local development environment is properly configured.

---

## 📋 Prerequisites

### System Requirements
- [ ] Windows 10/11 (or Mac/Linux with modified scripts)
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### External Services
- [ ] [Supabase](https://supabase.com) account created
- [ ] [OpenAI](https://platform.openai.com) API key obtained
- [ ] [Google Maps](https://console.cloud.google.com) API key obtained

---

## 🔧 Backend Setup

### 1. Environment Configuration
```bash
cd backend
cp .env.example .env
```

- [ ] `.env` file created
- [ ] `DATABASE_URL` configured (PostgreSQL or Supabase)
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_ANON_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `OPENAI_API_KEY` added
- [ ] `SECRET_KEY` generated (use: `openssl rand -hex 32`)

### 2. Dependencies
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

- [ ] Virtual environment created
- [ ] Virtual environment activated
- [ ] Dependencies installed (no errors)

### 3. Database
- [ ] PostgreSQL running (or using Supabase)
- [ ] Database connection string correct
- [ ] Tables will auto-create on first run

### 4. Start Backend
```bash
uvicorn app.main:app --reload --port 8000
```

- [ ] Server starts without errors
- [ ] Visit http://localhost:8000/health → returns `{"status": "ok"}`
- [ ] Visit http://localhost:8000/docs → API docs load

---

## 🎨 Frontend Setup

### 1. Environment Configuration
```bash
cd frontend
cp .env.example .env.development
```

- [ ] `.env.development` file created
- [ ] `VITE_API_BASE_URL=http://localhost:8000/api/v1` (should be default)
- [ ] `VITE_SUPABASE_URL` added
- [ ] `VITE_SUPABASE_ANON_KEY` added
- [ ] `VITE_GOOGLE_MAPS_API_KEY` added

### 2. Dependencies
```bash
npm install
```

- [ ] Dependencies installed (no errors)
- [ ] `node_modules/` directory created

### 3. Start Frontend
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] Visit http://localhost:3000 → app loads
- [ ] Browser console shows: `🔗 API Base URL: http://localhost:8000/api/v1`
- [ ] No CORS errors in console

---

## 🧪 Functionality Tests

### Authentication
- [ ] Can access signup page
- [ ] Can create new account
- [ ] Can login with email/password
- [ ] Can login with Google OAuth
- [ ] JWT token stored in localStorage
- [ ] User redirected to dashboard after login

### Waste Classification
- [ ] Can upload waste image
- [ ] Image uploads successfully
- [ ] AI classification returns result
- [ ] Confidence score displayed
- [ ] Recommendation shown based on confidence
- [ ] Entry saved to history

### Driver Features (if using driver account)
- [ ] Can view pending pickups
- [ ] Can accept pickup
- [ ] Can upload collection proof
- [ ] Can mark as collected

### Analytics
- [ ] Dashboard loads
- [ ] Charts render properly
- [ ] Statistics displayed
- [ ] No console errors

---

## 🚨 Common Issues & Solutions

### Backend won't start

**Error**: `ModuleNotFoundError`
- [ ] Solution: Virtual environment not activated → Run `.\venv\Scripts\activate`

**Error**: `Database connection failed`
- [ ] Solution: Check `DATABASE_URL` in `.env`
- [ ] Verify PostgreSQL is running
- [ ] Check credentials are correct

**Error**: `Supabase error`
- [ ] Solution: Verify `SUPABASE_URL` and keys in `.env`
- [ ] Check Supabase project is active

### Frontend won't start

**Error**: `Cannot find module`
- [ ] Solution: Run `npm install` in frontend directory

**Error**: `Network Error` or `Cannot connect to backend`
- [ ] Backend not running → Start backend first
- [ ] Check backend is on port 8000
- [ ] Verify `VITE_API_BASE_URL` in `.env.development`

**Error**: `Supabase is not defined`
- [ ] Solution: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.development`

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`
- [ ] Backend CORS not configured → Should auto-allow localhost:3000
- [ ] Check `BACKEND_CORS_ORIGINS` in backend `.env` if needed
- [ ] Restart backend after env changes

### Authentication Issues

**Error**: `Invalid credentials` or `User not found`
- [ ] Database not initialized → Tables auto-create on first use
- [ ] Try creating new account
- [ ] Check Supabase dashboard for users

**Error**: `Google OAuth fails`
- [ ] Check Supabase → Authentication → Providers → Google is enabled
- [ ] Verify redirect URLs configured in Supabase
- [ ] Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## 📊 System Health Check

### Quick Verification Commands

```powershell
# Check Backend Health
curl http://localhost:8000/health

# Expected: {"status": "ok", "version": "..."}

# Check Frontend Build
cd frontend
npm run build

# Expected: Build completes successfully, creates dist/ folder
```

### Browser Console Checks

1. Open http://localhost:3000
2. Press F12 → Console tab
3. Look for:
   - [ ] `🔗 API Base URL: http://localhost:8000/api/v1`
   - [ ] No red error messages
   - [ ] No CORS errors
   - [ ] Supabase client initialized

---

## 🎯 Ready for Development!

When all checkboxes are ✅:
- Backend running on http://localhost:8000
- Frontend running on http://localhost:3000
- All API endpoints working
- Authentication working
- Waste classification working
- No console errors

---

## 🚢 Ready for Deployment?

Before deploying to Render + Netlify:
- [ ] All local features working
- [ ] Tests passing (run `pytest` in backend)
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] Read `DEPLOYMENT_GUIDE.md`

---

## 📞 Need Help?

1. Check browser console (F12) for detailed errors
2. Check backend terminal for error logs
3. Verify all environment variables are set
4. Review `LOCALHOST_GUIDE.md` for detailed setup
5. Check `REFACTORING_SUMMARY.md` for changes made

---

**Last Updated**: January 19, 2026
**Status**: Ready for Local Development ✅
