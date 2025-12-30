from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class WasteEntry(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    waste_type = Column(String, index=True) # plastic, organic, etc.
    confidence_score = Column(Float)
    image_url = Column(String)
    location = Column(JSON) # {lat: ..., lng: ...}
    status = Column(String, default="pending") # pending, collected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="waste_entries")
