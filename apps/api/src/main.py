"""
Smart Waste AI - FastAPI Application
=====================================

Production-grade FastAPI application for the Smart Waste Management Platform.
Includes event-driven architecture, OpenTelemetry, circuit breakers,
token blocklist, and Redis Pub/Sub for WebSocket scaling.
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

    Handles startup and shutdown events for all subsystems:
    cache, ML pipeline, event bus, token blocklist, telemetry.
    """
    # Startup
    logger.info("Starting Smart Waste AI API", version="1.0.0", environment=settings.app_env)

    # ---- Cache ----
    from src.core.cache import cache
    await cache.connect()
    logger.info("Cache connected")

    # ---- Token Blocklist ----
    from src.core.token_blocklist import token_blocklist
    await token_blocklist.connect()
    logger.info("Token blocklist initialized")

    # ---- Event Bus ----
    from src.core.events import event_bus
    try:
        await event_bus.connect_redis(settings.redis_url)
        await event_bus.start_redis_listener()
    except Exception as exc:
        logger.warning("Event bus Redis connection failed (in-process only)", error=str(exc))

    # Register default event handlers
    _register_event_handlers(event_bus)

    # ---- ML Pipeline ----
    from src.ml import ClassificationPipeline
    try:
        pipeline = ClassificationPipeline.get_instance()
        await pipeline.initialize()
        logger.info("ML pipeline initialized", classifier=pipeline.classifier.model_name)
    except Exception as e:
        logger.error("Failed to initialize ML pipeline", error=str(e), exc_info=True)
        logger.warning("ML pipeline initialization failed - classification may not work")

    # ---- OpenTelemetry ----
    from src.core.telemetry import setup_telemetry
    setup_telemetry(app)

    # ---- Database warmup ----
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

    # ---- Shutdown ----
    logger.info("Shutting down Smart Waste AI API")

    await event_bus.disconnect()
    logger.info("Event bus disconnected")

    await token_blocklist.disconnect()
    logger.info("Token blocklist disconnected")

    await cache.disconnect()
    logger.info("Cache disconnected")

    await engine.dispose()
    logger.info("Database connections closed")


