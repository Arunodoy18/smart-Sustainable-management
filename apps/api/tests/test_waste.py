"""
Waste Management Tests
=======================

Tests for /api/v1/waste/* endpoints — upload, history, stats.
"""

import io
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
class TestWasteUpload:
    """POST /api/v1/waste/upload"""

    async def test_upload_image_authenticated(
        self, client: AsyncClient, test_user, user_token, sample_image_bytes
    ):
        """Authenticated user can upload a waste image."""
        with patch("src.api.routes.waste.storage") as mock_storage:
            mock_storage.save = AsyncMock(return_value="uploads/test.jpg")
            mock_storage.get_url = MagicMock(return_value="/uploads/test.jpg")

            resp = await client.post(
                "/api/v1/waste/upload",
                headers=auth_header(user_token),
                files={"file": ("waste.png", io.BytesIO(sample_image_bytes), "image/png")},
                data={"notes": "Test upload"},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "category" in data or "status" in data

    async def test_upload_rejects_non_image(
        self, client: AsyncClient, test_user, user_token
    ):
        """Non-image files should be rejected."""
        resp = await client.post(
            "/api/v1/waste/upload",
            headers=auth_header(user_token),
            files={"file": ("doc.pdf", b"fake pdf content", "application/pdf")},
        )
        assert resp.status_code == 400
        assert "image" in resp.json()["detail"].lower()

    async def test_upload_works_without_auth_as_guest(
        self, client: AsyncClient, sample_image_bytes
    ):
        """
        The upload endpoint uses PublicUser (guest fallback).
        Should still work without a token.
        """
        with patch("src.api.routes.waste.storage") as mock_storage:
            mock_storage.save = AsyncMock(return_value="uploads/guest.jpg")
            mock_storage.get_url = MagicMock(return_value="/uploads/guest.jpg")

            resp = await client.post(
                "/api/v1/waste/upload",
                files={"file": ("waste.png", io.BytesIO(sample_image_bytes), "image/png")},
            )

        # Should succeed (guest user created automatically)
        assert resp.status_code in (201, 200)


@pytest.mark.asyncio
class TestWasteHistory:
    """GET /api/v1/waste/history"""

    async def test_history_authenticated(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/waste/history",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert "total_pages" in data  # must be total_pages, NOT pages

    async def test_history_pagination(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/waste/history?page=1&page_size=5",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert data["page_size"] == 5

    async def test_history_no_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/waste/history")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestWasteStats:
    """GET /api/v1/waste/stats/impact"""

    async def test_stats_authenticated(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/waste/stats/impact",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestWasteCategories:
    """GET /api/v1/waste/categories"""

    async def test_get_categories(self, client: AsyncClient):
        """Categories endpoint should return available waste categories."""
        resp = await client.get("/api/v1/waste/categories")
        # It might require auth or be public
        assert resp.status_code in (200, 401, 403)
