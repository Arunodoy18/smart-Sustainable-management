"""
Admin Endpoint Tests
=====================

Tests for /api/v1/admin/* endpoints — role-based access control.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
class TestAdminDashboard:
    """GET /api/v1/admin/dashboard"""

    async def test_admin_can_access_dashboard(
        self, client: AsyncClient, admin_user, admin_token
    ):
        resp = await client.get(
            "/api/v1/admin/dashboard",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200

    async def test_citizen_cannot_access_dashboard(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/admin/dashboard",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 403

    async def test_no_auth_denied(self, client: AsyncClient):
        resp = await client.get("/api/v1/admin/dashboard")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestAdminUsers:
    """GET /api/v1/admin/users"""

    async def test_admin_list_users(
        self, client: AsyncClient, admin_user, admin_token
    ):
        resp = await client.get(
            "/api/v1/admin/users",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total_pages" in data

    async def test_admin_get_user_detail(
        self, client: AsyncClient, admin_user, admin_token, test_user
    ):
        resp = await client.get(
            f"/api/v1/admin/users/{test_user.id}",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200

    async def test_admin_suspend_user(
        self, client: AsyncClient, admin_user, admin_token, test_user
    ):
        resp = await client.post(
            f"/api/v1/admin/users/{test_user.id}/suspend",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200

    async def test_citizen_cannot_list_users(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/admin/users",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestAdminHealth:
    """GET /api/v1/admin/health"""

    async def test_admin_health_check(
        self, client: AsyncClient, admin_user, admin_token
    ):
        resp = await client.get(
            "/api/v1/admin/health",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestAdminAnalytics:
    """GET /api/v1/admin/analytics/zones"""

    async def test_admin_zones_analytics(
        self, client: AsyncClient, admin_user, admin_token
    ):
        resp = await client.get(
            "/api/v1/admin/analytics/zones",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200

    async def test_admin_heatmap(
        self, client: AsyncClient, admin_user, admin_token
    ):
        resp = await client.get(
            "/api/v1/admin/analytics/heatmap",
            headers=auth_header(admin_token),
        )
        assert resp.status_code == 200
