"""
Admin Routes
============

API endpoints for admin dashboard and management.
"""

import uuid
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import CurrentUser, DbSession, RequireAdmin
from src.models.user import UserRole, UserStatus
from src.models.pickup import PickupStatus
from src.schemas.common import PaginatedResponse, SuccessResponse
from src.schemas.analytics import (
    DashboardStats,
    ZoneAnalyticsResponse,
    HeatmapResponse,
    ComplianceMetrics,
    SystemHealth,
)
from src.schemas.user import UserResponse, UserUpdate
from src.schemas.pickup import PickupResponse

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(RequireAdmin)],
)


# ============================================================================
# DASHBOARD
# ============================================================================

@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Get dashboard stats",
    description="Get overview statistics for admin dashboard.",
)
async def get_dashboard_stats(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get admin dashboard statistics."""
    from sqlalchemy import select, func
    from src.models.user import User
    from src.models.waste import WasteEntry
    from src.models.pickup import Pickup
    
    # Get counts
    total_users = await session.scalar(
        select(func.count(User.id)).where(User.status == UserStatus.ACTIVE)
    )
    
    total_entries = await session.scalar(
        select(func.count(WasteEntry.id))
    )
    
    total_pickups = await session.scalar(
        select(func.count(Pickup.id))
    )
    
    pending_pickups = await session.scalar(
        select(func.count(Pickup.id)).where(
            Pickup.status.in_([PickupStatus.PENDING, PickupStatus.SCHEDULED])
        )
    )
    
    # Today's stats
    today = datetime.utcnow().date()
    today_entries = await session.scalar(
        select(func.count(WasteEntry.id)).where(
            func.date(WasteEntry.created_at) == today
        )
    )
    
    today_pickups = await session.scalar(
        select(func.count(Pickup.id)).where(
            func.date(Pickup.created_at) == today
        )
    )
    
    # Active drivers
    active_drivers = await session.scalar(
        select(func.count(User.id)).where(
            User.role == UserRole.DRIVER,
            User.status == UserStatus.ACTIVE,
        )
    )
    
    return DashboardStats(
        total_users=total_users or 0,
        total_waste_entries=total_entries or 0,
        total_pickups=total_pickups or 0,
        pending_pickups=pending_pickups or 0,
        active_drivers=active_drivers or 0,
        today_entries=today_entries or 0,
        today_pickups=today_pickups or 0,
    )


@router.get(
    "/analytics/zones",
    response_model=list[ZoneAnalyticsResponse],
    summary="Get zone analytics",
    description="Get waste analytics by zone.",
)
async def get_zone_analytics(
    current_user: CurrentUser,
    session: DbSession,
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
):
    """Get zone-level analytics."""
    from sqlalchemy import select
    from src.models.analytics import ZoneAnalytics
    
    query = select(ZoneAnalytics)
    
    if start_date:
        query = query.where(ZoneAnalytics.date >= start_date.date())
    if end_date:
        query = query.where(ZoneAnalytics.date <= end_date.date())
    
    result = await session.execute(query.order_by(ZoneAnalytics.date.desc()))
    zones = result.scalars().all()
    
    return [ZoneAnalyticsResponse.from_zone(z) for z in zones]


@router.get(
    "/analytics/heatmap",
    response_model=HeatmapResponse,
    summary="Get waste heatmap",
    description="Get waste concentration heatmap data.",
)
async def get_heatmap_data(
    current_user: CurrentUser,
    session: DbSession,
    days: int = Query(7, ge=1, le=90),
):
    """Get heatmap data for waste hotspots."""
    from sqlalchemy import select
    from src.models.analytics import WasteHotspot
    
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await session.execute(
        select(WasteHotspot).where(
            WasteHotspot.last_detected >= since
        )
    )
    hotspots = result.scalars().all()
    
    return HeatmapResponse(
        points=[
            {
                "lat": h.latitude,
                "lng": h.longitude,
                "weight": h.intensity,
                "radius": h.radius,
                "category": h.primary_category,
            }
            for h in hotspots
        ],
        generated_at=datetime.utcnow(),
    )


@router.get(
    "/analytics/compliance",
    response_model=ComplianceMetrics,
    summary="Get compliance metrics",
    description="Get waste segregation compliance metrics.",
)
async def get_compliance_metrics(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get compliance and quality metrics."""
    from sqlalchemy import select, func
    from src.models.waste import WasteEntry, Classification, ClassificationConfidence
    
    # Total entries with classification
    total = await session.scalar(
        select(func.count(Classification.id))
    )
    
    # High confidence classifications
    high_conf = await session.scalar(
        select(func.count(Classification.id)).where(
            Classification.confidence_tier == ClassificationConfidence.HIGH
        )
    )
    
    # Manual classifications
    manual = await session.scalar(
        select(func.count(Classification.id)).where(
            Classification.verified_by_user_id.isnot(None)
        )
    )
    
    total = total or 1  # Avoid division by zero
    
    return ComplianceMetrics(
        total_classifications=total,
        high_confidence_rate=(high_conf or 0) / total * 100,
        manual_verification_rate=(manual or 0) / total * 100,
        average_confidence=75.0,  # Would calculate from actual data
    )


@router.get(
    "/health",
    response_model=SystemHealth,
    summary="Get system health",
    description="Get system health and status.",
)
async def get_system_health(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get system health status."""
    from src.core.cache import cache
    
    # Check database
    db_healthy = True
    try:
        from sqlalchemy import text
        await session.execute(text("SELECT 1"))
    except Exception:
        db_healthy = False
    
    # Check cache
    cache_healthy = True
    try:
        await cache.set("health_check", "ok", expire=10)
        await cache.get("health_check")
    except Exception:
        cache_healthy = False
    
    return SystemHealth(
        database=db_healthy,
        cache=cache_healthy,
        ml_service=True,  # Would check actual ML service
        storage=True,  # Would check S3/storage
        overall=db_healthy and cache_healthy,
        checked_at=datetime.utcnow(),
    )


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get(
    "/users",
    response_model=PaginatedResponse[UserResponse],
    summary="List users",
    description="Get paginated list of users.",
)
async def list_users(
    current_user: CurrentUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: UserRole | None = Query(None),
    status: UserStatus | None = Query(None),
    search: str | None = Query(None, max_length=100),
):
    """List all users with filters."""
    from sqlalchemy import select, func, or_
    from src.models.user import User
    
    query = select(User)
    count_query = select(func.count(User.id))
    
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    
    if status:
        query = query.where(User.status == status)
        count_query = count_query.where(User.status == status)
    
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    total = await session.scalar(count_query)
    
    result = await session.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = result.scalars().all()
    
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total or 0,
        page=page,
        page_size=page_size,
        pages=((total or 0) + page_size - 1) // page_size if page_size else 0,
    )


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user",
    description="Get user details by ID.",
)
async def get_user(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Get user by ID."""
    from sqlalchemy import select
    from src.models.user import User
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    description="Update user details.",
)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    current_user: CurrentUser,
    session: DbSession,
):
    """Update user details."""
    from sqlalchemy import select
    from src.models.user import User
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.phone is not None:
        user.phone = data.phone
    if data.status is not None:
        user.status = data.status
    
    await session.flush()
    
    return user


