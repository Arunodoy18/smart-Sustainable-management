"""
Analytics & Impact Models
=========================

Database models for analytics and environmental impact tracking.
"""

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database.base import Base


class ImpactMetrics(Base):
    """
    Environmental impact metrics.
    
    Tracks environmental savings from recycling and proper waste disposal.
    """

    __tablename__ = "impact_metrics"
    __table_args__ = (
        Index("ix_impact_metrics_date_scope", "metric_date", "scope_type"),
    )

    # Time period
    metric_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Scope (city-wide, zone, or user)
    scope_type: Mapped[str] = mapped_column(String(50), nullable=False)
    scope_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Waste metrics
    total_waste_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    recycled_waste_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    organic_waste_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    hazardous_waste_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    general_waste_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    
    # Environmental impact
    co2_saved_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    landfill_diverted_kg: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    trees_equivalent: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    water_saved_liters: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    energy_saved_kwh: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    
    # Activity metrics
    total_entries: Mapped[int] = mapped_column(Integer, default=0)
    total_pickups: Mapped[int] = mapped_column(Integer, default=0)
    active_users: Mapped[int] = mapped_column(Integer, default=0)
    
    # Rates
    recycling_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    compliance_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)


class ZoneAnalytics(Base):
    """
    Zone-level analytics for city dashboard.
    """

    __tablename__ = "zone_analytics"
    __table_args__ = (
        Index("ix_zone_analytics_zone_date", "zone_id", "analytics_date"),
    )

    zone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("zones.id", ondelete="CASCADE"),
        nullable=False,
    )
    analytics_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Waste distribution
    waste_by_category: Mapped[dict] = mapped_column(JSONB, default=dict)
    
    # Pickup metrics
    total_pickups: Mapped[int] = mapped_column(Integer, default=0)
    completed_pickups: Mapped[int] = mapped_column(Integer, default=0)
    average_pickup_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Driver metrics
    active_drivers: Mapped[int] = mapped_column(Integer, default=0)
    average_driver_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2),
        nullable=True,
    )
    
    # Hotspot data (for heatmap)
    hotspot_data: Mapped[list | None] = mapped_column(JSONB, nullable=True)


class WasteHotspot(Base):
    """
    Geographic hotspots for waste generation.
    
    Used for heatmap visualization and route optimization.
    """

    __tablename__ = "waste_hotspots"
    __table_args__ = (
        Index("ix_waste_hotspots_location", "latitude", "longitude"),
    )

    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Zone reference
    zone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("zones.id"),
        nullable=True,
    )
    
    # Intensity
    intensity: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=0)
    entry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Time period
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Category breakdown
    category_distribution: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class SystemMetrics(Base):
    """
    System-wide metrics for monitoring and reporting.
    """

    __tablename__ = "system_metrics"

    metric_date: Mapped[date] = mapped_column(Date, nullable=False, unique=True)
    
    # User metrics
    total_users: Mapped[int] = mapped_column(Integer, default=0)
    active_users_daily: Mapped[int] = mapped_column(Integer, default=0)
    active_users_weekly: Mapped[int] = mapped_column(Integer, default=0)
    active_users_monthly: Mapped[int] = mapped_column(Integer, default=0)
    new_users: Mapped[int] = mapped_column(Integer, default=0)
    
    # Driver metrics
    total_drivers: Mapped[int] = mapped_column(Integer, default=0)
    active_drivers: Mapped[int] = mapped_column(Integer, default=0)
    
    # Waste metrics
    total_waste_entries: Mapped[int] = mapped_column(Integer, default=0)
    new_waste_entries: Mapped[int] = mapped_column(Integer, default=0)
    
    # Pickup metrics
    total_pickups: Mapped[int] = mapped_column(Integer, default=0)
    completed_pickups: Mapped[int] = mapped_column(Integer, default=0)
    
    # AI metrics
    ai_classifications: Mapped[int] = mapped_column(Integer, default=0)
    ai_accuracy_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )
    manual_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    # Detailed breakdown
    breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class AuditLog(Base):
    """
    Audit log for security and compliance.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_created", "user_id", "created_at"),
        Index("ix_audit_logs_action_created", "action", "created_at"),
    )

    # Actor
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    user_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Action
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Details
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    old_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Request context
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Status
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
