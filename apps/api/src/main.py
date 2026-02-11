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
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

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
    try:
        pipeline = ClassificationPipeline.get_instance()
        await pipeline.initialize()
        logger.info("ML pipeline initialized", classifier=pipeline.classifier.model_name)
    except Exception as e:
        logger.error("Failed to initialize ML pipeline", error=str(e), exc_info=True)
        # Continue startup - will use fallback or fail on first request
        logger.warning("ML pipeline initialization failed - classification may not work")

    # Warm up the database connection pool so the first user request is fast
    try:
        from sqlalchemy import text
        from src.core.database import get_session
        async for session in get_session():
            await session.execute(text("SELECT 1"))
            break
        logger.info("Database connection pool warmed up")
    except Exception as e:
        logger.warning("Database warmup failed (non-fatal)", error=str(e))

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
    docs_url="/docs" if not settings.is_production else "/docs",
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else "/openapi.json",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS – production-hardened
# ---------------------------------------------------------------------------
allowed_origins_list = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

# Netlify deploy-preview pattern
origins_regex = r"^https://([a-z0-9-]+--)?wastifi\.netlify\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    max_age=600,
)


# Rate limiting – added AFTER CORS (Starlette processes last-added first)
# This means RateLimit runs BEFORE CORS, so we must catch errors inside it
# to prevent exceptions from bypassing CORS headers.
from src.core.middleware import RateLimitMiddleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.rate_limit_requests_per_minute,
    burst_size=settings.rate_limit_burst,
)


# ---------------------------------------------------------------------------
# Safety middleware: catch unhandled exceptions INSIDE the middleware stack
# so CORS headers are always applied to the response.
# ---------------------------------------------------------------------------
class CatchAllMiddleware(BaseHTTPMiddleware):
    """Ensures exceptions inside middleware stack don't bypass CORS."""
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        import uuid as _uuid
        request_id = request.headers.get("x-request-id", str(_uuid.uuid4())[:8])
        try:
            response = await call_next(request)
            response.headers["X-Request-Id"] = request_id
            return response
        except Exception as exc:
            logger.exception("Unhandled middleware exception", path=request.url.path, request_id=request_id)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                },
                headers={"X-Request-Id": request_id},
            )

app.add_middleware(CatchAllMiddleware)


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
    """Health check endpoint for load balancers and Render."""
    from src.core.cache import cache

    checks: dict[str, bool] = {
        "database": False,
        "cache": False,
        "ml_model": False,
        "storage": False,
    }

    # Database
    try:
        from sqlalchemy import text
        from src.core.database import get_session

        async for session in get_session():
            await session.execute(text("SELECT 1"))
            checks["database"] = True
            break
    except Exception as e:
        logger.error("Database health check failed", error=str(e))

    # Cache
    try:
        await cache.set("_health_check", "ok", expire=10)
        checks["cache"] = True
    except Exception:
        pass

    # ML
    try:
        from src.ml import ClassificationPipeline
        pipeline = ClassificationPipeline.get_instance()
        if pipeline._initialized:
            checks["ml_model"] = True
    except Exception:
        pass

    # Storage
    try:
        from pathlib import Path
        if settings.storage_backend == "local":
            checks["storage"] = True
        else:
            checks["storage"] = bool(settings.s3_access_key_id)
    except Exception:
        pass

    is_healthy = checks["database"]  # DB is the only hard requirement
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "version": "1.0.0",
            "checks": checks,
        },
    )


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check endpoint."""
    return {"ready": True, "status": "healthy"}


@app.get("/health/ready", tags=["Health"], include_in_schema=False)
async def health_ready_combined():
    """Combined health/ready endpoint — Render probes this path."""
    return {"ready": True, "status": "healthy"}


# ---------------------------------------------------------------------------
# Serve uploaded images from local storage
# ---------------------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from pathlib import Path as _Path

_storage_dir = _Path("./storage")
_storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(_storage_dir)), name="storage")


# ---------------------------------------------------------------------------
# WebSocket endpoint for realtime driver tracking
# ---------------------------------------------------------------------------
from fastapi import WebSocket, WebSocketDisconnect
import json as _json

# In-memory store for connected driver sockets and latest positions
_driver_connections: dict[str, WebSocket] = {}
_driver_positions: dict[str, dict] = {}
_tracking_subscribers: dict[str, list[WebSocket]] = {}  # pickup_id -> [ws]


@app.websocket("/ws/driver/{driver_id}")
async def driver_location_ws(websocket: WebSocket, driver_id: str):
    """Driver sends location updates via WebSocket."""
    await websocket.accept()
    _driver_connections[driver_id] = websocket
    logger.info("Driver WebSocket connected", driver_id=driver_id)

    try:
        while True:
            data = await websocket.receive_text()
            payload = _json.loads(data)
            lat = payload.get("lat") or payload.get("latitude")
            lng = payload.get("lng") or payload.get("longitude")
            if lat is not None and lng is not None:
                import time as _time_mod
                position = {
                    "driver_id": driver_id,
                    "lat": float(lat),
                    "lng": float(lng),
                    "timestamp": payload.get("timestamp", _time_mod.time()),
                }
                _driver_positions[driver_id] = position

                # Broadcast to all tracking subscribers for any pickup this driver is on
                for pickup_id, subs in list(_tracking_subscribers.items()):
                    dead: list[WebSocket] = []
                    for sub_ws in subs:
                        try:
                            await sub_ws.send_json(position)
                        except Exception:
                            dead.append(sub_ws)
                    for d in dead:
                        subs.remove(d)
    except WebSocketDisconnect:
        _driver_connections.pop(driver_id, None)
        _driver_positions.pop(driver_id, None)
        logger.info("Driver WebSocket disconnected", driver_id=driver_id)


@app.websocket("/ws/track/{pickup_id}")
async def track_driver_ws(websocket: WebSocket, pickup_id: str):
    """User subscribes to live driver location for a pickup."""
    await websocket.accept()
    _tracking_subscribers.setdefault(pickup_id, []).append(websocket)
    logger.info("Tracking subscriber connected", pickup_id=pickup_id)

    try:
        # Send current driver positions immediately
        for pos in _driver_positions.values():
            await websocket.send_json(pos)
        # Keep connection alive, wait for disconnect
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        subs = _tracking_subscribers.get(pickup_id, [])
        if websocket in subs:
            subs.remove(websocket)
        logger.info("Tracking subscriber disconnected", pickup_id=pickup_id)


@app.get("/api/v1/drivers/locations", tags=["Realtime"])
async def get_all_driver_locations():
    """REST fallback: Get all active driver positions."""
    return {"drivers": list(_driver_positions.values())}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.is_development,
        log_level="info",
    )
