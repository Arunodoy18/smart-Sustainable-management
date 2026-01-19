from sqlalchemy.orm import Session
from app.models.waste import WasteEntry
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.schemas.waste import WasteClassificationInput
import os
from app.core.config import settings
from app.core.coordinator import coordinator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class WasteService:
    def __init__(self, db: Session):
        self.db = db
        self.classifier_agent = WasteClassificationAgent()

    async def upload_image(self, file_content: bytes, filename: str) -> str:
        """Upload image to local storage and return relative URL"""
        if not os.path.exists(settings.STORAGE_PATH):
            os.makedirs(settings.STORAGE_PATH)

        file_ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.STORAGE_PATH, unique_filename)

        with open(file_path, "wb") as f:
            f.write(file_content)

        # Return path relative to storage root for static serving
        return f"/storage/{unique_filename}"

    async def classify_and_record(
        self, user_id: str, image_url: str, location: Optional[dict] = None
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
            status="pending",
        )
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)

        # Step 3: Notify drivers about new pending pickup
        await coordinator.broadcast_to_role(
            "driver",
            {
                "event": "new_pickup",
                "data": {
                    "id": str(db_entry.id),
                    "waste_type": db_entry.waste_type,
                    "location": db_entry.location,
                    "created_at": db_entry.created_at.isoformat(),
                },
            },
        )

        return db_entry

    def get_user_entries(self, user_id: str, limit: int = 50) -> List[WasteEntry]:
        return (
            self.db.query(WasteEntry)
            .filter(WasteEntry.user_id == user_id)
            .order_by(WasteEntry.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_pending_pickups(self) -> List[WasteEntry]:
        return (
            self.db.query(WasteEntry)
            .filter(WasteEntry.status == "pending")
            .order_by(WasteEntry.created_at.desc())
            .all()
        )

    async def update_status(
        self,
        entry_id: str,
        status: str,
        collector_id: Optional[str] = None,
        collection_image_url: Optional[str] = None,
        driver_location: Optional[dict] = None,
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
        await coordinator.notify_user(
            str(db_entry.user_id),
            {
                "event": "status_update",
                "data": {
                    "id": str(db_entry.id),
                    "status": db_entry.status,
                    "updated_at": db_entry.updated_at.isoformat(),
                },
            },
        )

        return db_entry

    def get_analytics(self) -> Dict[str, Any]:
        from datetime import date

        entries = self.db.query(WasteEntry).all()
        total = len(entries)

        if total == 0:
            return {
                "total_entries": 0,
                "by_type": {
                    "recyclable": 0,
                    "organic": 0,
                    "e_waste": 0,
                    "hazardous": 0,
                    "general": 0,
                },
                "recycling_rate": 0,
                "avg_confidence": 0,
                "co2_saved_kg": 0,
                "energy_saved_kwh": 0,
                "pending_pickups": 0,
                "collected_today": 0,
                "points_earned": 0,
            }

        recyclable = sum(1 for e in entries if e.is_recyclable)
        collected = sum(1 for e in entries if e.status == "collected")
        pending = sum(1 for e in entries if e.status == "pending")
        avg_confidence = sum(e.confidence_score for e in entries) / total

        # Count by waste type
        by_type = {
            "recyclable": 0,
            "organic": 0,
            "e_waste": 0,
            "hazardous": 0,
            "general": 0,
        }
        for e in entries:
            if e.waste_type in by_type:
                by_type[e.waste_type] += 1

        # Count collected today
        today = date.today()
        collected_today = sum(
            1
            for e in entries
            if e.status == "collected"
            and e.collected_at
            and e.collected_at.date() == today
        )

        # Environmental impact estimates
        co2_per_recyclable = 2.5  # kg CO2 saved per recyclable item
        energy_per_recyclable = 10  # kWh saved per recyclable item
        co2_saved = recyclable * co2_per_recyclable
        energy_saved = recyclable * energy_per_recyclable

        # Points calculation
        base_points = total * 10
        recycling_bonus = recyclable * 5
        confidence_bonus = int(avg_confidence * 100)
        points_earned = base_points + recycling_bonus + confidence_bonus

        return {
            "total_entries": total,
            "by_type": by_type,
            "recycling_rate": round((recyclable / total) * 100, 1),
            "avg_confidence": round(avg_confidence, 2),
            "co2_saved_kg": round(co2_saved, 2),
            "energy_saved_kwh": round(energy_saved, 2),
            "pending_pickups": pending,
            "collected_today": collected_today,
            "points_earned": points_earned,
        }
