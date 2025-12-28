from app.agents.base_agent import BaseAgent, AgentResponse
from pydantic import BaseModel
import random

class RecommendationInput(BaseModel):
    user_id: str
    waste_history: list

class RecommendationOutput(BaseModel):
    suggestions: list
    impact_score: float

class RecommendationAgent(BaseAgent[RecommendationInput, RecommendationOutput]):
    def __init__(self):
        super().__init__(name="RecommendationAgent")

    async def process(self, input_data: RecommendationInput) -> AgentResponse[RecommendationOutput]:
        self.log_activity(f"Generating recommendations for user {input_data.user_id}")
        
        suggestions = [
            "Use compostable bags for organic waste.",
            "Rinse plastic containers before recycling.",
            "Schedule a hazardous waste pickup for old batteries."
        ]
        
        return AgentResponse(
            success=True,
            data=RecommendationOutput(suggestions=suggestions, impact_score=0.9),
            reasoning="Personalized suggestions based on recent disposal patterns."
        )