@router.post(
    "/users/{user_id}/suspend",
    response_model=SuccessResponse,
    summary="Suspend user",
    description="Suspend a user account.",
)
async def suspend_user(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Suspend a user account."""
    from sqlalchemy import select
    from src.models.user import User
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend yourself",
        )
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user.status = UserStatus.SUSPENDED
    await session.flush()
    
    return SuccessResponse(message="User suspended")


@router.post(
    "/users/{user_id}/activate",
    response_model=SuccessResponse,
    summary="Activate user",
    description="Activate a user account.",
)
async def activate_user(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Activate a user account."""
    from sqlalchemy import select
    from src.models.user import User
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user.status = UserStatus.ACTIVE
    await session.flush()
    
    return SuccessResponse(message="User activated")


# ============================================================================
# PICKUP MANAGEMENT
# ============================================================================

@router.get(
    "/pickups",
    response_model=PaginatedResponse[PickupResponse],
    summary="List pickups",
    description="Get paginated list of all pickups.",
)
async def list_pickups(
    current_user: CurrentUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: PickupStatus | None = Query(None),
):
    """List all pickups."""
    from sqlalchemy import select, func
    from src.models.pickup import Pickup
    
    query = select(Pickup)
    count_query = select(func.count(Pickup.id))
    
    if status:
        query = query.where(Pickup.status == status)
        count_query = count_query.where(Pickup.status == status)
    
    total = await session.scalar(count_query)
    
    result = await session.execute(
        query.order_by(Pickup.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    pickups = result.scalars().all()
    
    return PaginatedResponse(
        items=[PickupResponse.from_pickup(p) for p in pickups],
        total=total or 0,
        page=page,
        page_size=page_size,
        pages=((total or 0) + page_size - 1) // page_size if page_size else 0,
    )


@router.post(
    "/pickups/{pickup_id}/assign",
    response_model=SuccessResponse,
    summary="Assign pickup",
    description="Assign pickup to a driver.",
)
async def assign_pickup(
    pickup_id: uuid.UUID,
    driver_id: uuid.UUID = Query(...),
    current_user: CurrentUser = Depends(),
    session: DbSession = Depends(),
):
    """Assign pickup to driver."""
    from src.services import PickupService
    
    pickup_service = PickupService(session)
    pickup = await pickup_service.assign_driver(pickup_id, driver_id)
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not assign pickup",
        )
    
    return SuccessResponse(message="Pickup assigned")


# ============================================================================
# DRIVER MANAGEMENT
# ============================================================================

@router.get(
    "/drivers",
    response_model=PaginatedResponse[UserResponse],
    summary="List drivers",
    description="Get list of all drivers.",
)
async def list_drivers(
    current_user: CurrentUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all drivers."""
    from sqlalchemy import select, func
    from src.models.user import User
    
    query = select(User).where(User.role == UserRole.DRIVER)
    count_query = select(func.count(User.id)).where(User.role == UserRole.DRIVER)
    
    total = await session.scalar(count_query)
    
    result = await session.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    drivers = result.scalars().all()
    
    return PaginatedResponse(
        items=[UserResponse.model_validate(d) for d in drivers],
        total=total or 0,
        page=page,
        page_size=page_size,
        pages=((total or 0) + page_size - 1) // page_size if page_size else 0,
    )


@router.post(
    "/drivers/{driver_id}/approve",
    response_model=SuccessResponse,
    summary="Approve driver",
    description="Approve pending driver registration.",
)
async def approve_driver(
    driver_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Approve driver registration."""
    from sqlalchemy import select
    from src.models.user import User
    from src.models.pickup import DriverProfile, DriverStatus
    
    # Get driver
    result = await session.execute(
        select(User).where(User.id == driver_id, User.role == UserRole.DRIVER)
    )
    driver = result.scalar_one_or_none()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )
    
    # Update driver profile
    result = await session.execute(
        select(DriverProfile).where(DriverProfile.user_id == driver_id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        profile.status = DriverStatus.AVAILABLE
    
    driver.status = UserStatus.ACTIVE
    await session.flush()
    
    return SuccessResponse(message="Driver approved")
