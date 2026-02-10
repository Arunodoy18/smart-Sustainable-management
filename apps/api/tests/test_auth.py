"""
Authentication Tests
====================

Tests for /api/v1/auth/* endpoints.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
class TestRegistration:
    """POST /api/v1/auth/register"""

    async def test_register_success(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "new@example.com",
                "password": "SecurePass123!",
                "first_name": "New",
                "last_name": "User",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["first_name"] == "New"
        assert "hashed_password" not in data  # must never leak

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "testuser@example.com",  # already exists via fixture
                "password": "AnotherPass123!",
                "first_name": "Dupe",
                "last_name": "User",
            },
        )
        assert resp.status_code == 400

    async def test_register_weak_password(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@example.com",
                "password": "short",
                "first_name": "Weak",
                "last_name": "Pass",
            },
        )
        assert resp.status_code == 422  # validation error

    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "GoodPass123!",
                "first_name": "Bad",
                "last_name": "Email",
            },
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    """POST /api/v1/auth/login"""

    async def test_login_success(self, client: AsyncClient, test_user):
        resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "testuser@example.com",
                "password": "TestPass123!",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "testuser@example.com",
                "password": "WrongPass123!",
            },
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "ghost@example.com",
                "password": "Whatever123!",
            },
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestMe:
    """GET /api/v1/auth/me"""

    async def test_get_me_authenticated(self, client: AsyncClient, test_user, user_token):
        resp = await client.get("/api/v1/auth/me", headers=auth_header(user_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "testuser@example.com"

    async def test_get_me_no_token(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)

    async def test_get_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            "/api/v1/auth/me",
            headers=auth_header("invalid.token.here"),
        )
        assert resp.status_code == 401

    async def test_update_profile(self, client: AsyncClient, test_user, user_token):
        resp = await client.patch(
            "/api/v1/auth/me",
            headers=auth_header(user_token),
            json={"first_name": "Updated"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["first_name"] == "Updated"


@pytest.mark.asyncio
class TestTokenRefresh:
    """POST /api/v1/auth/refresh"""

    async def test_refresh_with_valid_token(self, client: AsyncClient, test_user):
        # First login to get refresh token
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "testuser@example.com",
                "password": "TestPass123!",
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "bogus-token"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestPasswordChange:
    """POST /api/v1/auth/password/change"""

    async def test_change_password(self, client: AsyncClient, test_user, user_token):
        resp = await client.post(
            "/api/v1/auth/password/change",
            headers=auth_header(user_token),
            json={
                "current_password": "TestPass123!",
                "new_password": "NewSecurePass456!",
            },
        )
        assert resp.status_code == 200

    async def test_change_password_wrong_current(self, client: AsyncClient, test_user, user_token):
        resp = await client.post(
            "/api/v1/auth/password/change",
            headers=auth_header(user_token),
            json={
                "current_password": "WrongCurrent123!",
                "new_password": "NewSecurePass456!",
            },
        )
        assert resp.status_code in (400, 401)