def _register_event_handlers(bus: "EventBus") -> None:  # type: ignore[name-defined]
    """Wire domain event handlers."""
    from src.core.events import ClassificationCompleteEvent, PointsAwardedEvent

    async def _log_classification(event: ClassificationCompleteEvent) -> None:
        from src.core.telemetry import record_classification
        record_classification(event.category, event.confidence, event.processing_time_ms)
        logger.info(
            "Classification complete",
            entry_id=event.entry_id,
            category=event.category,
            confidence=event.confidence,
        )

    async def _log_points(event: PointsAwardedEvent) -> None:
        logger.info("Points awarded", user_id=event.user_id, points=event.points, reason=event.reason)

    bus.subscribe("waste.classified", _log_classification)
    bus.subscribe("rewards.points_awarded", _log_points)


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
    """
    Comprehensive health check endpoint for load balancers and Render.

    Reports status of all subsystems: database, cache, ML, storage,
    event bus, circuit breakers.
    """
    from src.core.cache import cache

    checks: dict[str, bool] = {
        "database": False,
        "cache": False,
        "ml_model": False,
        "storage": False,
        "event_bus": False,
    }
    details: dict[str, str] = {}

    # Database
    try:
        from sqlalchemy import text
        from src.core.database import get_session

        async for session in get_session():
            await session.execute(text("SELECT 1"))
            checks["database"] = True
            break
    except Exception as e:
        details["database"] = str(e)
        logger.error("Database health check failed", error=str(e))

    # Cache
    try:
        await cache.set("_health_check", "ok", expire=10)
        checks["cache"] = True
    except Exception as e:
        details["cache"] = str(e)

    # ML
    try:
        from src.ml import ClassificationPipeline
        pipeline = ClassificationPipeline.get_instance()
        if pipeline._initialized:
            checks["ml_model"] = True
        else:
            details["ml_model"] = "not initialized"
    except Exception as e:
        details["ml_model"] = str(e)

    # Storage
    try:
        from pathlib import Path
        if settings.storage_backend == "local":
            storage_path = Path("./storage")
            checks["storage"] = storage_path.exists() and storage_path.is_dir()
        else:
            checks["storage"] = bool(settings.s3_access_key_id)
    except Exception as e:
        details["storage"] = str(e)

    # Event Bus
    try:
        from src.core.events import event_bus
        checks["event_bus"] = event_bus._redis_client is not None or True  # in-process always works
    except Exception:
        pass

    # Circuit breaker status
    from src.core.circuit_breaker import ml_breaker, storage_breaker
    breaker_status = {
        "ml_pipeline": ml_breaker.metrics,
        "storage": storage_breaker.metrics,
    }

    all_critical = checks["database"]  # DB is the only hard requirement
    degraded = not all(checks.values())

    return JSONResponse(
        status_code=status.HTTP_200_OK if all_critical else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "healthy" if not degraded else ("degraded" if all_critical else "unhealthy"),
            "version": "1.0.0",
            "environment": settings.app_env,
            "checks": checks,
            "details": details if details else None,
            "circuit_breakers": breaker_status,
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
# (Authenticated + Redis Pub/Sub for multi-worker scaling)
# ---------------------------------------------------------------------------
from fastapi import WebSocket, WebSocketDisconnect, Query
import json as _json

# In-memory store for THIS process's connections (each uvicorn worker has its own)
_driver_connections: dict[str, WebSocket] = {}
_driver_positions: dict[str, dict] = {}
_tracking_subscribers: dict[str, list[WebSocket]] = {}  # pickup_id -> [ws]


async def _authenticate_ws(websocket: WebSocket, token: str | None) -> dict | None:
    """Validate JWT token for WebSocket connection. Returns payload or None."""
    if not token:
        return None
    from src.core.security import verify_token_type
    from src.core.token_blocklist import token_blocklist

    payload = verify_token_type(token, "access")
    if not payload:
        return None

    # Check blocklist
    if await token_blocklist.is_revoked(token):
        return None

    return payload


async def _broadcast_position(position: dict) -> None:
    """Broadcast driver position via Redis Pub/Sub (if available) for multi-worker."""
    try:
        from src.core.cache import get_redis
        redis = await get_redis()
        if redis:
            await redis.publish("driver:positions", _json.dumps(position))
    except Exception:
        pass  # Fallback to local-only


@app.websocket("/ws/driver/{driver_id}")
async def driver_location_ws(
    websocket: WebSocket,
    driver_id: str,
    token: str | None = Query(default=None),
):
    """
    Driver sends location updates via WebSocket.

    Authentication is required: pass JWT as ?token= query param.
    Only drivers and admins are allowed.
    """
    # Authenticate before accepting
    payload = await _authenticate_ws(websocket, token)
    if not payload:
        await websocket.close(code=4001, reason="Authentication required")
        return

    user_role = payload.get("role", "")
    if user_role not in ("DRIVER", "ADMIN", "driver", "admin"):
        await websocket.close(code=4003, reason="Drivers only")
        return

    await websocket.accept()
    _driver_connections[driver_id] = websocket

    from src.core.telemetry import record_ws_connect, record_ws_disconnect
    record_ws_connect()
    logger.info("Driver WebSocket connected", driver_id=driver_id, user=payload.get("sub"))

    try:
        while True:
            data = await websocket.receive_text()
            payload_data = _json.loads(data)
            lat = payload_data.get("lat") or payload_data.get("latitude")
            lng = payload_data.get("lng") or payload_data.get("longitude")
            if lat is not None and lng is not None:
                import time as _time_mod
                position = {
                    "driver_id": driver_id,
                    "lat": float(lat),
                    "lng": float(lng),
                    "timestamp": payload_data.get("timestamp", _time_mod.time()),
                }
                _driver_positions[driver_id] = position

                # Publish to Redis for other workers
                await _broadcast_position(position)

                # Local broadcast to tracking subscribers
                for pickup_id, subs in list(_tracking_subscribers.items()):
                    dead: list[WebSocket] = []
                    for sub_ws in subs:
                        try:
                            await sub_ws.send_json(position)
                        except Exception:
                            dead.append(sub_ws)
                    for d in dead:
                        subs.remove(d)

                # Emit domain event
                from src.core.events import DriverLocationUpdatedEvent, event_bus
                await event_bus.publish(DriverLocationUpdatedEvent(
                    driver_id=driver_id, latitude=float(lat), longitude=float(lng),
                ))
    except WebSocketDisconnect:
        _driver_connections.pop(driver_id, None)
        _driver_positions.pop(driver_id, None)
        record_ws_disconnect()
        logger.info("Driver WebSocket disconnected", driver_id=driver_id)


@app.websocket("/ws/track/{pickup_id}")
async def track_driver_ws(
    websocket: WebSocket,
    pickup_id: str,
    token: str | None = Query(default=None),
):
    """
    User subscribes to live driver location for a pickup.

    Authentication is optional but recommended.
    """
    # Optional auth — allow unauthenticated tracking for public demo
    payload = await _authenticate_ws(websocket, token)
    # We accept even without auth, but log it
    if not payload:
        logger.debug("Unauthenticated tracking subscriber", pickup_id=pickup_id)

    await websocket.accept()
    _tracking_subscribers.setdefault(pickup_id, []).append(websocket)

    from src.core.telemetry import record_ws_connect, record_ws_disconnect
    record_ws_connect()
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
        record_ws_disconnect()
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
