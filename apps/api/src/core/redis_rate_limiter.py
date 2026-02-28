"""
Redis-Backed Rate Limiter
==========================

Distributed rate limiter using Redis sorted sets (sliding window).
Falls back to the existing in-process token-bucket when Redis is unavailable.

Usage in middleware or route:
    from src.core.redis_rate_limiter import redis_rate_limiter

    allowed = await redis_rate_limiter.is_allowed(identifier, limit=60, window=60)
"""

from __future__ import annotations

import time
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class RedisRateLimiter:
    """
    Sliding-window rate limiter backed by Redis sorted sets.

    Each identifier (IP or user ID) gets a sorted set where members are
    unique request timestamps, scored by their epoch time. On each request
    we remove entries outside the window, count remaining, and decide.
    """

    PREFIX = "ratelimit:"

    def __init__(self) -> None:
        self._redis: Any = None

    async def connect(self, redis_url: str | None = None) -> None:
        try:
            import redis.asyncio as redis_lib

            url = redis_url or settings.redis_url
            self._redis = redis_lib.from_url(url, encoding="utf-8", decode_responses=True)
            await self._redis.ping()
            logger.info("Redis rate limiter connected")
        except Exception as exc:
            logger.warning("Redis rate limiter unavailable (falling back to in-process)", error=str(exc))
            self._redis = None

    async def disconnect(self) -> None:
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def is_allowed(
        self,
        identifier: str,
        limit: int = 60,
        window: int = 60,
    ) -> tuple[bool, dict[str, int]]:
        """
        Check if a request should be allowed.

        Returns
        -------
        (allowed, headers) where headers contain X-RateLimit-* values.
        """
        if self._redis is None:
            # Can't enforce; allow everything (process-level limiter still applies)
            return True, {"limit": limit, "remaining": limit, "reset": int(time.time()) + window}

        now = time.time()
        key = self.PREFIX + identifier
        window_start = now - window

        pipe = self._redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)      # prune old entries
        pipe.zadd(key, {f"{now}": now})                   # add current request
        pipe.zcard(key)                                    # count window entries
        pipe.expire(key, window + 1)                       # auto-cleanup
        results = await pipe.execute()

        request_count = results[2]
        allowed = request_count <= limit
        remaining = max(0, limit - request_count)

        headers = {
            "limit": limit,
            "remaining": remaining,
            "reset": int(now + window),
        }

        if not allowed:
            logger.warning(
                "Rate limit exceeded (Redis)",
                identifier=identifier,
                count=request_count,
                limit=limit,
            )

        return allowed, headers


# Singleton
redis_rate_limiter = RedisRateLimiter()
