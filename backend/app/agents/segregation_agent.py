from app.agents.base_agent import BaseAgent, AgentResponse
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput
from app.agents.waste_classifier_agent import WasteClassificationAgent

class SegregationAgent(BaseAgent[WasteClassificationInput, WasteClassificationOutput]):
    def __init__(self):
        super().__init__(name="SegregationAgent")
        self.classifier = WasteClassificationAgent()

    async def process(self, input_data: WasteClassificationInput) -> AgentResponse[WasteClassificationOutput]:
        self.log_activity(f"Validating segregation for user {input_data.user_id}")
        
        # Internal call to classifier for base data
        response = await self.classifier.process(input_data)
        
        if response.success and not response.data.is_segregation_correct:
            response.reasoning = f"Segregation violation detected: {response.data.violation_details}"
            
        return response
