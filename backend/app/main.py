from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import waste, auth
from app.core.config import settings
from app.core.logger import setup_logger
from contextlib import asynccontextmanager

setup_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    banner = """
    ┌────────────────────────────────────────────────────────┐
    │  ♻️  SMART WASTE MANAGEMENT AI - BACKEND SYSTEM       │
    │  🚀 Status: RUNNING (Local Development)               │
    └────────────────────────────────────────────────────────┘
    """
    print("\n" + banner)
    print(f"🔗 API Documentation: http://localhost:8000/docs")
    print(f"📊 Health Check:      http://localhost:8000/api/v1/auth/me")
    print(f"📂 Storage Path:      {os.path.abspath(settings.STORAGE_PATH)}")
    print(f"🔧 Database URL:      {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'SQLite/Local'}")
    print(f"🌐 Environment:       {os.getenv('ENVIRONMENT', 'development')}")
    print("\n" + "—" * 60 + "\n")
    
    from app.db.init_db import init_db
    init_db()
    yield
    # Shutdown: cleanup if needed
    print("\n🛑 SHUTTING DOWN BACKEND...\n")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="AI-powered waste management system with confidence-aware recommendations",
    version="1.0.0",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage for uploaded images
if not os.path.exists(settings.STORAGE_PATH):
    os.makedirs(settings.STORAGE_PATH)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_PATH), name="storage")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(waste.router, prefix=f"{settings.API_V1_STR}/waste", tags=["waste"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart Waste Management AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "AI-powered waste classification",
            "Confidence-aware recommendations",
            "Driver collection verification",
            "Real-time analytics"
        ]
    }
