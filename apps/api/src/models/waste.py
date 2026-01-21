"""
Waste Entry & Classification Models
====================================

Database models for waste submissions and AI classifications.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database.base import Base

if TYPE_CHECKING:
    from src.models.pickup import Pickup
    from src.models.user import User


class WasteCategory(str, enum.Enum):
    """Primary waste categories.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    ORGANIC = "ORGANIC"
    RECYCLABLE = "RECYCLABLE"
    HAZARDOUS = "HAZARDOUS"
    ELECTRONIC = "ELECTRONIC"
    GENERAL = "GENERAL"
    MEDICAL = "MEDICAL"


class WasteSubCategory(str, enum.Enum):
    """Detailed waste subcategories.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    # Organic
    FOOD_WASTE = "FOOD_WASTE"
    GARDEN_WASTE = "GARDEN_WASTE"
    
    # Recyclable
    PLASTIC = "PLASTIC"
    PAPER = "PAPER"
    GLASS = "GLASS"
    METAL = "METAL"
    CARDBOARD = "CARDBOARD"
    
    # Hazardous
    CHEMICALS = "CHEMICALS"
    BATTERIES = "BATTERIES"
    PAINT = "PAINT"
    OIL = "OIL"
    
    # Electronic
    SMALL_ELECTRONICS = "SMALL_ELECTRONICS"
    LARGE_APPLIANCES = "LARGE_APPLIANCES"
    CABLES = "CABLES"
    
    # Medical
    SHARPS = "SHARPS"
    PHARMACEUTICALS = "PHARMACEUTICALS"
    
    # General
    MIXED = "MIXED"
    TEXTILES = "TEXTILES"
    FURNITURE = "FURNITURE"


class BinType(str, enum.Enum):
    """Waste bin types for disposal.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    GREEN = "GREEN"  # Organic
    BLUE = "BLUE"  # Recyclables
    RED = "RED"  # Hazardous
    BLACK = "BLACK"  # General
    YELLOW = "YELLOW"  # Medical
    SPECIAL = "SPECIAL"  # Special collection required


class ClassificationConfidence(str, enum.Enum):
    """AI classification confidence tiers.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    HIGH = "HIGH"  # >= 85% - Auto actionable
    MEDIUM = "MEDIUM"  # 60-84% - Verify category
    LOW = "LOW"  # < 60% - Manual handling


class WasteEntryStatus(str, enum.Enum):
    """Status of waste entry.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    PENDING = "PENDING"  # Just submitted
    CLASSIFIED = "CLASSIFIED"  # AI classification done
    VERIFIED = "VERIFIED"  # User/admin verified
    PICKUP_REQUESTED = "PICKUP_REQUESTED"  # Pickup scheduled
    COLLECTED = "COLLECTED"  # Waste collected
    CANCELLED = "CANCELLED"  # Entry cancelled


class WasteEntry(Base):
    """
    User waste submission.
    
    Tracks the entire lifecycle from photo upload to collection.
    """

    __tablename__ = "waste_entries"
    __table_args__ = (
        Index("ix_waste_entries_user_created", "user_id", "created_at"),
        Index("ix_waste_entries_status_location", "status", "latitude", "longitude"),
        Index("ix_waste_entries_category_created", "category", "created_at"),
    )

    # Owner
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Image
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    image_thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Classification
    category: Mapped[WasteCategory | None] = mapped_column(
        Enum(WasteCategory, name="waste_category"),
        nullable=True,
    )
    subcategory: Mapped[WasteSubCategory | None] = mapped_column(
        Enum(WasteSubCategory, name="waste_subcategory"),
        nullable=True,
    )
    bin_type: Mapped[BinType | None] = mapped_column(
        Enum(BinType, name="bin_type"),
        nullable=True,
    )
    
    # AI Classification Details
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_tier: Mapped[ClassificationConfidence | None] = mapped_column(
        Enum(ClassificationConfidence, name="classification_confidence"),
        nullable=True,
    )
    ai_raw_predictions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # User override
    user_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    user_override_category: Mapped[WasteCategory | None] = mapped_column(
        Enum(WasteCategory, name="waste_category"),
        nullable=True,
    )
    
    # Location
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Status
    status: Mapped[WasteEntryStatus] = mapped_column(
        Enum(WasteEntryStatus, name="waste_entry_status"),
        default=WasteEntryStatus.PENDING,
        nullable=False,
    )
    
    # Environmental Impact
    estimated_weight_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 3),
        nullable=True,
    )
    co2_saved_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 3),
        nullable=True,
    )
    
    # Notes
    user_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="waste_entries")
    classification: Mapped["Classification | None"] = relationship(
        "Classification",
        back_populates="waste_entry",
        uselist=False,
    )
    pickup: Mapped["Pickup | None"] = relationship(
        "Pickup",
        back_populates="waste_entry",
        uselist=False,
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="waste_entry",
    )


class Classification(Base):
    """
    Detailed AI classification result.
    
    Stores multi-stage classification pipeline results.
    """

    __tablename__ = "classifications"

    waste_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("waste_entries.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    
    # Primary model results
    primary_model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    primary_predictions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    primary_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    primary_category: Mapped[WasteCategory] = mapped_column(
        Enum(WasteCategory, name="waste_category"),
        nullable=False,
    )
    
    # Secondary safety model results
    safety_model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    safety_model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    safety_passed: Mapped[bool] = mapped_column(Boolean, default=True)
    safety_flags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    
    # Processing metrics
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    image_dimensions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Manual review
    requires_manual_review: Mapped[bool] = mapped_column(Boolean, default=False)
    manually_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    waste_entry: Mapped["WasteEntry"] = relationship(
        "WasteEntry",
        back_populates="classification",
    )


class Recommendation(Base):
    """
    Disposal and recycling recommendations.
    
    Generated based on waste classification.
    """

    __tablename__ = "recommendations"

    waste_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("waste_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Recommendation content
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    
    # Type
    recommendation_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # disposal, recycling, special_handling, etc.
    
    # Action
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    action_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Metadata
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Relationships
    waste_entry: Mapped["WasteEntry"] = relationship(
        "WasteEntry",
        back_populates="recommendations",
    )


class WasteCategoryRule(Base):
    """
    Segregation rules for waste categories.
    
    Maps categories/subcategories to bin types and handling instructions.
    """

    __tablename__ = "waste_category_rules"
    __table_args__ = (
        Index("ix_rules_category_subcategory", "category", "subcategory"),
    )

    category: Mapped[WasteCategory] = mapped_column(
        Enum(WasteCategory, name="waste_category"),
        nullable=False,
    )
    subcategory: Mapped[WasteSubCategory | None] = mapped_column(
        Enum(WasteSubCategory, name="waste_subcategory"),
        nullable=True,
    )
    bin_type: Mapped[BinType] = mapped_column(
        Enum(BinType, name="bin_type"),
        nullable=False,
    )
    
    # Instructions
    disposal_instructions: Mapped[str] = mapped_column(Text, nullable=False)
    special_handling: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_pickup: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Impact factors
    recyclable: Mapped[bool] = mapped_column(Boolean, default=False)
    compostable: Mapped[bool] = mapped_column(Boolean, default=False)
    co2_factor_kg_per_kg: Mapped[Decimal] = mapped_column(
        Numeric(10, 4),
        default=0,
    )
    
    # Display
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Active status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
