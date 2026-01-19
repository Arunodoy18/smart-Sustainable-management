from sqlalchemy import Boolean, Column, String, DateTime, Float, ForeignKey, Integer
from datetime import datetime
import uuid
from app.db.base_class import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # user, driver, admin
    is_active = Column(Boolean(), default=True)

    # Profile details
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Gamification
    points = Column(Integer, default=0)
    recycling_score = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
