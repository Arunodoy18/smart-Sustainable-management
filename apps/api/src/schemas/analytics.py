"""
Analytics Schemas
=================

Pydantic schemas for analytics and dashboard endpoints.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import Field

from src.schemas.common import BaseSchema


# =============================================================================
# Impact Metrics Schemas
# =============================================================================


class ImpactSummary(BaseSchema):
    """Environmental impact summary."""

    total_waste_kg: Decimal
    recycled_waste_kg: Decimal
    co2_saved_kg: Decimal
    landfill_diverted_kg: Decimal
    trees_equivalent: Decimal
    water_saved_liters: Decimal
    energy_saved_kwh: Decimal
    recycling_rate: float


class UserImpactResponse(BaseSchema):
    """User's personal environmental impact."""

    impact: ImpactSummary
    rank_percentile: float
    comparison_to_average: float
    badges_earned: int
    impact_equivalents: dict[str, str]  # Human-readable equivalents


class CityImpactResponse(BaseSchema):
    """City-wide environmental impact."""

    period_start: date
    period_end: date
    impact: ImpactSummary
    total_users: int
    active_users: int
    total_entries: int
    total_pickups: int
    trend: dict[str, float]  # Percentage change from previous period


# =============================================================================
# Dashboard Schemas
# =============================================================================


class DashboardStats(BaseSchema):
    """Admin dashboard statistics."""

    # User stats
    total_users: int
    active_users_today: int
    active_users_week: int
    new_users_today: int
    new_users_week: int
    
    # Driver stats
    total_drivers: int
    active_drivers: int
    pending_driver_approvals: int
    
    # Waste stats
    total_entries_today: int
    total_entries_week: int
    entries_by_category: dict[str, int]
    
    # Pickup stats
    pending_pickups: int
    completed_pickups_today: int
    average_pickup_time_minutes: float | None
    
    # Impact
    co2_saved_today_kg: Decimal
    co2_saved_week_kg: Decimal
    recycling_rate: float


class TimeSeriesDataPoint(BaseSchema):
    """Single data point in time series."""

    timestamp: datetime
    value: float


class TimeSeriesResponse(BaseSchema):
    """Time series data for charts."""

    metric: str
    data: list[TimeSeriesDataPoint]
    total: float
    average: float
    trend: float  # Percentage change


class CategoryDistribution(BaseSchema):
    """Waste category distribution."""

    category: str
    count: int
    percentage: float
    weight_kg: Decimal


class CategoryDistributionResponse(BaseSchema):
    """Full category distribution."""

    period_start: date
    period_end: date
    distributions: list[CategoryDistribution]
    total_entries: int


# =============================================================================
# Heatmap Schemas
# =============================================================================


class HeatmapPoint(BaseSchema):
    """Single heatmap point."""

    latitude: float
    longitude: float
    weight: float


class HeatmapResponse(BaseSchema):
    """Heatmap data for visualization."""

    points: list[HeatmapPoint]
    max_weight: float
    bounds: dict[str, float]  # north, south, east, west


class ZoneStatsResponse(BaseSchema):
    """Zone statistics."""

    zone_id: UUID
    zone_name: str
    total_entries: int
    total_pickups: int
    recycling_rate: float
    active_drivers: int
    avg_pickup_time_minutes: float | None


# =============================================================================
# Driver Analytics Schemas
# =============================================================================


class DriverPerformance(BaseSchema):
    """Individual driver performance."""

    driver_id: UUID
    driver_name: str
    total_pickups: int
    completed_pickups: int
    on_time_rate: float
    average_rating: float
    total_weight_kg: Decimal
    efficiency_score: float


class DriverLeaderboard(BaseSchema):
    """Driver performance leaderboard."""

    period_start: date
    period_end: date
    drivers: list[DriverPerformance]


class FleetOverview(BaseSchema):
    """Fleet management overview."""

    total_drivers: int
    available_drivers: int
    busy_drivers: int
    offline_drivers: int
    pending_pickups: int
    in_progress_pickups: int
    average_fleet_rating: float


# =============================================================================
# Report Schemas
# =============================================================================


class ReportRequest(BaseSchema):
    """Generate analytics report."""

    report_type: str = Field(pattern="^(daily|weekly|monthly|custom)$")
    date_from: date
    date_to: date
    include_sections: list[str] = Field(
        default=["summary", "waste", "pickups", "drivers", "impact"]
    )
    format: str = Field(default="json", pattern="^(json|csv|pdf)$")


class ReportResponse(BaseSchema):
    """Generated report."""

    report_id: UUID
    report_type: str
    period_start: date
    period_end: date
    generated_at: datetime
    download_url: str | None = None
    data: dict | None = None


# =============================================================================
# Compliance Schemas
# =============================================================================


class ComplianceMetrics(BaseSchema):
    """Recycling compliance metrics."""

    period_start: date
    period_end: date
    recycling_rate: float
    recycling_target: float
    on_target: bool
    gap_percentage: float
    top_recycling_zones: list[dict]
    improvement_areas: list[dict]


class ComplianceAlert(BaseSchema):
    """Compliance alert."""

    id: UUID
    alert_type: str
    severity: str
    message: str
    zone_id: UUID | None = None
    created_at: datetime
    acknowledged: bool
