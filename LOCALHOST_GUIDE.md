# 🚀 Smart Waste Management - Localhost Development

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use Supabase)
- OpenAI API Key
- Supabase Account
- Google Maps API Key

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL or Supabase)
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - SECRET_KEY (generate with: openssl rand -hex 32)

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.development

# Edit .env.development with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_GOOGLE_MAPS_API_KEY

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 📦 Features Working Locally

✅ User Signup/Login
✅ Google OAuth via Supabase
✅ Waste Classification (AI)
✅ Image Upload
✅ Driver Collection
✅ Analytics Dashboard
✅ Google Maps Integration

---

## 🔧 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check all required env vars are set

### Frontend can't connect
- Ensure backend is running on port 8000
- Check VITE_API_BASE_URL in .env.development
- Open browser console for detailed errors

### Auth not working
- Verify Supabase credentials
- Check Supabase dashboard for project status
- Ensure SUPABASE_URL and keys are correct

---

## 🚢 Deployment Ready

This codebase is configured for:

### Backend → Render
1. Connect your GitHub repo
2. Select "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `bash start.sh`
5. Add environment variables from backend/.env.example

### Frontend → Netlify
1. Connect your GitHub repo
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Add environment variables from frontend/.env.production
5. Set VITE_API_URL to your Render backend URL

---

## 📁 Project Structure

```
backend/
  app/
    main.py          # FastAPI application
    core/config.py   # Configuration
    api/routes/      # API endpoints
    agents/          # AI agents
  start.sh           # Production startup script
  requirements.txt   # Python dependencies

frontend/
  src/
    api.js           # API client
    supabase.js      # Supabase client
    pages/           # React pages
  vite.config.js     # Vite configuration
```

---

## 🔐 Security Notes

- Never commit .env files
- Use strong SECRET_KEY in production
- Keep API keys secure
- Use environment variables for all secrets

---

## 📞 Support

For issues or questions, check:
- Backend logs: Console output
- Frontend logs: Browser DevTools Console
- API Documentation: http://localhost:8000/docs
