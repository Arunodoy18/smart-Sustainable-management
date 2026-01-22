"""
Smart Waste AI - FastAPI Application
=====================================

Production-grade FastAPI application for the Smart Waste Management Platform.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from src.core.config import settings
from src.core.logging import get_logger, setup_logging
from src.core.database import engine
from src.api import (
    auth_router,
    waste_router,
    pickup_router,
    rewards_router,
    admin_router,
)

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Smart Waste AI API", version="1.0.0", environment=settings.app_env)
    
    # Initialize cache
    from src.core.cache import cache
    await cache.connect()
    logger.info("Cache connected")
    
    # Initialize ML pipeline
    from src.ml import ClassificationPipeline
    ClassificationPipeline.get_instance()
    logger.info("ML pipeline initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Smart Waste AI API")
    
    # Close cache
    await cache.disconnect()
    logger.info("Cache disconnected")
    
    # Close database connections
    await engine.dispose()
    logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(
    title="Smart Waste AI API",
    description="""
    🌍 **Smart Waste Management Platform API**
    
    A comprehensive API for intelligent waste classification, collection scheduling,
    and environmental impact tracking.
    
    ## Features
    
    * **AI-Powered Classification** - Upload waste images for instant AI classification
    * **Smart Pickup Scheduling** - Request and track waste pickups
    * **Gamification** - Earn points, streaks, and achievements
    * **Real-time Tracking** - Live driver tracking and ETAs
    * **Analytics Dashboard** - Environmental impact metrics
    
    ## Authentication
    
    All endpoints except `/auth/login` and `/auth/register` require a valid JWT token.
    Include the token in the `Authorization` header as `Bearer <token>`.
    """,
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)


# Add CORS middleware FIRST (middleware order is reversed in FastAPI - last added runs first)
# This ensures CORS headers are added to all responses including errors
# Allow Netlify deploy previews with regex pattern
import re
from fastapi.middleware.cors import CORSMiddleware as BaseCORSMiddleware

# Custom CORS middleware to handle Netlify deploy preview URLs
origins_regex = r"^https://([a-z0-9-]+--)?wastifi\.netlify\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add rate limiting middleware (runs after CORS)
from src.core.middleware import RateLimitMiddleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.rate_limit_requests_per_minute,
    burst_size=settings.rate_limit_burst,
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Handle validation errors with clean response."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"][1:]),  # Skip 'body'
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "details": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception("Unhandled exception", path=request.url.path)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected error occurred" if settings.is_production else str(exc),
        },
    )


# Register routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(waste_router, prefix="/api/v1")
app.include_router(pickup_router, prefix="/api/v1")
app.include_router(rewards_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


# Health check endpoints
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint."""
    return {
        "name": "Smart Waste AI API",
        "version": "1.0.0",
        "status": "healthy",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "healthy"}


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check endpoint."""
    from src.core.cache import cache
    
    checks = {
        "database": False,
        "cache": False,
    }
    
    # Check database
    try:
        from sqlalchemy import text
        from src.core.database import get_session
        
        async for session in get_session():
            await session.execute(text("SELECT 1"))
            checks["database"] = True
            break
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
    
    # Check cache
    try:
        await cache.set("_health_check", "ok", expire=10)
        checks["cache"] = True
    except Exception as e:
        logger.error("Cache health check failed", error=str(e))
    
    is_ready = all(checks.values())
    
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "ready": is_ready,
            "checks": checks,
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level="info",
    )
