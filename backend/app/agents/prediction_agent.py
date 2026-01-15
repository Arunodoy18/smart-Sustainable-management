from app.agents.base_agent import BaseAgent, AgentResponse
from pydantic import BaseModel
from typing import List, Dict
import random


class PredictionInput(BaseModel):
    bin_id: str
    historical_pickups: List[Dict]
    area_density: float


class PredictionOutput(BaseModel):
    overflow_risk: float
    predicted_time_to_full: float
    recommendation: str


class PredictionAgent(BaseAgent[PredictionInput, PredictionOutput]):
    def __init__(self):
        super().__init__(name="PredictionAgent")

    async def process(
        self, input_data: PredictionInput
    ) -> AgentResponse[PredictionOutput]:
        self.log_activity(f"Predicting overflow for bin {input_data.bin_id}")

        # Simulated prediction logic based on area density and history
        risk = min(0.99, input_data.area_density * random.uniform(0.5, 1.2))
        time_to_full = random.uniform(2, 24)  # hours

        recommendation = "Normal schedule"
        if risk > 0.8:
            recommendation = "Immediate pickup reassignment triggered."
        elif risk > 0.5:
            recommendation = "Schedule pickup within 12 hours."

        output = PredictionOutput(
            overflow_risk=risk,
            predicted_time_to_full=time_to_full,
            recommendation=recommendation,
        )

        return AgentResponse(
            success=True,
            data=output,
            confidence=0.85,
            reasoning=f"Risk calculated based on density {input_data.area_density} and seasonal trends.",
        )
