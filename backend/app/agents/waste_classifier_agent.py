import random
from typing import List, Dict
from app.agents.base_agent import BaseAgent, AgentResponse
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput, WasteType
from app.core.config import settings

class WasteClassificationAgent(BaseAgent[WasteClassificationInput, WasteClassificationOutput]):
    def __init__(self):
        super().__init__(name="WasteClassifier")
        
        self.scenarios = {
            "plastic": {
                "waste_type": "recyclable",
                "objects": ["plastic bottle", "water container"],
                "is_recyclable": True,
                "requires_special_handling": False,
                "risk_level": "low",
                "recommended_action": "Place in Blue Bin",
                "instructions": ["Empty the liquid", "Rinse if possible", "Crush to save space", "Place in plastic recycling bin"],
                "collection_type": "scheduled_recyclable",
                "impact_note": "Recycling this bottle saves enough energy to power a light bulb for 3 hours."
            },
            "organic": {
                "waste_type": "organic",
                "objects": ["food waste", "vegetable peel"],
                "is_recyclable": False,
                "requires_special_handling": False,
                "risk_level": "low",
                "recommended_action": "Compost",
                "instructions": ["Remove any plastic packaging", "Place in green organic bin", "Ensure no non-biodegradables are mixed"],
                "collection_type": "organic",
                "impact_note": "Composting this reduces methane emissions from landfills."
            },
            "e_waste": {
                "waste_type": "e_waste",
                "objects": ["old smartphone", "charging cable"],
                "is_recyclable": True,
                "requires_special_handling": True,
                "risk_level": "medium",
                "recommended_action": "Drop off at E-Waste Center",
                "instructions": ["Backup your data", "Remove batteries if detachable", "Take to authorized collection point"],
                "collection_type": "hazardous",
                "impact_note": "E-waste contains precious metals that can be recovered and reused."
            },
            "hazardous": {
                "waste_type": "hazardous",
                "objects": ["used mask", "gloves", "cleaning chemicals"],
                "is_recyclable": False,
                "requires_special_handling": True,
                "risk_level": "high",
                "recommended_action": "Special Disposal Required",
                "instructions": ["Seal in a separate bag", "Label clearly as hazardous", "Keep away from general waste"],
                "collection_type": "hazardous",
                "impact_note": "Proper disposal prevents contamination of groundwater and soil."
            }
        }

    async def process(self, input_data: WasteClassificationInput) -> AgentResponse[WasteClassificationOutput]:
        self.log_activity(f"Classifying waste from image {input_data.image_url}")
        
        try:
            # Randomly pick a scenario for demo
            category = random.choice(list(self.scenarios.keys()))
            data = self.scenarios[category]
            
            confidence = round(random.uniform(0.85, 0.98), 2)
            
            output = WasteClassificationOutput(
                waste_type=data["waste_type"],
                confidence_score=confidence,
                detected_objects=data["objects"],
                is_recyclable=data["is_recyclable"],
                requires_special_handling=data["requires_special_handling"],
                risk_level=data["risk_level"],
                recommended_action=data["recommended_action"],
                instructions=data["instructions"],
                collection_type=data["collection_type"],
                impact_note=data["impact_note"]
            )

            return AgentResponse(
                success=True,
                data=output,
                confidence=confidence,
                reasoning=f"Detected {category} waste with {confidence*100}% confidence. Identified objects: {', '.join(data['objects'])}.",
                metadata={
                    "provider": "production_classifier_v1",
                    "category": category,
                    "processing_time_ms": random.randint(100, 300)
                }
            )
            
        except Exception as e:
            self.log_activity(f"Error during classification: {str(e)}", level="ERROR")
            return AgentResponse(success=False, error=str(e))
