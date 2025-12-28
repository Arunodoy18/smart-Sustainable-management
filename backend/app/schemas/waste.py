from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class WasteType(str, Enum):
    ORGANIC = "organic"
    RECYCLABLE = "recyclable"
    HAZARDOUS = "hazardous"
    E_WASTE = "e-waste"
    UNKNOWN = "unknown"

class WasteClassificationInput(BaseModel):
    image_url: str
    user_id: str
    location: Optional[str] = None

class WasteClassificationOutput(BaseModel):
    waste_type: WasteType
    confidence: float
    detected_objects: List[str]
    is_segregation_correct: bool
    violation_details: Optional[str] = None

class PickupVerificationInput(BaseModel):
    pickup_id: str
    driver_id: str
    bin_image_url: str
    waste_type_expected: WasteType

class PickupVerificationOutput(BaseModel):
    verified: bool
    actual_waste_type: WasteType
    completeness_score: float
    penalty_applied: bool = False
    reward_points: int = 0
