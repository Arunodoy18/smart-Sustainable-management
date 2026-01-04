from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class WasteEntry(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    waste_type = Column(String, index=True) # plastic, organic, glass, metal, e-waste, biomedical
    confidence_score = Column(Float)
    image_url = Column(String)
    location = Column(JSON) # {lat: ..., lng: ...}
    
    # Classification details
    is_recyclable = Column(Boolean, default=False)
    requires_special_handling = Column(Boolean, default=False)
    risk_level = Column(String) # low, medium, high, critical
    
    # Recommendations
    recommended_action = Column(String) # recycle, compost, dispose, manual_review
    instructions = Column(JSON) # List of step-by-step instructions
    collection_type = Column(String) # scheduled_recyclable, organic, general, hazardous
    impact_note = Column(Text) # Environmental impact description
    
    # Status tracking
    status = Column(String, default="pending") # pending, collected, verified
    collected_by = Column(Integer, ForeignKey("user.id"), nullable=True)
    collection_image_url = Column(String, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], backref="waste_entries")
    collector = relationship("User", foreign_keys=[collected_by])
