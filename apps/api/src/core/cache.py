"""
Redis Client Configuration
===========================

Async Redis client for caching and real-time features.
"""

from typing import Any

import redis.asyncio as redis
from redis.asyncio import Redis

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Global Redis client instance
_redis_client: Redis | None = None


async def get_redis() -> Redis:
    """
    Get Redis client instance.
    
    Returns:
        Redis: Async Redis client
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info("Redis client initialized", url=settings.redis_url)
    
    return _redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")


class CacheService:
    """
    High-level caching service built on Redis.
    
    Provides:
    - Key-value caching with TTL
    - JSON serialization
    - Prefix namespacing
    """

    def __init__(self, prefix: str = "ecowaste"):
        self.prefix = prefix
        self._client: Redis | None = None

    async def _get_client(self) -> Redis:
        """Get Redis client."""
        if self._client is None:
            self._client = await get_redis()
        return self._client

    def _make_key(self, key: str) -> str:
        """Create namespaced cache key."""
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Any | None:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        client = await self._get_client()
        value = await client.get(self._make_key(key))
        return value

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (defaults to config)
            
        Returns:
            True if successful
        """
        client = await self._get_client()
        ttl = ttl or settings.redis_cache_ttl
        await client.set(self._make_key(key), value, ex=ttl)
        return True

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted
        """
        client = await self._get_client()
        result = await client.delete(self._make_key(key))
        return bool(result)

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        client = await self._get_client()
        result = await client.exists(self._make_key(key))
        return bool(result)

    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment a counter in cache.
        
        Args:
            key: Cache key
            amount: Amount to increment by
            
        Returns:
            New counter value
        """
        client = await self._get_client()
        return await client.incr(self._make_key(key), amount)

    async def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration on existing key.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if expiration was set
        """
        client = await self._get_client()
        result = await client.expire(self._make_key(key), ttl)
        return bool(result)


# Default cache instance
cache = CacheService()
