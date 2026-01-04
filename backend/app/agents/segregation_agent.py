from typing import Dict
from app.agents.base_agent import BaseAgent, AgentResponse
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput
from app.agents.waste_classifier_agent import WasteClassificationAgent

class SegregationAgent(BaseAgent[WasteClassificationInput, WasteClassificationOutput]):
    """
    Determines if waste is recyclable and what special handling is required.
    Maps waste categories to segregation rules.
    """
    def __init__(self):
        super().__init__(name="SegregationAgent")
        self.classifier = WasteClassificationAgent()
        
        # Segregation knowledge base
        self.segregation_rules = {
            "plastic": {
                "recyclable": True,
                "special_handling": True,
                "risk_level": "medium",
                "notes": "Must be cleaned and dried before recycling"
            },
            "organic": {
                "recyclable": True,
                "special_handling": False,
                "risk_level": "low",
                "notes": "Compostable, keep separate from recyclables"
            },
            "glass": {
                "recyclable": True,
                "special_handling": True,
                "risk_level": "medium",
                "notes": "Handle carefully, separate by color if possible"
            },
            "metal": {
                "recyclable": True,
                "special_handling": False,
                "risk_level": "low",
                "notes": "High scrap value, easy to recycle"
            },
            "e-waste": {
                "recyclable": False,
                "special_handling": True,
                "risk_level": "high",
                "notes": "Requires certified e-waste disposal facility"
            },
            "biomedical": {
                "recyclable": False,
                "special_handling": True,
                "risk_level": "critical",
                "notes": "HAZARDOUS - Requires specialized medical waste disposal"
            }
        }

    async def process(self, input_data: WasteClassificationInput) -> AgentResponse[WasteClassificationOutput]:
        self.log_activity(f"Analyzing segregation requirements for user {input_data.user_id}")
        
        # Get classification from classifier agent
        classification_response = await self.classifier.process(input_data)
        
        if not classification_response.success:
            return classification_response
        
        # Get detected category from metadata
        category = classification_response.metadata.get("category", "unknown")
        
        # Apply segregation rules
        rules = self.segregation_rules.get(category, {
            "recyclable": False,
            "special_handling": True,
            "risk_level": "medium",
            "notes": "Unknown waste type - manual inspection required"
        })
        
        # Enhance response with segregation metadata
        enhanced_metadata = {
            **classification_response.metadata,
            "is_recyclable": rules["recyclable"],
            "requires_special_handling": rules["special_handling"],
            "risk_level": rules["risk_level"],
            "segregation_notes": rules["notes"]
        }
        
        # Update reasoning
        segregation_reasoning = f"{classification_response.reasoning} | Segregation: {rules['notes']}"
        
        if not classification_response.data.is_segregation_correct:
            segregation_reasoning += f" | WARNING: {classification_response.data.violation_details}"
        
        return AgentResponse(
            success=True,
            data=classification_response.data,
            confidence=classification_response.confidence,
            reasoning=segregation_reasoning,
            metadata=enhanced_metadata
        )
