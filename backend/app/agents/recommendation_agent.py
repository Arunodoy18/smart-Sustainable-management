from typing import List, Dict
from app.agents.base_agent import BaseAgent, AgentResponse
from pydantic import BaseModel

class RecommendationInput(BaseModel):
    waste_category: str
    confidence: float
    is_recyclable: bool
    risk_level: str
    requires_special_handling: bool
    detected_objects: List[str]

class RecommendationOutput(BaseModel):
    action: str
    instructions: List[str]
    collection_type: str
    impact_note: str
    confidence_message: str

class RecommendationAgent(BaseAgent[RecommendationInput, RecommendationOutput]):
    """
    Generates confidence-aware recommendations for waste disposal.
    This is the intelligence layer that makes the system judge-worthy.
    """
    def __init__(self):
        super().__init__(name="RecommendationAgent")
        
        # Action templates based on waste category and confidence
        self.action_templates = {
            "plastic": {
                "high": {
                    "action": "Recycle",
                    "instructions": [
                        "Rinse the plastic container thoroughly",
                        "Remove any labels or caps if possible",
                        "Ensure plastic is dry before disposal",
                        "Place in the DRY RECYCLABLE bin"
                    ],
                    "collection": "Scheduled recyclable pickup",
                    "impact": "Reduces landfill plastic by ~80% and prevents ocean pollution. Saves 5.7 kWh energy per kg recycled."
                },
                "medium": {
                    "action": "Likely Recyclable - Verify",
                    "instructions": [
                        "Check plastic type number (look for triangle symbol)",
                        "If #1, #2, #4, or #5 → recycle",
                        "If #3, #6, or #7 → general waste",
                        "When in doubt, check with local recycling center"
                    ],
                    "collection": "Recyclable pickup (after verification)",
                    "impact": "Proper sorting prevents recycling contamination which can ruin entire batches."
                },
                "low": {
                    "action": "Manual Review Required",
                    "instructions": [
                        "Do NOT place in recycling bin yet",
                        "Take clear photo and consult waste collection staff",
                        "If heavily contaminated, dispose as general waste"
                    ],
                    "collection": "General waste (pending review)",
                    "impact": "Prevents contamination of recycling stream."
                }
            },
            "organic": {
                "high": {
                    "action": "Compost",
                    "instructions": [
                        "Place in designated organic waste bin",
                        "Remove any plastic packaging",
                        "Can be composted at home or via municipal service",
                        "Avoid adding meat/dairy without proper composting setup"
                    ],
                    "collection": "Organic waste pickup / Composting",
                    "impact": "Creates nutrient-rich soil amendment. Reduces methane emissions by 90% vs landfilling."
                },
                "medium": {
                    "action": "Likely Compostable - Check",
                    "instructions": [
                        "Verify it's pure organic material (no plastic coating)",
                        "If food waste → compost bin",
                        "If mixed with non-organic → separate first",
                        "Meat/bones may require special handling"
                    ],
                    "collection": "Organic pickup (after separation)",
                    "impact": "Proper composting reduces GHG emissions and enriches soil."
                },
                "low": {
                    "action": "Manual Inspection Needed",
                    "instructions": [
                        "Cannot determine if fully organic",
                        "Separate visible organic material",
                        "Consult with waste staff for mixed items"
                    ],
                    "collection": "General waste (pending inspection)",
                    "impact": "Caution prevents contamination."
                }
            },
            "glass": {
                "high": {
                    "action": "Recycle",
                    "instructions": [
                        "Rinse glass container",
                        "Remove metal caps/lids (recycle separately)",
                        "Handle carefully to avoid breakage",
                        "Place in GLASS RECYCLING bin"
                    ],
                    "collection": "Glass recycling pickup",
                    "impact": "Glass is 100% recyclable infinitely. Saves 30% energy vs new glass production."
                },
                "medium": {
                    "action": "Recycle with Caution",
                    "instructions": [
                        "If broken, wrap in newspaper/cardboard",
                        "Label as 'broken glass' for safety",
                        "Check if colored glass accepted in your area"
                    ],
                    "collection": "Glass recycling or general waste",
                    "impact": "Safe handling protects collection workers."
                },
                "low": {
                    "action": "Dispose Safely",
                    "instructions": [
                        "If uncertain about glass type, treat as general waste",
                        "Wrap securely if broken",
                        "Label for worker safety"
                    ],
                    "collection": "General waste",
                    "impact": "Safety first approach."
                }
            },
            "metal": {
                "high": {
                    "action": "Recycle",
                    "instructions": [
                        "Rinse cans/containers",
                        "Flatten aluminum cans to save space",
                        "Remove any non-metal attachments",
                        "Place in METAL RECYCLING bin"
                    ],
                    "collection": "Metal scrap / Recyclable pickup",
                    "impact": "Aluminum recycling saves 95% energy. Steel recycling reduces mining impact."
                },
                "medium": {
                    "action": "Likely Recyclable",
                    "instructions": [
                        "Check if aluminum or steel (magnet test)",
                        "Both are recyclable but may go to different bins",
                        "Verify with local guidelines"
                    ],
                    "collection": "Metal recycling",
                    "impact": "High value material - worth recycling."
                },
                "low": {
                    "action": "Manual Assessment",
                    "instructions": [
                        "Unknown metal type detected",
                        "Consult waste collection staff",
                        "May have scrap value"
                    ],
                    "collection": "Scrap metal facility",
                    "impact": "Professional assessment ensures proper handling."
                }
            },
            "e-waste": {
                "high": {
                    "action": "E-Waste Disposal Required",
                    "instructions": [
                        "DO NOT place in regular bins",
                        "Take to certified e-waste collection center",
                        "Remove batteries separately if possible",
                        "Contact municipal e-waste pickup service",
                        "Data wipe devices before disposal"
                    ],
                    "collection": "Certified E-Waste Facility",
                    "impact": "Prevents toxic materials from landfills. Recovers valuable rare metals. Data security."
                },
                "medium": {
                    "action": "E-Waste - Verify Components",
                    "instructions": [
                        "Appears to be electronic waste",
                        "Do not mix with regular waste",
                        "Check if manufacturer has take-back program",
                        "Municipal e-waste days may be available"
                    ],
                    "collection": "E-Waste center (verification needed)",
                    "impact": "Proper e-waste handling prevents environmental toxins."
                },
                "low": {
                    "action": "Professional Assessment Required",
                    "instructions": [
                        "Cannot confirm e-waste classification",
                        "Store safely and contact e-waste facility",
                        "DO NOT dispose in regular trash"
                    ],
                    "collection": "Hold for professional pickup",
                    "impact": "Caution with potential hazardous materials."
                }
            },
            "biomedical": {
                "high": {
                    "action": "HAZARDOUS - Special Disposal",
                    "instructions": [
                        "⚠️ BIOHAZARD - Handle with extreme care",
                        "Place in sealed, labeled biomedical waste bag",
                        "Contact authorized medical waste disposal service",
                        "DO NOT place in any regular bins",
                        "Wear protective equipment when handling"
                    ],
                    "collection": "Licensed Biomedical Waste Disposal",
                    "impact": "CRITICAL: Prevents disease transmission and environmental contamination."
                },
                "medium": {
                    "action": "Possible Biohazard - Isolate",
                    "instructions": [
                        "Treat as potentially hazardous",
                        "Seal in separate container",
                        "Contact waste management authority",
                        "Keep away from general waste"
                    ],
                    "collection": "Hazardous waste assessment",
                    "impact": "Precautionary isolation protects public health."
                },
                "low": {
                    "action": "Safety Assessment Required",
                    "instructions": [
                        "Uncertain classification - assume hazardous",
                        "Isolate immediately",
                        "Call local health/waste authority",
                        "Do not attempt disposal"
                    ],
                    "collection": "Professional hazmat evaluation",
                    "impact": "Maximum caution with unknown hazardous materials."
                }
            }
        }

    async def process(self, input_data: RecommendationInput) -> AgentResponse[RecommendationOutput]:
        self.log_activity(f"Generating recommendation for {input_data.waste_category} (confidence: {input_data.confidence})")
        
        # Determine confidence level
        if input_data.confidence >= 0.8:
            conf_level = "high"
            conf_message = f"High confidence ({input_data.confidence:.0%}) - Proceed with recommended action"
        elif input_data.confidence >= 0.5:
            conf_level = "medium"
            conf_message = f"Moderate confidence ({input_data.confidence:.0%}) - Verify before proceeding"
        else:
            conf_level = "low"
            conf_message = f"Low confidence ({input_data.confidence:.0%}) - Manual review strongly recommended"
        
        # Get recommendation template
        category_templates = self.action_templates.get(input_data.waste_category, self.action_templates["plastic"])
        template = category_templates[conf_level]
        
        # Build output
        output = RecommendationOutput(
            action=template["action"],
            instructions=template["instructions"],
            collection_type=template["collection"],
            impact_note=template["impact"],
            confidence_message=conf_message
        )
        
        reasoning = f"Confidence-aware recommendation: {conf_level.upper()} confidence scenario. "
        if input_data.risk_level in ["high", "critical"]:
            reasoning += f"RISK LEVEL: {input_data.risk_level.upper()} - Special handling mandatory. "
        if input_data.requires_special_handling:
            reasoning += "Requires special handling protocols. "
        
        return AgentResponse(
            success=True,
            data=output,
            confidence=input_data.confidence,
            reasoning=reasoning,
            metadata={
                "confidence_level": conf_level,
                "risk_level": input_data.risk_level,
                "recyclable": input_data.is_recyclable
            }
        )
