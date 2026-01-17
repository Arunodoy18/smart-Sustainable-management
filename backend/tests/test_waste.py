import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify health check endpoint is accessible."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_healthz_endpoint():
    """Verify Kubernetes-style health check endpoint is accessible."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/healthz")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_api_health_shortpath():
    """Verify /api/health endpoint is accessible (for proxy configs)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_api_health_endpoint():
    """Verify API health check endpoint is accessible."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_signup_endpoint_exists():
    """Verify signup endpoint exists and validates input."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/signup", json={})

    # Should return 422 (validation error) not 404 (not found)
    assert response.status_code != 404, "Signup endpoint not found"
    assert response.status_code in [422, 400, 500]


@pytest.mark.asyncio
async def test_login_endpoint_exists():
    """Verify login endpoint exists and validates input."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login/access-token", data={"username": "", "password": ""}
        )

    # Should return 400/422 (bad credentials/validation) not 404 (not found)
    assert response.status_code != 404, "Login endpoint not found"
    assert response.status_code in [400, 422, 500]


@pytest.mark.asyncio
async def test_me_endpoint_requires_auth():
    """Verify /me endpoint requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/me")

    # Should return 401 (unauthorized) not 404 (not found)
    assert response.status_code == 401, "Expected 401 for unauthenticated request"


@pytest.mark.asyncio
async def test_classify_requires_auth():
    """Verify waste classification requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("test_image.jpg", b"fake_image_content", "image/jpeg")}
        response = await ac.post("/api/v1/waste/classify", files=files)

    # Should return 401 for unauthenticated access
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify root endpoint returns API info."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_google_auth_endpoint_exists():
    """Verify Google OAuth endpoint exists and validates input."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/google", json={})

    # Should return 422 (validation error) not 404 (not found)
    assert response.status_code != 404, "Google auth endpoint not found"
    assert response.status_code in [422, 400, 500]
