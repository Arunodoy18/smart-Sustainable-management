from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class WasteEntry(Base):
    __tablename__ = "waste_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default="uuid_generate_v4()")
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    waste_type = Column(String, index=True)
    confidence_score = Column(Float)
    image_url = Column(String)
    location = Column(JSON)
    
    # Classification details
    is_recyclable = Column(Boolean, default=False)
    requires_special_handling = Column(Boolean, default=False)
    risk_level = Column(String, default="low")
    
    # Recommendations
    recommended_action = Column(String)
    instructions = Column(JSON)
    collection_type = Column(String)
    impact_note = Column(Text)
    
    # Status tracking
    status = Column(String, default="pending")
    collected_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    collection_image_url = Column(String, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    
    # Real-time tracking
    driver_location = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("Profile", foreign_keys=[user_id], backref="waste_entries")
    collector = relationship("Profile", foreign_keys=[collected_by])
