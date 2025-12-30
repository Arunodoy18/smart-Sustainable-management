import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_classify_waste():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "user_id": 1,
            "image_url": "https://example.com/waste.jpg"
        }
        response = await ac.post("/api/v1/waste/classify", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "waste_type" in data["data"]

@pytest.mark.asyncio
async def test_get_entries():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/waste/entries/1")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
