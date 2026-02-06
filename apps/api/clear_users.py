"""
Clear all users from database
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

# Import from your app
import sys
sys.path.insert(0, 'src')

from src.core.config import settings
from src.models.user import User

async def clear_users():
    """Delete all users from database."""
    # Create engine
    engine = create_async_engine(settings.async_database_url)
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Delete all users
        result = await session.execute(delete(User))
        await session.commit()
        
        print(f"✅ Deleted {result.rowcount} users from database")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clear_users())
