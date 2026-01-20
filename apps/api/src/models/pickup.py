"""
Pickup & Driver Models
======================

Database models for pickup scheduling and driver management.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database.base import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.waste import WasteEntry


class DriverStatus(str, enum.Enum):
    """Driver account status."""

    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class PickupStatus(str, enum.Enum):
    """Pickup request status."""

    REQUESTED = "requested"
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    COLLECTED = "collected"
    CANCELLED = "cancelled"
    FAILED = "failed"


class PickupPriority(str, enum.Enum):
    """Pickup priority level."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class DriverProfile(Base):
    """
    Driver-specific profile information.
    
    Extended profile for waste collection drivers.
    """

    __tablename__ = "driver_profiles"
    __table_args__ = (
        Index("ix_driver_profiles_status_rating", "status", "rating"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    
    # Status
    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus, name="driver_status"),
        default=DriverStatus.PENDING_APPROVAL,
        nullable=False,
    )
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    
    # Vehicle
    vehicle_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vehicle_registration: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vehicle_capacity_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    
    # License
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_expiry: Mapped[datetime | None] = mapped_column(nullable=True)
    license_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Work zone
    assigned_zone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("zones.id"),
        nullable=True,
    )
    
    # Performance
    rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2),
        default=5.00,
    )
    total_pickups: Mapped[int] = mapped_column(Integer, default=0)
    successful_pickups: Mapped[int] = mapped_column(Integer, default=0)
    on_time_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=100.00,
    )
    
    # Availability
    is_available: Mapped[bool] = mapped_column(Boolean, default=False)
    last_location_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_location_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_location_updated: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="driver_profile",
        foreign_keys=[user_id],
    )
    zone: Mapped["Zone | None"] = relationship("Zone", back_populates="drivers")


class Pickup(Base):
    """
    Waste pickup request and tracking.
    """

    __tablename__ = "pickups"
    __table_args__ = (
        Index("ix_pickups_status_scheduled", "status", "scheduled_date"),
        Index("ix_pickups_driver_status", "driver_id", "status"),
        Index("ix_pickups_location", "latitude", "longitude"),
    )

    # Request
    waste_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("waste_entries.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Assignment
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Status
    status: Mapped[PickupStatus] = mapped_column(
        Enum(PickupStatus, name="pickup_status"),
        default=PickupStatus.REQUESTED,
        nullable=False,
    )
    priority: Mapped[PickupPriority] = mapped_column(
        Enum(PickupPriority, name="pickup_priority"),
        default=PickupPriority.NORMAL,
        nullable=False,
    )
    
    # Scheduling
    scheduled_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    scheduled_time_start: Mapped[datetime | None] = mapped_column(Time, nullable=True)
    scheduled_time_end: Mapped[datetime | None] = mapped_column(Time, nullable=True)
    
    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    address_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Collection proof
    collected_at: Mapped[datetime | None] = mapped_column(nullable=True)
    proof_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    weight_collected_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 3),
        nullable=True,
    )
    
    # QR verification
    qr_code: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    qr_scanned_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Rating
    user_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Driver timeline
    en_route_at: Mapped[datetime | None] = mapped_column(nullable=True)
    arrived_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Cancellation
    cancelled_at: Mapped[datetime | None] = mapped_column(nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    
    # Relationships
    waste_entry: Mapped["WasteEntry"] = relationship(
        "WasteEntry",
        back_populates="pickup",
    )
    driver: Mapped["User | None"] = relationship(
        "User",
        back_populates="pickups_as_driver",
        foreign_keys=[driver_id],
    )


class Zone(Base):
    """
    Geographic zones for driver assignment.
    """

    __tablename__ = "zones"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Geographic bounds (simplified as bounding box)
    bounds_north: Mapped[float | None] = mapped_column(Float, nullable=True)
    bounds_south: Mapped[float | None] = mapped_column(Float, nullable=True)
    bounds_east: Mapped[float | None] = mapped_column(Float, nullable=True)
    bounds_west: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # GeoJSON polygon (for complex boundaries)
    boundary_geojson: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    drivers: Mapped[list["DriverProfile"]] = relationship(
        "DriverProfile",
        back_populates="zone",
    )


class DriverLog(Base):
    """
    Driver activity log for tracking and analytics.
    """

    __tablename__ = "driver_logs"
    __table_args__ = (
        Index("ix_driver_logs_driver_created", "driver_id", "created_at"),
    )

    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Event
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Location
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Related entities
    pickup_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pickups.id"),
        nullable=True,
    )
    
    # Additional data
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
