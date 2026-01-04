from sqlalchemy.orm import Session
from app.models.waste import WasteEntry
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.agents.segregation_agent import SegregationAgent
from app.agents.recommendation_agent import RecommendationAgent, RecommendationInput
from app.schemas.waste import WasteClassificationInput
from typing import Optional, List, Dict
from datetime import datetime

class WasteService:
    def __init__(self, db: Session):
        self.db = db
        self.classifier_agent = WasteClassificationAgent()
        self.segregation_agent = SegregationAgent()
        self.recommendation_agent = RecommendationAgent()

    async def classify_and_record(self, user_id: int, image_url: str, location: Optional[dict] = None) -> Dict:
        """
        Full pipeline: Classify → Segregate → Recommend → Record
        This is the core intelligence of the system.
        """
        # Step 1: Classify and segregate
        input_data = WasteClassificationInput(user_id=user_id, image_url=image_url)
        segregation_response = await self.segregation_agent.process(input_data)
        
        if not segregation_response.success:
            raise Exception(f"Classification failed: {segregation_response.error}")
        
        # Step 2: Generate recommendations based on classification + confidence
        recommendation_input = RecommendationInput(
            waste_category=segregation_response.metadata.get("category", "unknown"),
            confidence=segregation_response.confidence,
            is_recyclable=segregation_response.metadata.get("is_recyclable", False),
            risk_level=segregation_response.metadata.get("risk_level", "medium"),
            requires_special_handling=segregation_response.metadata.get("requires_special_handling", False),
            detected_objects=segregation_response.data.detected_objects
        )
        
        recommendation_response = await self.recommendation_agent.process(recommendation_input)
        
        if not recommendation_response.success:
            raise Exception(f"Recommendation generation failed: {recommendation_response.error}")
        
        # Step 3: Record in database with full intelligence
        db_entry = WasteEntry(
            user_id=user_id,
            waste_type=segregation_response.metadata.get("category", "unknown"),
            confidence_score=segregation_response.confidence,
            image_url=image_url,
            location=location,
            
            # Segregation data
            is_recyclable=segregation_response.metadata.get("is_recyclable", False),
            requires_special_handling=segregation_response.metadata.get("requires_special_handling", False),
            risk_level=segregation_response.metadata.get("risk_level", "medium"),
            
            # Recommendations
            recommended_action=recommendation_response.data.action,
            instructions=recommendation_response.data.instructions,
            collection_type=recommendation_response.data.collection_type,
            impact_note=recommendation_response.data.impact_note,
            
            status="pending"
        )
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        
        # Return comprehensive response
        return {
            "waste_entry": {
                "id": db_entry.id,
                "user_id": db_entry.user_id,
                "waste_type": db_entry.waste_type,
                "confidence": db_entry.confidence_score,
                "is_recyclable": db_entry.is_recyclable,
                "risk_level": db_entry.risk_level,
                "status": db_entry.status,
                "created_at": db_entry.created_at.isoformat()
            },
            "classification": {
                "category": segregation_response.metadata.get("category"),
                "detected_objects": segregation_response.data.detected_objects,
                "confidence": segregation_response.confidence,
                "reasoning": segregation_response.reasoning
            },
            "recommendation": {
                "action": recommendation_response.data.action,
                "instructions": recommendation_response.data.instructions,
                "collection_type": recommendation_response.data.collection_type,
                "impact": recommendation_response.data.impact_note,
                "confidence_message": recommendation_response.data.confidence_message
            }
        }

    def get_user_entries(self, user_id: int, limit: int = 50) -> List[WasteEntry]:
        return self.db.query(WasteEntry)\
            .filter(WasteEntry.user_id == user_id)\
            .order_by(WasteEntry.created_at.desc())\
            .limit(limit)\
            .all()
    
    def get_entry_by_id(self, entry_id: int) -> Optional[WasteEntry]:
        return self.db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()

    def update_collection_status(
        self, 
        entry_id: int, 
        collector_id: int, 
        collection_image_url: Optional[str] = None
    ) -> Optional[WasteEntry]:
        """
        Driver collection verification - creates accountability trail
        """
        db_entry = self.db.query(WasteEntry).filter(WasteEntry.id == entry_id).first()
        if db_entry:
            db_entry.status = "collected"
            db_entry.collected_by = collector_id
            db_entry.collected_at = datetime.utcnow()
            if collection_image_url:
                db_entry.collection_image_url = collection_image_url
            self.db.commit()
            self.db.refresh(db_entry)
        return db_entry
    
    def get_analytics(self, user_id: Optional[int] = None) -> Dict:
        """
        Generate analytics for dashboard
        """
        query = self.db.query(WasteEntry)
        if user_id:
            query = query.filter(WasteEntry.user_id == user_id)
        
        entries = query.all()
        
        # Calculate statistics
        total_entries = len(entries)
        recyclable_count = sum(1 for e in entries if e.is_recyclable)
        collected_count = sum(1 for e in entries if e.status == "collected")
        
        # Category breakdown
        category_counts = {}
        for entry in entries:
            category_counts[entry.waste_type] = category_counts.get(entry.waste_type, 0) + 1
        
        # Average confidence
        avg_confidence = sum(e.confidence_score for e in entries) / total_entries if total_entries > 0 else 0
        
        return {
            "total_waste_entries": total_entries,
            "recyclable_count": recyclable_count,
            "collected_count": collected_count,
            "pending_count": total_entries - collected_count,
            "recycling_rate": round(recyclable_count / total_entries * 100, 1) if total_entries > 0 else 0,
            "average_confidence": round(avg_confidence, 2),
            "category_breakdown": category_counts
        }
