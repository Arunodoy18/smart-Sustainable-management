from app.db.session import engine
from app.db.base_class import Base
from app.models.user import User
from app.models.waste import WasteEntry
from app.core.logger import logger

def init_db():
    """Initialize database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
