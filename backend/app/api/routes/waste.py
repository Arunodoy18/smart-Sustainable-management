from fastapi import APIRouter, HTTPException, Depends
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput, PickupVerificationInput, PickupVerificationOutput
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.agents.collection_agent import CollectionAgent
from app.agents.base_agent import AgentResponse

router = APIRouter()

# Instantiate agents
classifier_agent = WasteClassificationAgent()
collection_agent = CollectionAgent()

@router.post("/classify", response_model=AgentResponse[WasteClassificationOutput])
async def classify_waste(input_data: WasteClassificationInput):
    """
    Classify waste from an image for households or drivers.
    """
    response = await classifier_agent.process(input_data)
    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)
    return response

@router.post("/verify-pickup", response_model=AgentResponse[PickupVerificationOutput])
async def verify_pickup(input_data: PickupVerificationInput):
    """
    Verify waste collection pickup by a driver.
    """
    response = await collection_agent.process(input_data)
    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)
    return response
