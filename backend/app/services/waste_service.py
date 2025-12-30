from sqlalchemy.orm import Session
from app.models.waste import WasteEntry
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.schemas.waste import WasteClassificationInput
from typing import Optional, List

class WasteService:
    def __init__(self, db: Session):
        self.db = db
        self.agent = WasteClassificationAgent()

    async def classify_and_record(self, user_id: int, image_url: str, location: Optional[dict] = None) -> WasteEntry:
        # 1. Use Agent to classify
        input_data = WasteClassificationInput(user_id=user_id, image_url=image_url)
        response = await self.agent.process(input_data)
        
        if not response.success:
            raise Exception(f"Classification failed: {response.error}")

        # 2. Record in database
        db_entry = WasteEntry(
            user_id=user_id,
            waste_type=response.data.waste_type.value,
            confidence_score=response.confidence,
            image_url=image_url,
            location=location,
            status="pending"
        )
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        
        return db_entry

    def get_user_entries(self, user_id: int) -> List[WasteEntry]:
        return self.db.query(WasteEntry).filter(WasteEntry.user_id == user_id).all()

    def update_status(self, entry_id: int, status: str) -> Optional[WasteEntry]:
        db_entry = self.db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
        if db_entry:
            db_entry.status = status
            self.db.commit()
            self.db.refresh(db_entry)
        return db_entry
