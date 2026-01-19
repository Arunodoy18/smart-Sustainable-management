# 🚀 LOCAL DEVELOPMENT - START HERE

## Quick 2-Step Startup

### 1️⃣ Start Backend (Terminal 1)
```powershell
.\run-backend.ps1
```
Wait for: `Application startup complete`

### 2️⃣ Start Frontend (Terminal 2)
```powershell
.\run-frontend.ps1
```
Wait for: `Ready in [time]`

### 3️⃣ Open Browser
http://localhost:3000

---

## 📍 URLs
- **App**: http://localhost:3000
- **API**: http://localhost:8080
- **Docs**: http://localhost:8080/docs

## ✅ Test It
1. Click "Sign Up"
2. Create account: `test@example.com` / `password123`
3. Should redirect to dashboard

## 🐛 Problems?
- Backend not running? Check `backend/.env` exists
- Frontend errors? Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8080`
- Port in use? Kill process or change port in `.env`

## 📝 Configuration

### backend/.env
```env
PORT=8080
DATABASE_URL=postgresql://postgres:postgres@localhost/waste_management
# Or use SQLite: DATABASE_URL=sqlite:///./waste_management.db
```

### frontend/.env.local  
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

✅ **All systems local. No Azure. No Docker required.**
