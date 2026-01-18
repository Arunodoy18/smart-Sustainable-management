from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# =============================================================================
# CRITICAL: Health check must be available IMMEDIATELY on startup
# Do NOT import anything that could fail (DB, external services) at module level
# =============================================================================

# Basic logger setup that cannot fail
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Track application readiness state
APP_STATE = {"db_initialized": False, "startup_complete": False, "startup_errors": []}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - DB failures are logged but don't prevent startup."""
    env = os.getenv("ENVIRONMENT", "development")

    logger.info("=" * 50)
    logger.info("Smart Waste Management API - Starting")
    logger.info("=" * 50)
    logger.info(f"Environment: {env}")
    logger.info(f"Health Check: /health")
    logger.info(f"API Docs: /docs")
    logger.info("=" * 50)

    # Initialize database - MUST NOT block application startup
    # Health checks must work even if DB is unavailable
    try:
        from app.db.init_db import init_db

        init_db()
        APP_STATE["db_initialized"] = True
        logger.info("✓ Database initialized successfully")
    except Exception as e:
        error_msg = f"Database initialization failed: {str(e)}"
        APP_STATE["startup_errors"].append(error_msg)
        logger.error(f"✗ {error_msg}")
        logger.warning(
            "Application starting without database - some features unavailable"
        )

    APP_STATE["startup_complete"] = True
    logger.info("=" * 50)
    logger.info("Application startup complete - ready to serve requests")
    logger.info("=" * 50)

    yield

    # Shutdown
    logger.info("Shutting down...")


# =============================================================================
# Create FastAPI application
# Import settings AFTER app creation to allow health endpoints to work
# even if settings validation has warnings
# =============================================================================


# Lazy import settings to avoid blocking health check
def get_settings():
    """Lazy load settings to prevent import-time failures."""
    from app.core.config import settings

    return settings


app = FastAPI(
    title="Smart Waste Management AI",
    openapi_url="/api/v1/openapi.json",
    description="AI-powered waste management system with confidence-aware recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

# =============================================================================
# CRITICAL: Health check endpoints MUST be registered FIRST
# These must work without ANY external dependencies (DB, config, etc.)
# =============================================================================

# Build version - updated on each deployment
BUILD_VERSION = "2026.01.17.1"


@app.get("/health", tags=["health"])
async def health_check_root():
    """
    Root-level health check endpoint.

    Returns 200 OK immediately without any dependencies.
    Used by: Health monitoring, CI/CD verification, load balancers, Render.

    This endpoint MUST:
    - Return 200 OK immediately
    - Not require authentication
    - Not depend on database
    - Not depend on external services
    - Work even if other initialization fails
    """
    return {"status": "ok", "version": BUILD_VERSION}


@app.get("/healthz", tags=["health"])
async def health_check_k8s():
    """Kubernetes-style health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health", tags=["health"])
async def health_check_api():
    """Health check at /api path for reverse proxy configurations."""
    return {"status": "ok"}


@app.get("/api/v1/health", tags=["health"])
async def health_check_v1():
    """Health check endpoint under versioned API path."""
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
async def readiness_check():
    """
    Readiness check - reports if the app is ready to serve traffic.
    Unlike /health, this checks if dependencies are available.
    """
    return {
        "status": "ready" if APP_STATE["startup_complete"] else "starting",
        "db_initialized": APP_STATE["db_initialized"],
        "errors": APP_STATE["startup_errors"] if APP_STATE["startup_errors"] else None,
    }


# =============================================================================
# CORS Middleware - must be added before routes
# Localhost-first with production-ready config
# =============================================================================

# Get settings for CORS configuration
try:
    _settings = get_settings()
    cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "").strip()
    if cors_origins:
        # Parse JSON array or comma-separated string
        import json
        try:
            allowed_origins = json.loads(cors_origins)
        except:
            allowed_origins = [origin.strip() for origin in cors_origins.split(",")]
    else:
        # Default localhost origins for development
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]
        # Add production origin if available
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url and _settings.is_production:
            allowed_origins.append(frontend_url)
except Exception as e:
    logger.warning(f"Error loading CORS settings: {e}")
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Root endpoint
# =============================================================================


@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart Waste Management AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "features": [
            "AI-powered waste classification",
            "Confidence-aware recommendations",
            "Driver collection verification",
            "Real-time analytics",
        ],
    }


# =============================================================================
# Mount storage and register API routers
# These may fail if settings are misconfigured, but health checks still work
# =============================================================================

try:
    from app.core.config import settings
    from app.api.routes import waste, auth

    # Mount storage for uploaded images
    storage_path = settings.STORAGE_PATH
    if not os.path.exists(storage_path):
        os.makedirs(storage_path)
    app.mount("/storage", StaticFiles(directory=storage_path), name="storage")

    # Register API routers
    app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
    app.include_router(
        waste.router, prefix=f"{settings.API_V1_STR}/waste", tags=["waste"]
    )

    logger.info("✓ API routes registered successfully")
except Exception as e:
    logger.error(f"✗ Failed to register API routes: {e}")
    logger.warning("Health endpoints are still available at /health")
