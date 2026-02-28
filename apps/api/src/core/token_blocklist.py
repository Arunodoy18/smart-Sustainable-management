"""
Token Blocklist (Redis-backed)
===============================

Maintains a set of revoked JWT tokens (jti / raw token hash) so that
logout and forced-invalidation are immediate even though JWTs are stateless.

Keys are stored in Redis with a TTL equal to the token's remaining lifetime
so the blocklist is self-cleaning.

Usage:
    from src.core.token_blocklist import token_blocklist

    # On logout
    await token_blocklist.revoke(token_payload)

    # In auth middleware / dependency
    if await token_blocklist.is_revoked(token_string):
        raise HTTPException(401)
"""

from __future__ import annotations

import hashlib
import time
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class TokenBlocklist:
    """Redis-backed JWT blocklist with automatic TTL cleanup."""

    PREFIX = "blocklist:token:"

    def __init__(self) -> None:
        self._redis: Any = None
        self._fallback: set[str] = set()  # in-memory fallback

    async def connect(self, redis_url: str | None = None) -> None:
        """Connect to Redis. Falls back to memory if not available."""
        try:
            import redis.asyncio as redis_lib

            url = redis_url or settings.redis_url
            self._redis = redis_lib.from_url(url, encoding="utf-8", decode_responses=True)
            await self._redis.ping()
            logger.info("Token blocklist connected to Redis")
        except Exception as exc:
            logger.warning("Token blocklist using in-memory fallback", error=str(exc))
            self._redis = None

    async def disconnect(self) -> None:
        if self._redis:
            await self._redis.close()
            self._redis = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def revoke(self, payload: dict[str, Any], raw_token: str | None = None) -> None:
        """
        Add a token to the blocklist.

        Parameters
        ----------
        payload : dict
            Decoded JWT payload (must contain 'exp').
        raw_token : str, optional
            The raw JWT string — if provided, its SHA-256 hash is used as key
            instead of 'jti'.
        """
        key = self._key(payload, raw_token)
        ttl = self._ttl(payload)

        if ttl <= 0:
            return  # Token already expired; nothing to block

        if self._redis:
            try:
                await self._redis.setex(key, ttl, "1")
                logger.debug("Token revoked in Redis", key=key, ttl=ttl)
                return
            except Exception as exc:
                logger.warning("Redis revoke failed, using memory", error=str(exc))

        self._fallback.add(key)

    async def is_revoked(self, raw_token: str) -> bool:
        """Check whether a raw JWT token string has been revoked."""
        key = self.PREFIX + self._hash(raw_token)

        if self._redis:
            try:
                return bool(await self._redis.exists(key))
            except Exception:
                pass

        return key in self._fallback

    async def revoke_all_for_user(self, user_id: str) -> None:
        """
        Revoke ALL tokens for a user by storing a user-level marker.

        Any token issued before this timestamp should be considered invalid.
        The auth dependency must check this marker.
        """
        key = f"blocklist:user:{user_id}"
        ttl = settings.jwt_refresh_token_expire_days * 86400  # cover longest token

        if self._redis:
            try:
                await self._redis.setex(key, ttl, str(int(time.time())))
                return
            except Exception:
                pass

        self._fallback.add(key)

    async def is_user_revoked_since(self, user_id: str, issued_at: int) -> bool:
        """Check if user tokens were mass-revoked after `issued_at`."""
        key = f"blocklist:user:{user_id}"

        revoked_at: str | None = None
        if self._redis:
            try:
                revoked_at = await self._redis.get(key)
            except Exception:
                pass

        if revoked_at is None:
            return key in self._fallback  # memory fallback (imprecise)

        return issued_at < int(revoked_at)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    @staticmethod
    def _hash(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()[:32]

    def _key(self, payload: dict[str, Any], raw_token: str | None) -> str:
        if raw_token:
            return self.PREFIX + self._hash(raw_token)
        jti = payload.get("jti", payload.get("sub", "unknown"))
        return self.PREFIX + str(jti)

    @staticmethod
    def _ttl(payload: dict[str, Any]) -> int:
        exp = payload.get("exp", 0)
        remaining = int(exp) - int(time.time())
        return max(remaining, 0)


# Singleton
token_blocklist = TokenBlocklist()
