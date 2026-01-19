"""
Waste Entry Schemas
===================

Pydantic schemas for waste management endpoints.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from src.models.waste import (
    BinType,
    ClassificationConfidence,
    WasteCategory,
    WasteEntryStatus,
    WasteSubCategory,
)
from src.schemas.common import BaseSchema, TimestampMixin


# =============================================================================
# Waste Entry Schemas
# =============================================================================


class WasteEntryCreate(BaseSchema):
    """Create a new waste entry (image uploaded separately)."""

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    address: str | None = Field(default=None, max_length=500)
    user_notes: str | None = Field(default=None, max_length=1000)


class WasteEntryUpdate(BaseSchema):
    """Update waste entry (e.g., user verification)."""

    user_verified: bool | None = None
    user_override_category: WasteCategory | None = None
    user_notes: str | None = Field(default=None, max_length=1000)


class ClassificationResult(BaseSchema):
    """AI classification result."""

    category: WasteCategory
    subcategory: WasteSubCategory | None = None
    confidence: float = Field(ge=0, le=1)
    confidence_tier: ClassificationConfidence
    bin_type: BinType
    all_predictions: dict[str, float] = Field(default_factory=dict)
    requires_verification: bool = False


class RecommendationResponse(BaseSchema):
    """Disposal recommendation."""

    id: UUID
    title: str
    description: str
    recommendation_type: str
    priority: int
    icon: str | None = None
    action_url: str | None = None
    action_label: str | None = None


class WasteEntryResponse(BaseSchema, TimestampMixin):
    """Waste entry response."""

    id: UUID
    user_id: UUID
    image_url: str
    image_thumbnail_url: str | None = None
    
    # Classification
    category: WasteCategory | None = None
    subcategory: WasteSubCategory | None = None
    bin_type: BinType | None = None
    ai_confidence: float | None = None
    confidence_tier: ClassificationConfidence | None = None
    
    # User override
    user_verified: bool
    user_override_category: WasteCategory | None = None
    
    # Location
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    
    # Status
    status: WasteEntryStatus
    
    # Impact
    estimated_weight_kg: Decimal | None = None
    co2_saved_kg: Decimal | None = None
    
    # Notes
    user_notes: str | None = None


class WasteEntryDetailResponse(WasteEntryResponse):
    """Detailed waste entry with recommendations."""

    recommendations: list[RecommendationResponse] = Field(default_factory=list)
    classification_details: "ClassificationDetailResponse | None" = None


class ClassificationDetailResponse(BaseSchema):
    """Detailed classification information."""

    primary_model_name: str
    primary_model_version: str
    primary_confidence: float
    processing_time_ms: int
    safety_passed: bool
    requires_manual_review: bool


# =============================================================================
# Waste History Schemas
# =============================================================================


class WasteHistoryFilters(BaseSchema):
    """Filters for waste entry history."""

    category: WasteCategory | None = None
    status: WasteEntryStatus | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


class WasteHistorySummary(BaseSchema):
    """Summary of user's waste history."""

    total_entries: int
    entries_by_category: dict[str, int]
    total_weight_kg: Decimal
    total_co2_saved_kg: Decimal
    recycling_rate: float


# =============================================================================
# Upload Schemas
# =============================================================================


class ImageUploadResponse(BaseSchema):
    """Image upload response."""

    waste_entry_id: UUID
    image_url: str
    thumbnail_url: str | None = None
    classification: ClassificationResult | None = None


class ClassificationRequest(BaseSchema):
    """Manual classification request (admin)."""

    waste_entry_id: UUID
    category: WasteCategory
    subcategory: WasteSubCategory | None = None
    review_notes: str | None = Field(default=None, max_length=1000)


# =============================================================================
# Bin & Category Schemas
# =============================================================================


class BinTypeInfo(BaseSchema):
    """Bin type information."""

    type: BinType
    name: str
    description: str
    color: str
    icon: str
    accepted_categories: list[WasteCategory]


class CategoryRuleResponse(BaseSchema):
    """Waste category rule."""

    category: WasteCategory
    subcategory: WasteSubCategory | None = None
    bin_type: BinType
    disposal_instructions: str
    special_handling: bool
    requires_pickup: bool
    recyclable: bool
    compostable: bool
    icon: str | None = None
    color: str | None = None
