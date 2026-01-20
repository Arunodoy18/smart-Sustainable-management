"""
Pickup Schemas
==============

Pydantic schemas for pickup and driver endpoints.
"""

from datetime import date as DateType, datetime, time
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from src.models.pickup import PickupPriority, PickupStatus
from src.schemas.common import BaseSchema, TimestampMixin


# =============================================================================
# Pickup Request Schemas
# =============================================================================


class PickupRequest(BaseSchema):
    """Request a waste pickup."""

    waste_entry_id: UUID
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    address: str = Field(max_length=500)
    address_details: str | None = Field(default=None, max_length=500)
    scheduled_date: DateType | None = None
    scheduled_time_start: time | None = None
    scheduled_time_end: time | None = None
    priority: PickupPriority = PickupPriority.NORMAL


class PickupUpdate(BaseSchema):
    """Update pickup details."""

    address: str | None = Field(default=None, max_length=500)
    address_details: str | None = Field(default=None, max_length=500)
    scheduled_date: DateType | None = None
    scheduled_time_start: time | None = None
    scheduled_time_end: time | None = None


class PickupCancellation(BaseSchema):
    """Cancel a pickup request."""

    reason: str = Field(max_length=500)


# =============================================================================
# Pickup Response Schemas
# =============================================================================


class PickupResponse(BaseSchema, TimestampMixin):
    """Pickup information."""

    id: UUID
    waste_entry_id: UUID
    user_id: UUID
    driver_id: UUID | None = None
    
    # Status
    status: PickupStatus
    priority: PickupPriority
    
    # Schedule
    scheduled_date: DateType | None = None
    scheduled_time_start: time | None = None
    scheduled_time_end: time | None = None
    
    # Location
    latitude: float
    longitude: float
    address: str
    address_details: str | None = None
    
    # QR Code
    qr_code: str | None = None
    
    # Timestamps
    assigned_at: datetime | None = None
    en_route_at: datetime | None = None
    arrived_at: datetime | None = None
    collected_at: datetime | None = None


class PickupDetailResponse(PickupResponse):
    """Detailed pickup with related information."""

    driver_name: str | None = None
    driver_phone: str | None = None
    driver_rating: float | None = None
    waste_category: str | None = None
    proof_image_url: str | None = None
    weight_collected_kg: Decimal | None = None
    user_rating: int | None = None
    user_feedback: str | None = None


# =============================================================================
# Driver Pickup Schemas
# =============================================================================


class DriverPickupAssignment(BaseSchema):
    """Assign pickup to driver."""

    driver_id: UUID


class DriverPickupAccept(BaseSchema):
    """Driver accepts pickup."""

    estimated_arrival_minutes: int | None = Field(default=None, ge=1, le=480)


class DriverPickupComplete(BaseSchema):
    """Driver completes pickup."""

    weight_collected_kg: Decimal | None = Field(default=None, ge=0, le=1000)
    notes: str | None = Field(default=None, max_length=500)


class DriverQRScan(BaseSchema):
    """Driver scans user QR code."""

    qr_code: str = Field(max_length=100)


class DriverPickupListFilters(BaseSchema):
    """Filters for driver pickup list."""

    status: PickupStatus | None = None
    filter_date: DateType | None = None
    zone_id: UUID | None = None


# =============================================================================
# Pickup Map Schemas
# =============================================================================


class PickupMapPoint(BaseSchema):
    """Pickup point for map display."""

    id: UUID
    latitude: float
    longitude: float
    status: PickupStatus
    priority: PickupPriority
    scheduled_date: DateType | None = None
    waste_category: str | None = None
    address: str


class PickupHeatmapData(BaseSchema):
    """Heatmap data for pickup density."""

    points: list[dict]  # [{lat, lng, weight}]
    max_weight: float
    total_pickups: int


# =============================================================================
# Driver Route Schemas
# =============================================================================


class RouteWaypoint(BaseSchema):
    """Waypoint in driver route."""

    pickup_id: UUID
    latitude: float
    longitude: float
    address: str
    order: int
    estimated_arrival: datetime | None = None
    status: PickupStatus


class DriverRouteResponse(BaseSchema):
    """Driver's optimized route."""

    driver_id: UUID
    waypoints: list[RouteWaypoint]
    total_distance_km: float | None = None
    total_duration_minutes: int | None = None
    route_polyline: str | None = None  # Encoded polyline


# =============================================================================
# Pickup Rating Schemas
# =============================================================================


class PickupRating(BaseSchema):
    """User rates pickup experience."""

    rating: int = Field(ge=1, le=5)
    feedback: str | None = Field(default=None, max_length=500)


class DriverRatingStats(BaseSchema):
    """Driver rating statistics."""

    average_rating: float
    total_ratings: int
    rating_distribution: dict[int, int]  # {1: count, 2: count, ...}


class DriverLocationUpdate(BaseSchema):
    """Driver location update."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    heading: float | None = Field(default=None, ge=0, le=360)
    speed_kmh: float | None = Field(default=None, ge=0)


# Alias for backward compatibility
PickupDetail = PickupDetailResponse
