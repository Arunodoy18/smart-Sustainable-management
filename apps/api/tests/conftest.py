"""
Test Configuration & Fixtures
==============================

Shared fixtures for the Smart Waste AI test suite.
Uses httpx.AsyncClient with FastAPI's TestClient pattern.
"""

import asyncio
import io
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from src.core.database.base import Base
from src.core.database import get_session
from src.models.user import User, UserRole, UserStatus
from src.core.security import hash_password, create_access_token, create_refresh_token


# ---------------------------------------------------------------------------
# In-memory SQLite async engine for tests
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Session override
# ---------------------------------------------------------------------------
async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            if session.is_active:
                await session.commit()
        except Exception:
            if session.is_active:
                await session.rollback()
            raise


# ---------------------------------------------------------------------------
# App fixture
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def app() -> AsyncGenerator[FastAPI, None]:
    """Create a fresh FastAPI app with test DB for each test."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Import app and override DB dependency
    from src.main import app as _app

    _app.dependency_overrides[get_session] = override_get_session
    yield _app
    _app.dependency_overrides.clear()

    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Async HTTP client
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX async client hitting the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# DB session fixture for direct DB manipulation in tests
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        if session.is_active:
            await session.rollback()


# ---------------------------------------------------------------------------
# Pre-created users
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """A regular citizen user."""
    user = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        first_name="Test",
        last_name="User",
        hashed_password=hash_password("TestPass123!"),
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """An admin user."""
    user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        hashed_password=hash_password("AdminPass123!"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def driver_user(db_session: AsyncSession) -> User:
    """A driver user."""
    user = User(
        id=uuid.uuid4(),
        email="driver@example.com",
        first_name="Driver",
        last_name="User",
        hashed_password=hash_password("DriverPass123!"),
        role=UserRole.DRIVER,
        status=UserStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Auth token helpers
# ---------------------------------------------------------------------------
@pytest.fixture
def user_token(test_user: User) -> str:
    return create_access_token(str(test_user.id))


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(str(admin_user.id))


@pytest.fixture
def driver_token(driver_user: User) -> str:
    return create_access_token(str(driver_user.id))


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Mock ML pipeline (avoid loading real models in tests)
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def mock_ml_pipeline():
    """Prevent real ML model loading during tests."""
    with patch("src.ml.pipeline.ClassificationPipeline") as MockPipeline:
        instance = MagicMock()
        instance.initialize = AsyncMock()
        instance.classify = AsyncMock(return_value=MagicMock(
            category="recyclable",
            subcategory="plastic_bottle",
            confidence=0.92,
            confidence_tier="high",
            bin_type="BLUE",
            primary_model="mock-test",
            primary_model_version="0.0.1",
            raw_scores={"recyclable": 0.92, "organic": 0.05, "general": 0.03},
        ))
        MockPipeline.get_instance.return_value = instance
        yield instance


# ---------------------------------------------------------------------------
# Sample image bytes
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_image_bytes() -> bytes:
    """A minimal valid PNG image for upload tests."""
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="green")
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()
