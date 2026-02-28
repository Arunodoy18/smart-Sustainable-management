"""
Event-Driven Architecture
==========================

Lightweight event bus for CQRS-style async processing.
Supports both in-process handlers and Redis Pub/Sub for multi-process.

Usage:
    # Publishing
    await event_bus.publish(WasteUploadedEvent(entry_id=..., user_id=...))

    # Subscribing (at module load or in lifespan)
    event_bus.subscribe("waste.uploaded", handle_waste_uploaded)
"""

import asyncio
import json
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine

from src.core.logging import get_logger

logger = get_logger(__name__)


# ============================================================================
# BASE EVENT
# ============================================================================


@dataclass
class DomainEvent:
    """Base class for all domain events."""

    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    version: int = 1

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=str)


# ============================================================================
# DOMAIN EVENTS
# ============================================================================


@dataclass
class WasteUploadedEvent(DomainEvent):
    """Emitted when a user uploads a waste image."""

    event_type: str = "waste.uploaded"
    entry_id: str = ""
    user_id: str = ""
    image_url: str = ""


@dataclass
class ClassificationCompleteEvent(DomainEvent):
    """Emitted when ML classification finishes."""

    event_type: str = "waste.classified"
    entry_id: str = ""
    user_id: str = ""
    category: str = ""
    confidence: float = 0.0
    processing_time_ms: int = 0


@dataclass
class PointsAwardedEvent(DomainEvent):
    """Emitted when a user earns points."""

    event_type: str = "rewards.points_awarded"
    user_id: str = ""
    points: int = 0
    reason: str = ""


@dataclass
class PickupStateChangedEvent(DomainEvent):
    """Emitted when a pickup transitions state."""

    event_type: str = "pickup.state_changed"
    pickup_id: str = ""
    driver_id: str = ""
    old_status: str = ""
    new_status: str = ""


@dataclass
class UserRegisteredEvent(DomainEvent):
    """Emitted when a new user registers."""

    event_type: str = "user.registered"
    user_id: str = ""
    email: str = ""
    role: str = ""


@dataclass
class DriverLocationUpdatedEvent(DomainEvent):
    """Emitted when a driver sends a location update."""

    event_type: str = "driver.location_updated"
    driver_id: str = ""
    latitude: float = 0.0
    longitude: float = 0.0


# ============================================================================
# EVENT HANDLER TYPE
# ============================================================================

EventHandler = Callable[[DomainEvent], Coroutine[Any, Any, None]]


# ============================================================================
# EVENT BUS — In-Process + Redis Pub/Sub
# ============================================================================


class EventBus:
    """
    Hybrid event bus: synchronous in-process dispatch + optional Redis Pub/Sub
    for multi-worker / multi-service broadcasting.

    In-process handlers run immediately (fire-and-forget with error isolation).
    Redis handlers allow other processes to consume events.
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = {}
        self._redis_client: Any = None
        self._redis_pubsub_task: asyncio.Task | None = None
        self._metrics: dict[str, int] = {"published": 0, "handled": 0, "errors": 0}

    # ------------------------------------------------------------------
    # Subscription
    # ------------------------------------------------------------------

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Register a handler for an event type."""
        self._handlers.setdefault(event_type, []).append(handler)
        logger.debug("Event handler registered", event_type=event_type, handler=handler.__name__)

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------

    async def publish(self, event: DomainEvent) -> None:
        """
        Publish an event to all registered handlers.

        Handlers are fire-and-forget: errors in one handler do not prevent
        others from running.
        """
        self._metrics["published"] += 1
        event_type = event.event_type

        # In-process handlers
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            try:
                await handler(event)
                self._metrics["handled"] += 1
            except Exception as exc:
                self._metrics["errors"] += 1
                logger.error(
                    "Event handler failed",
                    event_type=event_type,
                    handler=handler.__name__,
                    error=str(exc),
                    exc_info=True,
                )

        # Redis Pub/Sub broadcast (if connected)
        if self._redis_client is not None:
            try:
                await self._redis_client.publish(
                    f"events:{event_type}", event.to_json()
                )
            except Exception as exc:
                logger.warning("Redis event publish failed", error=str(exc))

    # ------------------------------------------------------------------
    # Redis Integration
    # ------------------------------------------------------------------

    async def connect_redis(self, redis_url: str) -> None:
        """Connect to Redis for cross-process event broadcasting."""
        try:
            import redis.asyncio as redis

            self._redis_client = redis.from_url(
                redis_url, encoding="utf-8", decode_responses=True
            )
            await self._redis_client.ping()
            logger.info("Event bus connected to Redis Pub/Sub")
        except Exception as exc:
            logger.warning("Event bus Redis connection failed (in-process only)", error=str(exc))
            self._redis_client = None

    async def start_redis_listener(self) -> None:
        """Start listening for events on Redis Pub/Sub channels."""
        if self._redis_client is None:
            return

        pubsub = self._redis_client.pubsub()
        patterns = [f"events:{et}" for et in self._handlers]
        if not patterns:
            return

        await pubsub.psubscribe(*[f"events:*"])

        async def _listen() -> None:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    try:
                        channel = message["channel"]
                        event_type = channel.replace("events:", "")
                        data = json.loads(message["data"])

                        handlers = self._handlers.get(event_type, [])
                        for handler in handlers:
                            try:
                                # Reconstruct minimal event
                                evt = DomainEvent(**{k: data.get(k, "") for k in ("event_id", "event_type", "timestamp")})
                                # Pass raw data via __dict__ for handler convenience
                                evt.__dict__.update(data)
                                await handler(evt)
                            except Exception as exc:
                                logger.error("Redis event handler error", error=str(exc))
                    except Exception as exc:
                        logger.error("Redis message parse error", error=str(exc))

        self._redis_pubsub_task = asyncio.create_task(_listen())
        logger.info("Event bus Redis listener started")

    async def disconnect(self) -> None:
        """Clean up Redis resources."""
        if self._redis_pubsub_task:
            self._redis_pubsub_task.cancel()
        if self._redis_client:
            await self._redis_client.close()
            self._redis_client = None

    @property
    def metrics(self) -> dict[str, int]:
        return dict(self._metrics)


# ============================================================================
# SINGLETON
# ============================================================================

event_bus = EventBus()
