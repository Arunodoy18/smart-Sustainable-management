"""
Circuit Breaker Pattern
========================

Protects external service calls (ML inference, S3, email) from cascading
failures.  When a service fails repeatedly the breaker "opens" and fast-fails
instead of waiting for timeouts.

States:
  CLOSED   -> calls pass through; failures are counted
  OPEN     -> calls fail immediately after threshold is hit
  HALF_OPEN-> after a cooldown period, one trial call is allowed

Usage:
    ml_breaker = CircuitBreaker("ml_pipeline", failure_threshold=3, reset_timeout=30)

    async def classify(image):
        async with ml_breaker:
            return await pipeline.classify(image)
"""

from __future__ import annotations

import asyncio
import enum
import time
from dataclasses import dataclass, field
from typing import Any

from src.core.logging import get_logger

logger = get_logger(__name__)


class CircuitState(enum.Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerError(Exception):
    """Raised when the circuit is open and the call is rejected."""

    def __init__(self, breaker_name: str, retry_after: float):
        self.breaker_name = breaker_name
        self.retry_after = retry_after
        super().__init__(f"Circuit breaker '{breaker_name}' is OPEN. Retry after {retry_after:.0f}s")


@dataclass
class CircuitBreaker:
    """
    Async-compatible circuit breaker.

    Parameters
    ----------
    name : str
        Human-readable name (used in logs & metrics).
    failure_threshold : int
        Number of consecutive failures before opening.
    reset_timeout : float
        Seconds to wait in OPEN state before moving to HALF_OPEN.
    half_open_max_calls : int
        Max concurrent calls allowed in HALF_OPEN state.
    """

    name: str
    failure_threshold: int = 5
    reset_timeout: float = 30.0
    half_open_max_calls: int = 1

    # Internal state
    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failure_count: int = field(default=0, init=False)
    _success_count: int = field(default=0, init=False)
    _last_failure_time: float = field(default=0.0, init=False)
    _half_open_calls: int = field(default=0, init=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)

    # Metrics
    _total_calls: int = field(default=0, init=False)
    _total_failures: int = field(default=0, init=False)
    _total_rejections: int = field(default=0, init=False)

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            if time.monotonic() - self._last_failure_time >= self.reset_timeout:
                self._state = CircuitState.HALF_OPEN
                self._half_open_calls = 0
                logger.info("Circuit breaker half-open", name=self.name)
        return self._state

    # -- Context manager interface --

    async def __aenter__(self) -> CircuitBreaker:
        await self._before_call()
        return self

    async def __aexit__(self, exc_type: type | None, exc_val: BaseException | None, exc_tb: Any) -> bool:
        if exc_type is None:
            await self._on_success()
        else:
            await self._on_failure(exc_val)  # type: ignore[arg-type]
        return False  # Do not suppress the exception

    # -- Decorator interface --

    def __call__(self, func: Any) -> Any:
        """Use as a decorator: @breaker"""
        import functools

        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            async with self:
                return await func(*args, **kwargs)

        return wrapper

    # -- Internal methods --

    async def _before_call(self) -> None:
        async with self._lock:
            self._total_calls += 1
            current = self.state

            if current == CircuitState.OPEN:
                self._total_rejections += 1
                retry_after = self.reset_timeout - (time.monotonic() - self._last_failure_time)
                raise CircuitBreakerError(self.name, max(0, retry_after))

            if current == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.half_open_max_calls:
                    self._total_rejections += 1
                    raise CircuitBreakerError(self.name, self.reset_timeout)
                self._half_open_calls += 1

    async def _on_success(self) -> None:
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.half_open_max_calls:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    self._success_count = 0
                    logger.info("Circuit breaker closed (recovered)", name=self.name)
            else:
                self._failure_count = 0

    async def _on_failure(self, exc: BaseException) -> None:
        async with self._lock:
            self._failure_count += 1
            self._total_failures += 1
            self._last_failure_time = time.monotonic()

            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                logger.warning("Circuit breaker re-opened (half-open trial failed)", name=self.name, error=str(exc))
            elif self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                logger.warning(
                    "Circuit breaker opened",
                    name=self.name,
                    failures=self._failure_count,
                    error=str(exc),
                )

    def force_open(self) -> None:
        """Manually trip the breaker."""
        self._state = CircuitState.OPEN
        self._last_failure_time = time.monotonic()
        logger.warning("Circuit breaker manually opened", name=self.name)

    def force_close(self) -> None:
        """Manually reset the breaker."""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        logger.info("Circuit breaker manually closed", name=self.name)

    @property
    def metrics(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self._failure_count,
            "total_calls": self._total_calls,
            "total_failures": self._total_failures,
            "total_rejections": self._total_rejections,
        }


# ---------------------------------------------------------------------------
# Pre-configured breakers for different subsystems
# ---------------------------------------------------------------------------

ml_breaker = CircuitBreaker(name="ml_pipeline", failure_threshold=3, reset_timeout=30)
storage_breaker = CircuitBreaker(name="storage", failure_threshold=5, reset_timeout=60)
email_breaker = CircuitBreaker(name="email", failure_threshold=3, reset_timeout=120)
