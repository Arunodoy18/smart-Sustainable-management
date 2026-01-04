from sqlalchemy import Boolean, Column, Integer, String, DateTime, Float
from datetime import datetime
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    role = Column(String, default="user") # user, driver, admin
    
    # Profile details
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Gamification
    points = Column(Integer, default=0)
    recycling_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
