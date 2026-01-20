"""
Database Session Management
===========================

Async SQLAlchemy engine and session configuration.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)

# Database URL from settings
database_url = settings.database_url

# PostgreSQL async engine with connection pooling
engine = create_async_engine(
    database_url,
    echo=settings.debug,
    pool_size=settings.database_pool_size if not settings.is_development else 5,
    max_overflow=settings.database_max_overflow if not settings.is_development else 0,
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create async engine for testing (no connection pooling)
test_engine = create_async_engine(
    database_url,
    echo=settings.debug,
    poolclass=NullPool,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides an async database session.
    
    Yields:
        AsyncSession: Database session for the request
        
    Example:
        @router.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database sessions outside of request context.
    
    Useful for background tasks and scripts.
    
    Example:
        async with get_session_context() as session:
            result = await session.execute(query)
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    from src.core.database.base import Base
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()
