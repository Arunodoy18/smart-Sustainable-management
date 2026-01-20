"""
Redis Client Configuration
===========================

Async Redis client for caching and real-time features.
Falls back to in-memory cache when Redis is unavailable.
"""

from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Try to import redis, but make it optional
try:
    import redis.asyncio as redis
    from redis.asyncio import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    Redis = None  # type: ignore

# Global Redis client instance
_redis_client: "Redis | None" = None

# In-memory fallback cache
_memory_cache: dict[str, Any] = {}


async def get_redis() -> "Redis | None":
    """
    Get Redis client instance.
    
    Returns:
        Redis: Async Redis client or None if unavailable
    """
    global _redis_client
    
    if not REDIS_AVAILABLE:
        return None
    
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            # Test connection
            await _redis_client.ping()
            logger.info("Redis client initialized", url=settings.redis_url)
        except Exception as e:
            logger.warning("Redis connection failed, using in-memory cache", error=str(e))
            _redis_client = None
            return None
    
    return _redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    
    if _redis_client is not None:
        try:
            await _redis_client.close()
        except Exception:
            pass
        _redis_client = None
        logger.info("Redis connection closed")


class CacheService:
    """
    High-level caching service built on Redis with in-memory fallback.
    
    Provides:
    - Key-value caching with TTL
    - JSON serialization
    - Prefix namespacing
    - Graceful fallback to memory when Redis is unavailable
    """

    def __init__(self, prefix: str = "ecowaste"):
        self.prefix = prefix
        self._client: "Redis | None" = None
        self._use_memory = False

    async def connect(self) -> None:
        """Initialize cache connection."""
        self._client = await get_redis()
        if self._client is None:
            self._use_memory = True
            logger.info("Using in-memory cache (Redis unavailable)")
        else:
            logger.info("Connected to Redis cache")

    async def disconnect(self) -> None:
        """Close cache connection."""
        await close_redis()
        self._client = None

    async def _get_client(self) -> "Redis | None":
        """Get Redis client."""
        if self._client is None and not self._use_memory:
            self._client = await get_redis()
            if self._client is None:
                self._use_memory = True
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
        if self._use_memory:
            return _memory_cache.get(self._make_key(key))
        
        client = await self._get_client()
        if client is None:
            return _memory_cache.get(self._make_key(key))
        
        try:
            value = await client.get(self._make_key(key))
            return value
        except Exception:
            return _memory_cache.get(self._make_key(key))

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
        expire: int | None = None,
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (defaults to config)
            expire: Alias for ttl (for compatibility)
            
        Returns:
            True if successful
        """
        effective_ttl = ttl or expire or settings.redis_cache_ttl
        cache_key = self._make_key(key)
        
        if self._use_memory:
            _memory_cache[cache_key] = value
            return True
        
        client = await self._get_client()
        if client is None:
            _memory_cache[cache_key] = value
            return True
        
        try:
            await client.set(cache_key, value, ex=effective_ttl)
            return True
        except Exception:
            _memory_cache[cache_key] = value
            return True

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted
        """
        cache_key = self._make_key(key)
        
        if self._use_memory:
            _memory_cache.pop(cache_key, None)
            return True
        
        client = await self._get_client()
        if client is None:
            _memory_cache.pop(cache_key, None)
            return True
        
        try:
            result = await client.delete(cache_key)
            return bool(result)
        except Exception:
            _memory_cache.pop(cache_key, None)
            return True

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        cache_key = self._make_key(key)
        
        if self._use_memory:
            return cache_key in _memory_cache
        
        client = await self._get_client()
        if client is None:
            return cache_key in _memory_cache
        
        try:
            result = await client.exists(cache_key)
            return bool(result)
        except Exception:
            return cache_key in _memory_cache

    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment a counter in cache.
        
        Args:
            key: Cache key
            amount: Amount to increment by
            
        Returns:
            New counter value
        """
        cache_key = self._make_key(key)
        
        if self._use_memory:
            current = _memory_cache.get(cache_key, 0)
            new_value = int(current) + amount
            _memory_cache[cache_key] = new_value
            return new_value
        
        client = await self._get_client()
        if client is None:
            current = _memory_cache.get(cache_key, 0)
            new_value = int(current) + amount
            _memory_cache[cache_key] = new_value
            return new_value
        
        try:
            return await client.incr(cache_key, amount)
        except Exception:
            current = _memory_cache.get(cache_key, 0)
            new_value = int(current) + amount
            _memory_cache[cache_key] = new_value
            return new_value

    async def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration on existing key.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if expiration was set
        """
        if self._use_memory:
            return True  # Memory cache doesn't support TTL
        
        client = await self._get_client()
        if client is None:
            return True
        
        try:
            result = await client.expire(self._make_key(key), ttl)
            return bool(result)
        except Exception:
            return True


# Default cache instance
cache = CacheService()
