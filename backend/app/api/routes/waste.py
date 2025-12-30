from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput, PickupVerificationInput, PickupVerificationOutput
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.agents.collection_agent import CollectionAgent
from app.agents.base_agent import AgentResponse
from app.services.waste_service import WasteService
from app.api.deps import get_db
from typing import List

router = APIRouter()

@router.post("/classify", response_model=AgentResponse[WasteClassificationOutput])
async def classify_waste(input_data: WasteClassificationInput, db: Session = Depends(get_db)):
    """
    Classify waste from an image and record it in the database.
    """
    try:
        service = WasteService(db)
        entry = await service.classify_and_record(
            user_id=input_data.user_id,
            image_url=input_data.image_url
        )
        # We still return the agent response format for compatibility
        # In a real app, you might want to return the entry or a custom response
        response = await service.agent.process(input_data)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entries/{user_id}")
async def get_entries(user_id: int, db: Session = Depends(get_db)):
    service = WasteService(db)
    return service.get_user_entries(user_id)
