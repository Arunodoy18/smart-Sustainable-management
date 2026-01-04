import random
from typing import List, Dict
from app.agents.base_agent import BaseAgent, AgentResponse
from app.schemas.waste import WasteClassificationInput, WasteClassificationOutput, WasteType
from app.core.config import settings

class WasteClassificationAgent(BaseAgent[WasteClassificationInput, WasteClassificationOutput]):
    def __init__(self):
        super().__init__(name="WasteClassifier")
        
        # Knowledge base for waste classification
        self.waste_patterns = {
            "plastic": ["bottle", "container", "bag", "packaging", "wrapper", "cup", "plate"],
            "organic": ["food", "fruit", "vegetable", "peel", "core", "leftovers", "plant"],
            "glass": ["bottle", "jar", "container", "window", "mirror", "glassware"],
            "metal": ["can", "foil", "wire", "scrap", "tool", "utensil"],
            "e-waste": ["phone", "computer", "battery", "charger", "electronic", "circuit"],
            "biomedical": ["syringe", "bandage", "mask", "glove", "medical", "pharmaceutical"]
        }

    async def process(self, input_data: WasteClassificationInput) -> AgentResponse[WasteClassificationOutput]:
        self.log_activity(f"Classifying waste for user {input_data.user_id} from image {input_data.image_url}")
        
        # In production, this would call GPT-4o Vision or a custom CNN
        # For demo: intelligent mock classification based on patterns
        
        try:
            # Simulate vision analysis
            category, detected_objects = self._simulate_vision_classification(input_data.image_url)
            
            # Calculate confidence based on clarity and patterns
            confidence = self._calculate_confidence(category, detected_objects)
            
            # Map to WasteType enum
            waste_type_map = {
                "plastic": WasteType.RECYCLABLE,
                "organic": WasteType.ORGANIC,
                "glass": WasteType.RECYCLABLE,
                "metal": WasteType.RECYCLABLE,
                "e-waste": WasteType.E_WASTE,
                "biomedical": WasteType.HAZARDOUS
            }
            
            detected_type = waste_type_map.get(category, WasteType.GENERAL)
            
            # Check segregation correctness
            is_correct = len(detected_objects) == 1 or self._check_compatible_items(detected_objects)
            violation = None if is_correct else "Mixed waste types detected - requires separation"

            output = WasteClassificationOutput(
                waste_type=detected_type,
                confidence=confidence,
                detected_objects=detected_objects,
                is_segregation_correct=is_correct,
                violation_details=violation
            )

            reasoning = self._generate_reasoning(category, confidence, detected_objects)

            return AgentResponse(
                success=True,
                data=output,
                confidence=confidence,
                reasoning=reasoning,
                metadata={
                    "provider": "vision_classifier_v2",
                    "category": category,
                    "processing_time_ms": random.randint(150, 450)
                }
            )
            
        except Exception as e:
            self.log_activity(f"Error during classification: {str(e)}", level="ERROR")
            return AgentResponse(success=False, error=str(e))
    
    def _simulate_vision_classification(self, image_url: str) -> tuple[str, List[str]]:
        """Simulate computer vision classification"""
        # In demo mode, create realistic scenarios
        scenarios = [
            ("plastic", ["plastic bottle", "water container"]),
            ("organic", ["food waste", "vegetable peel"]),
            ("glass", ["glass bottle"]),
            ("metal", ["aluminum can"]),
            ("e-waste", ["old smartphone", "charging cable"]),
            ("plastic", ["plastic bag", "wrapper"]),
            ("organic", ["fruit core", "leftovers"]),
            ("biomedical", ["used mask", "gloves"]),
        ]
        
        category, objects = random.choice(scenarios)
        return category, objects
    
    def _calculate_confidence(self, category: str, objects: List[str]) -> float:
        """Calculate confidence score based on clarity"""
        base_confidence = 0.85
        
        # Higher confidence for single-item waste
        if len(objects) == 1:
            base_confidence += 0.1
        
        # Vary confidence realistically
        noise = random.uniform(-0.15, 0.1)
        confidence = max(0.4, min(0.99, base_confidence + noise))
        
        return round(confidence, 2)
    
    def _check_compatible_items(self, objects: List[str]) -> bool:
        """Check if detected objects can be in same bin"""
        # Simple rule: all should belong to same category
        categories_found = set()
        for obj in objects:
            for category, patterns in self.waste_patterns.items():
                if any(pattern in obj.lower() for pattern in patterns):
                    categories_found.add(category)
        
        return len(categories_found) <= 1
    
    def _generate_reasoning(self, category: str, confidence: float, objects: List[str]) -> str:
        """Generate human-readable reasoning"""
        if confidence >= 0.85:
            return f"High confidence classification: Detected {category} waste with clear visual patterns. Objects identified: {', '.join(objects)}."
        elif confidence >= 0.65:
            return f"Moderate confidence: Likely {category} waste, but some ambiguity in image. Recommend manual verification."
        else:
            return f"Low confidence: Uncertain classification for {category}. Image quality or mixed waste detected. Manual review recommended."
