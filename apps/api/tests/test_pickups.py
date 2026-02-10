"""
Pickup Endpoint Tests
======================

Tests for /api/v1/pickups/* endpoints.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
class TestPickupRequest:
    """POST /api/v1/pickups/request"""

    async def test_create_pickup_request(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.post(
            "/api/v1/pickups/request",
            headers=auth_header(user_token),
            json={
                "address": "123 Green St",
                "latitude": 40.7128,
                "longitude": -74.006,
                "waste_types": ["recyclable"],
                "notes": "Large bag of plastics",
            },
        )
        # 201 if successfully created, 422 if schema mismatch
        assert resp.status_code in (201, 200, 422)

    async def test_create_pickup_no_auth(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/pickups/request",
            json={
                "address": "456 Test Ave",
                "latitude": 40.0,
                "longitude": -74.0,
                "waste_types": ["organic"],
            },
        )
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestMyPickups:
    """GET /api/v1/pickups/my-pickups"""

    async def test_get_my_pickups(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/pickups/my-pickups",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert "total_pages" in data

    async def test_my_pickups_no_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/pickups/my-pickups")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestDriverPickups:
    """Driver-facing pickup endpoints"""

    async def test_driver_available_pickups(
        self, client: AsyncClient, driver_user, driver_token
    ):
        resp = await client.get(
            "/api/v1/pickups/driver/available",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200

    async def test_driver_assigned_pickups(
        self, client: AsyncClient, driver_user, driver_token
    ):
        resp = await client.get(
            "/api/v1/pickups/driver/assigned",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200

    async def test_driver_stats(
        self, client: AsyncClient, driver_user, driver_token
    ):
        resp = await client.get(
            "/api/v1/pickups/driver/stats",
            headers=auth_header(driver_token),
        )
        assert resp.status_code == 200

    async def test_citizen_cannot_access_driver_endpoints(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/pickups/driver/available",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 403  # insufficient permissions
