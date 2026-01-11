from sqlalchemy.orm import Session
from app.models.waste import WasteEntry
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.schemas.waste import WasteClassificationInput
from app.core.supabase import supabase
from app.core.coordinator import coordinator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
import uuid

class WasteService:
    def __init__(self, db: Session):
        self.db = db
        self.classifier_agent = WasteClassificationAgent()

    async def upload_image(self, file_content: bytes, filename: str) -> str:
        """Upload image to Supabase Storage and return public URL"""
        path = f"uploads/{uuid.uuid4()}_{filename}"
        res = supabase.storage.from_("waste-images").upload(
            path, 
            file_content,
            {"content-type": "image/jpeg"}
        )
        # Get public URL
        url_res = supabase.storage.from_("waste-images").get_public_url(path)
        return url_res

    async def classify_and_record(
        self, 
        user_id: UUID, 
        image_url: str, 
        location: Optional[dict] = None
    ) -> WasteEntry:
        # Step 1: Classify
        input_data = WasteClassificationInput(user_id=user_id, image_url=image_url)
        agent_res = await self.classifier_agent.process(input_data)
        
        if not agent_res.success:
            raise Exception(f"Classification failed: {agent_res.error}")
        
        data = agent_res.data
        
        # Step 2: Record in database
        db_entry = WasteEntry(
            user_id=user_id,
            waste_type=data.waste_type,
            confidence_score=data.confidence_score,
            image_url=image_url,
            location=location,
            
            is_recyclable=data.is_recyclable,
            requires_special_handling=data.requires_special_handling,
            risk_level=data.risk_level,
            
            recommended_action=data.recommended_action,
            instructions=data.instructions,
            collection_type=data.collection_type,
            impact_note=data.impact_note,
            
            status="pending"
        )
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        
        # Step 3: Notify drivers about new pending pickup
        await coordinator.broadcast_to_role("driver", {
            "event": "new_pickup",
            "data": {
                "id": str(db_entry.id),
                "waste_type": db_entry.waste_type,
                "location": db_entry.location,
                "created_at": db_entry.created_at.isoformat()
            }
        })
        
        return db_entry

    def get_user_entries(self, user_id: UUID, limit: int = 50) -> List[WasteEntry]:
        return self.db.query(WasteEntry)\
            .filter(WasteEntry.user_id == user_id)\
            .order_by(WasteEntry.created_at.desc())\
            .limit(limit)\
            .all()

    def get_pending_pickups(self) -> List[WasteEntry]:
        return self.db.query(WasteEntry)\
            .filter(WasteEntry.status == "pending")\
            .order_by(WasteEntry.created_at.desc())\
            .all()

    async def update_status(
        self, 
        entry_id: UUID, 
        status: str, 
        collector_id: Optional[UUID] = None,
        collection_image_url: Optional[str] = None,
        driver_location: Optional[dict] = None
    ) -> WasteEntry:
        db_entry = self.db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
        if not db_entry:
            raise Exception("Entry not found")
            
        db_entry.status = status
        if collector_id:
            db_entry.collected_by = collector_id
        if collection_image_url:
            db_entry.collection_image_url = collection_image_url
            db_entry.collected_at = datetime.utcnow()
        if driver_location:
            db_entry.driver_location = driver_location
            
        self.db.commit()
        self.db.refresh(db_entry)
        
        # Notify user about status change
        await coordinator.notify_user(str(db_entry.user_id), {
            "event": "status_update",
            "data": {
                "id": str(db_entry.id),
                "status": db_entry.status,
                "updated_at": db_entry.updated_at.isoformat()
            }
        })
        
        return db_entry

    def get_analytics(self) -> Dict[str, Any]:
        entries = self.db.query(WasteEntry).all()
        total = len(entries)
        if total == 0:
            return {"total": 0}
            
        recyclable = sum(1 for e in entries if e.is_recyclable)
        collected = sum(1 for e in entries if e.status == "collected")
        
        category_dist = {}
        for e in entries:
            category_dist[e.waste_type] = category_dist.get(e.waste_type, 0) + 1
            
        return {
            "total_entries": total,
            "recycling_rate": round((recyclable / total) * 100, 1),
            "collection_efficiency": round((collected / total) * 100, 1) if total > 0 else 0,
            "category_distribution": category_dist,
            "impact_summary": "Prevented approx. 2.5 tons of CO2 emissions this month."
        }
