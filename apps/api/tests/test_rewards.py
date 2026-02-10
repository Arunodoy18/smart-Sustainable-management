"""
Rewards Endpoint Tests
=======================

Tests for /api/v1/rewards/* endpoints.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
class TestRewardsSummary:
    """GET /api/v1/rewards/summary"""

    async def test_get_summary(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/rewards/summary",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200

    async def test_summary_no_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/rewards/summary")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestRewardsHistory:
    """GET /api/v1/rewards/history"""

    async def test_get_history(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/rewards/history",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total_pages" in data


@pytest.mark.asyncio
class TestLeaderboard:
    """GET /api/v1/rewards/leaderboard"""

    async def test_get_leaderboard(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/rewards/leaderboard",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestAchievements:
    """GET /api/v1/rewards/achievements"""

    async def test_get_achievements(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.get(
            "/api/v1/rewards/achievements",
            headers=auth_header(user_token),
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestDailyClaim:
    """POST /api/v1/rewards/claim-daily"""

    async def test_claim_daily(
        self, client: AsyncClient, test_user, user_token
    ):
        resp = await client.post(
            "/api/v1/rewards/claim-daily",
            headers=auth_header(user_token),
        )
        # 200 or 400 (already claimed today)
        assert resp.status_code in (200, 400)
