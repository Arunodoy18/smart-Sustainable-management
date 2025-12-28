from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.waste_classifier_agent import WasteClassificationAgent
from app.schemas.waste import PickupVerificationInput, PickupVerificationOutput, WasteClassificationInput, WasteType
import random

class CollectionAgent(BaseAgent[PickupVerificationInput, PickupVerificationOutput]):
    def __init__(self):
        super().__init__(name="CollectionAgent")
        self.classifier = WasteClassificationAgent()

    async def process(self, input_data: PickupVerificationInput) -> AgentResponse[PickupVerificationOutput]:
        self.log_activity(f"Verifying pickup {input_data.pickup_id} by driver {input_data.driver_id}")
        
        # Step 1: Call Waste Classifier to see what's actually in the bin
        classification_input = WasteClassificationInput(
            image_url=input_data.bin_image_url,
            user_id=input_data.driver_id,
            location="collection_point"
        )
        
        classifier_response = await self.classifier.process(classification_input)
        
        if not classifier_response.success:
            return AgentResponse(success=False, error="Failed to classify waste during verification")

        actual_type = classifier_response.data.waste_type
        is_verified = actual_type == input_data.waste_type_expected
        
        # Logic for rewards and penalties
        reward_points = 0
        penalty_applied = False
        
        if is_verified:
            reward_points = 10 if classifier_response.data.is_segregation_correct else 5
        else:
            penalty_applied = True
            self.log_activity(f"Violation: Expected {input_data.waste_type_expected}, got {actual_type}", level="WARNING")

        output = PickupVerificationOutput(
            verified=is_verified,
            actual_waste_type=actual_type,
            completeness_score=classifier_response.confidence,
            penalty_applied=penalty_applied,
            reward_points=reward_points
        )

        reasoning = "Pickup matches expected waste type." if is_verified else "Waste type mismatch detected."
        
        return AgentResponse(
            success=True,
            data=output,
            confidence=classifier_response.confidence,
            reasoning=reasoning,
            metadata={"classifier_metadata": classifier_response.metadata}
        )
