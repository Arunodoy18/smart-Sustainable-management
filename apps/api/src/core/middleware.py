"""
Rate Limiting Middleware
========================

Token bucket rate limiting for API endpoints.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable

from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class TokenBucket:
    """Token bucket for rate limiting."""
    
    capacity: int
    tokens: float = field(default=0.0)
    last_update: float = field(default_factory=time.time)
    rate: float = 1.0  # tokens per second
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from the bucket.
        
        Returns True if tokens were consumed, False if rate limited.
        """
        now = time.time()
        elapsed = now - self.last_update
        
        # Refill tokens
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last_update = now
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    @property
    def retry_after(self) -> int:
        """Seconds until the next token is available."""
        if self.tokens >= 1:
            return 0
        return int((1 - self.tokens) / self.rate) + 1


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm.
    
    Limits requests per IP address and per authenticated user.
    """
    
    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        burst_size: int = 10,
        exclude_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.exclude_paths = exclude_paths or ["/health", "/ready", "/docs", "/redoc", "/openapi.json"]
        
        # Store buckets per identifier
        self._buckets: dict[str, TokenBucket] = defaultdict(
            lambda: TokenBucket(
                capacity=burst_size,
                tokens=burst_size,
                rate=requests_per_minute / 60.0,
            )
        )
    
    def _get_identifier(self, request: Request) -> str:
        """Get rate limit identifier (IP or user ID)."""
        # Try to get user ID from JWT (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        return f"ip:{request.client.host if request.client else 'unknown'}"
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        """Process request with rate limiting."""
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        identifier = self._get_identifier(request)
        bucket = self._buckets[identifier]
        
        if not bucket.consume():
            retry_after = bucket.retry_after
            
            logger.warning(
                "Rate limit exceeded",
                identifier=identifier,
                path=request.url.path,
                retry_after=retry_after,
            )
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(int(bucket.tokens))
        response.headers["X-RateLimit-Reset"] = str(int(bucket.last_update + 60))
        
        return response


class SlowdownMiddleware(BaseHTTPMiddleware):
    """
    Adaptive slowdown middleware for suspected abuse.
    
    Adds artificial delay for suspicious request patterns.
    """
    
    def __init__(self, app, threshold: int = 100, max_delay_ms: int = 1000):
        super().__init__(app)
        self.threshold = threshold
        self.max_delay_ms = max_delay_ms
        self._request_counts: dict[str, int] = defaultdict(int)
        self._last_reset: float = time.time()
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        """Process request with adaptive slowdown."""
        now = time.time()
        
        # Reset counts every minute
        if now - self._last_reset > 60:
            self._request_counts.clear()
            self._last_reset = now
        
        # Get client identifier
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        self._request_counts[client_ip] += 1
        
        # Add delay if over threshold
        count = self._request_counts[client_ip]
        if count > self.threshold:
            delay = min((count - self.threshold) * 10, self.max_delay_ms)
            await asyncio.sleep(delay / 1000)
        
        return await call_next(request)


import asyncio
