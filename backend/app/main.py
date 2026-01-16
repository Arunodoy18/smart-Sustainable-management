from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import waste, auth
from app.core.config import settings
from app.core.logger import setup_logger
from contextlib import asynccontextmanager

setup_logger()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    env = os.getenv("ENVIRONMENT", "development")

    logger.info("=" * 50)
    logger.info("Smart Waste Management API - Starting")
    logger.info("=" * 50)
    logger.info(f"Environment: {env}")
    logger.info(f"API Docs: /docs")
    logger.info(f"Health Check: /health")

    # Only show detailed info in development
    if env == "development":
        logger.info(f"Storage Path: {os.path.abspath(settings.STORAGE_PATH)}")
        db_host = (
            settings.database_url.split("@")[-1]
            if "@" in settings.database_url
            else "local"
        )
        logger.info(f"Database: {db_host}")

    logger.info("=" * 50)

    from app.db.init_db import init_db

    init_db()

    logger.info("Database initialized successfully")
    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="AI-powered waste management system with confidence-aware recommendations",
    version="1.0.0",
    lifespan=lifespan,
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
            "Real-time analytics",
        ],
    }


# Health check endpoints - MUST be defined before any router includes
# to ensure they're accessible at the root level
@app.get("/health", tags=["health"])
async def health_check_root():
    """
    Root-level health check endpoint.

    Returns 200 OK immediately without any dependencies.
    Used by: Azure Container Apps probes, CI/CD verification, load balancers.
    """
    return {"status": "ok"}


@app.get("/healthz", tags=["health"])
async def health_check_k8s():
    """Kubernetes-style health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health", tags=["health"])
async def health_check_api():
    """Health check at /api path for reverse proxy configurations."""
    return {"status": "ok"}


@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
async def health_check():
    """Health check endpoint for container orchestration and load balancers."""
    return {
        "status": "healthy",
        "service": "waste-management-api",
        "version": "1.0.0",
    }
