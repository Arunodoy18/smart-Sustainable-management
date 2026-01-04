from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput
from app.services.waste_service import WasteService
from app.api.deps import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class WasteSubmitRequest(BaseModel):
    user_id: int
    image_url: str
    location: Optional[dict] = None

class CollectionRequest(BaseModel):
    entry_id: int
    collector_id: int
    collection_image_url: Optional[str] = None

@router.post("/classify")
async def classify_waste(request: WasteSubmitRequest, db: Session = Depends(get_db)):
    """
    Full intelligence pipeline: Classify → Segregate → Recommend → Record
    Returns comprehensive waste analysis with confidence-aware recommendations.
    """
    try:
        service = WasteService(db)
        result = await service.classify_and_record(
            user_id=request.user_id,
            image_url=request.image_url,
            location=request.location
        )
        return {
            "success": True,
            "message": "Waste classified and recorded successfully",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entries/{user_id}")
async def get_user_entries(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """
    Get waste entry history for a specific user
    """
    try:
        service = WasteService(db)
        entries = service.get_user_entries(user_id, limit)
        return {
            "success": True,
            "count": len(entries),
            "entries": [
                {
                    "id": e.id,
                    "waste_type": e.waste_type,
                    "confidence": e.confidence_score,
                    "is_recyclable": e.is_recyclable,
                    "risk_level": e.risk_level,
                    "recommended_action": e.recommended_action,
                    "collection_type": e.collection_type,
                    "status": e.status,
                    "created_at": e.created_at.isoformat(),
                    "collected_at": e.collected_at.isoformat() if e.collected_at else None
                }
                for e in entries
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entry/{entry_id}")
async def get_entry_detail(entry_id: int, db: Session = Depends(get_db)):
    """
    Get full details of a specific waste entry
    """
    try:
        service = WasteService(db)
        entry = service.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        return {
            "success": True,
            "entry": {
                "id": entry.id,
                "user_id": entry.user_id,
                "waste_type": entry.waste_type,
                "confidence": entry.confidence_score,
                "image_url": entry.image_url,
                "location": entry.location,
                "is_recyclable": entry.is_recyclable,
                "requires_special_handling": entry.requires_special_handling,
                "risk_level": entry.risk_level,
                "recommended_action": entry.recommended_action,
                "instructions": entry.instructions,
                "collection_type": entry.collection_type,
                "impact_note": entry.impact_note,
                "status": entry.status,
                "collected_by": entry.collected_by,
                "collection_image_url": entry.collection_image_url,
                "created_at": entry.created_at.isoformat(),
                "collected_at": entry.collected_at.isoformat() if entry.collected_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collect")
async def mark_collected(request: CollectionRequest, db: Session = Depends(get_db)):
    """
    Driver collection verification - creates accountability trail
    """
    try:
        service = WasteService(db)
        entry = service.update_collection_status(
            entry_id=request.entry_id,
            collector_id=request.collector_id,
            collection_image_url=request.collection_image_url
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        return {
            "success": True,
            "message": "Collection verified successfully",
            "entry": {
                "id": entry.id,
                "status": entry.status,
                "collected_by": entry.collected_by,
                "collected_at": entry.collected_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_analytics(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get waste management analytics
    Optionally filter by user_id, otherwise return system-wide stats
    """
    try:
        service = WasteService(db)
        analytics = service.get_analytics(user_id)
        return {
            "success": True,
            "analytics": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    API health check
    """
    return {"status": "healthy", "service": "waste-management-api"}
