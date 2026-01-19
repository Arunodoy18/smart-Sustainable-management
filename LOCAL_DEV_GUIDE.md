# Smart Waste Management - Local Development Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for testing)

### 1. Start Backend (Port 8080)

```powershell
# Windows
.\start-backend-local.ps1

# Or manually:
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### 2. Start Frontend (Port 3000)

```powershell
# In a new terminal
cd frontend
npm install
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health

## 🔧 Configuration

### Backend (.env)
Located at `backend/.env`:

```env
# Server
PORT=8080

# Database - Choose one:
# PostgreSQL:
DATABASE_URL=postgresql://postgres:postgres@localhost/waste_management

# Or SQLite for testing:
# DATABASE_URL=sqlite:///./waste_management.db

# Security
SECRET_KEY=your-secret-key-min-32-chars

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# OpenAI (optional, for AI classification)
OPENAI_API_KEY=sk-your-key-here
```

### Frontend (.env.local)
Located at `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current user (requires token)

### Waste Classification
- `POST /api/v1/waste/classify` - Classify waste image
- `GET /api/v1/waste/history` - Get classification history

### Health
- `GET /health` - Simple health check
- `GET /ready` - Detailed readiness check

## 🔑 Test Accounts

After signup, you can create accounts with:
- Role: `user` or `driver`
- Email: any valid email format
- Password: minimum 6 characters

## 🐛 Troubleshooting

### Backend Won't Start
1. Check Python version: `python --version` (should be 3.11+)
2. Check port 8080 is available: `netstat -ano | findstr :8080`
3. Check database connection in backend logs
4. Verify `.env` file exists in `backend/` folder

### Frontend Won't Connect
1. Verify backend is running: http://localhost:8080/health
2. Check `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. Clear browser cache and restart `npm run dev`
4. Check browser console for CORS errors

### "Failed to fetch" Error
- Backend must be running on port 8080
- Check CORS settings in backend `.env`
- Verify frontend `.env.local` has correct API URL

## 📝 Development Notes

- Backend uses FastAPI with hot reload (changes auto-reload)
- Frontend uses Next.js with hot reload
- Auth uses JWT tokens stored in cookies
- Database: PostgreSQL recommended, SQLite works for testing
- File uploads stored in `backend/storage/`

## 🏗️ Architecture

```
Smart-waste-ai/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── api/routes/  # API endpoints
│   │   ├── core/        # Config, security
│   │   ├── models/      # Database models
│   │   └── main.py      # App entry point
│   └── .env             # Backend config
│
├── frontend/            # Next.js React frontend
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # React components
│   │   └── store/       # Zustand state
│   └── .env.local       # Frontend config
│
└── start-dev.ps1        # Quick start script
```

## 🎨 Features

- ✅ AI-powered waste classification
- ✅ User authentication (JWT)
- ✅ Role-based access (User/Driver)
- ✅ Real-time analytics
- ✅ Classification history
- ✅ Responsive dark theme UI
- ✅ RESTful API with OpenAPI docs

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- CORS protection
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy ORM

---

**Need help?** Check the logs in terminal windows or API docs at http://localhost:8080/docs
