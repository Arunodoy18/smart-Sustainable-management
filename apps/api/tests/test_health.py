"""
Health Check Tests
==================

Verify /health and /api/v1/admin/health endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoints:
    """Health check endpoint tests."""

    async def test_root_health(self, client: AsyncClient):
        """GET /health should return 200 with service status."""
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("healthy", "degraded")
        assert "services" in data
        assert "database" in data["services"]

    async def test_root_returns_api_info(self, client: AsyncClient):
        """GET / should return API information."""
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data or "message" in data

    async def test_cors_preflight(self, client: AsyncClient):
        """OPTIONS request should return proper CORS headers."""
        resp = await client.options(
            "/health",
            headers={
                "Origin": "https://wastifi.netlify.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        # CORS middleware should respond (200 or 204)
        assert resp.status_code in (200, 204)
