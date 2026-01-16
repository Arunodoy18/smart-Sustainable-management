import os
import pytest

# Set test environment before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = os.environ.get(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/test_db"
)
os.environ["OPENAI_API_KEY"] = "sk-test-mock-key"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
