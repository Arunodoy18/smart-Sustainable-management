from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from uuid import UUID


class WasteType(str, Enum):
    RECYCLABLE = "recyclable"
    ORGANIC = "organic"
    E_WASTE = "e_waste"
    HAZARDOUS = "hazardous"
    GENERAL = "general"


class WasteClassificationInput(BaseModel):
    image_url: Optional[str] = None
    user_id: Optional[UUID] = None
    location: Optional[Dict[str, float]] = None


class WasteClassificationOutput(BaseModel):
    waste_type: str
    confidence_score: float
    detected_objects: List[str]
    is_recyclable: bool
    requires_special_handling: bool
    risk_level: str
    recommended_action: str
    instructions: List[str]
    collection_type: str
    impact_note: str


class WasteEntryCreate(BaseModel):
    image_url: str
    location: Optional[Dict[str, float]] = None


class WasteEntryUpdate(BaseModel):
    status: str
    collected_by: Optional[UUID] = None
    collection_image_url: Optional[str] = None
    collected_at: Optional[datetime] = None


class WasteEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    waste_type: str
    confidence_score: float
    image_url: str
    location: Optional[Dict[str, Any]] = None
    is_recyclable: bool
    risk_level: str
    recommended_action: str
    instructions: List[str]
    collection_type: str
    impact_note: str
    status: str
    collected_by: Optional[UUID] = None
    collection_image_url: Optional[str] = None
    collected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
