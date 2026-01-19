"""
Pickup Routes
=============

API endpoints for pickup scheduling and driver operations.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import (
    CurrentUser,
    DbSession,
    RequireDriver,
)
from src.models.pickup import PickupStatus
from src.models.user import User, UserRole
from src.schemas.common import PaginatedResponse, SuccessResponse
from src.schemas.pickup import (
    PickupRequest,
    PickupResponse,
    PickupDetail,
    DriverPickupComplete,
    DriverLocationUpdate,
)
from src.services import PickupService

router = APIRouter(prefix="/pickups", tags=["Pickups"])


# ============================================================================
# CITIZEN ENDPOINTS
# ============================================================================

@router.post(
    "/request",
    response_model=PickupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request pickup",
    description="Request a waste pickup at specified location.",
)
async def request_pickup(
    data: PickupRequest,
    current_user: CurrentUser,
    session: DbSession,
):
    """Request a new waste pickup."""
    pickup_service = PickupService(session)
    
    pickup = await pickup_service.request_pickup(
        user_id=current_user.id,
        data=data,
    )
    
    return PickupResponse.from_pickup(pickup)


@router.get(
    "/my-pickups",
    response_model=PaginatedResponse[PickupResponse],
    summary="Get my pickups",
    description="Get list of user's pickup requests.",
)
async def get_my_pickups(
    current_user: CurrentUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: PickupStatus | None = Query(None),
):
    """Get user's pickup history."""
    pickup_service = PickupService(session)
    
    pickups, total = await pickup_service.get_user_pickups(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
    )
    
    return PaginatedResponse(
        items=[PickupResponse.from_pickup(p) for p in pickups],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size if page_size else 0,
    )


@router.get(
    "/{pickup_id}",
    response_model=PickupDetail,
    summary="Get pickup details",
    description="Get details of a specific pickup.",
)
async def get_pickup(
    pickup_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Get pickup details."""
    pickup_service = PickupService(session)
    pickup = await pickup_service.get_pickup(pickup_id)
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pickup not found",
        )
    
    # Check access: owner, assigned driver, or admin
    is_owner = pickup.user_id == current_user.id
    is_assigned_driver = pickup.driver_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    
    if not (is_owner or is_assigned_driver or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return PickupDetail.from_pickup(pickup)


@router.post(
    "/{pickup_id}/cancel",
    response_model=SuccessResponse,
    summary="Cancel pickup",
    description="Cancel a pending pickup request.",
)
async def cancel_pickup(
    pickup_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Cancel a pickup request."""
    pickup_service = PickupService(session)
    pickup = await pickup_service.get_pickup(pickup_id)
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pickup not found",
        )
    
    if pickup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if pickup.status not in [PickupStatus.PENDING, PickupStatus.SCHEDULED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel pickup in current status",
        )
    
    await pickup_service.cancel_pickup(pickup_id)
    
    return SuccessResponse(message="Pickup cancelled")


@router.post(
    "/{pickup_id}/rate",
    response_model=SuccessResponse,
    summary="Rate pickup",
    description="Rate completed pickup service.",
)
async def rate_pickup(
    pickup_id: uuid.UUID,
    rating: int = Query(..., ge=1, le=5),
    feedback: str | None = Query(None, max_length=500),
    current_user: CurrentUser = Depends(),
    session: DbSession = Depends(),
):
    """Rate a completed pickup."""
    pickup_service = PickupService(session)
    pickup = await pickup_service.get_pickup(pickup_id)
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pickup not found",
        )
    
    if pickup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if pickup.status != PickupStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed pickups",
        )
    
    await pickup_service.rate_pickup(pickup_id, rating, feedback)
    
    return SuccessResponse(message="Rating submitted")


# ============================================================================
# DRIVER ENDPOINTS
# ============================================================================

@router.get(
    "/driver/available",
    response_model=list[PickupResponse],
    summary="Get available pickups",
    description="Get list of pickups available for assignment.",
    dependencies=[Depends(RequireDriver)],
)
async def get_available_pickups(
    current_user: CurrentUser,
    session: DbSession,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10.0, ge=1, le=50),
):
    """Get pickups available for assignment near driver."""
    pickup_service = PickupService(session)
    
    pickups = await pickup_service.get_available_pickups(
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )
    
    return [PickupResponse.from_pickup(p) for p in pickups]


@router.get(
    "/driver/assigned",
    response_model=list[PickupResponse],
    summary="Get assigned pickups",
    description="Get list of pickups assigned to driver.",
    dependencies=[Depends(RequireDriver)],
)
async def get_assigned_pickups(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get driver's assigned pickups."""
    pickup_service = PickupService(session)
    
    pickups = await pickup_service.get_driver_active_pickups(current_user.id)
    
    return [PickupResponse.from_pickup(p) for p in pickups]


@router.post(
    "/driver/{pickup_id}/accept",
    response_model=PickupResponse,
    summary="Accept pickup",
    description="Accept a pending pickup request.",
    dependencies=[Depends(RequireDriver)],
)
async def accept_pickup(
    pickup_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Accept a pickup as driver."""
    pickup_service = PickupService(session)
    
    pickup = await pickup_service.assign_driver(
        pickup_id=pickup_id,
        driver_id=current_user.id,
    )
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pickup not available for assignment",
        )
    
    return PickupResponse.from_pickup(pickup)


@router.post(
    "/driver/{pickup_id}/en-route",
    response_model=PickupResponse,
    summary="Mark en route",
    description="Mark that driver is on the way.",
    dependencies=[Depends(RequireDriver)],
)
async def mark_en_route(
    pickup_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Mark driver as en route to pickup."""
    pickup_service = PickupService(session)
    
    pickup = await pickup_service.mark_en_route(
        pickup_id=pickup_id,
        driver_id=current_user.id,
    )
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update pickup status",
        )
    
    return PickupResponse.from_pickup(pickup)


@router.post(
    "/driver/{pickup_id}/arrived",
    response_model=PickupResponse,
    summary="Mark arrived",
    description="Mark that driver has arrived at location.",
    dependencies=[Depends(RequireDriver)],
)
async def mark_arrived(
    pickup_id: uuid.UUID,
    current_user: CurrentUser,
    session: DbSession,
):
    """Mark driver as arrived at pickup location."""
    pickup_service = PickupService(session)
    
    pickup = await pickup_service.mark_arrived(
        pickup_id=pickup_id,
        driver_id=current_user.id,
    )
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update pickup status",
        )
    
    return PickupResponse.from_pickup(pickup)


@router.post(
    "/driver/{pickup_id}/complete",
    response_model=PickupResponse,
    summary="Complete pickup",
    description="Mark pickup as completed with verification.",
    dependencies=[Depends(RequireDriver)],
)
async def complete_pickup(
    pickup_id: uuid.UUID,
    data: DriverPickupComplete,
    current_user: CurrentUser,
    session: DbSession,
):
    """Complete a pickup with verification."""
    pickup_service = PickupService(session)
    
    pickup = await pickup_service.complete_pickup(
        pickup_id=pickup_id,
        driver_id=current_user.id,
        verification_code=data.verification_code,
        notes=data.notes,
        photo_url=data.photo_url,
    )
    
    if not pickup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete pickup",
        )
    
    return PickupResponse.from_pickup(pickup)


@router.post(
    "/driver/location",
    response_model=SuccessResponse,
    summary="Update location",
    description="Update driver's current location.",
    dependencies=[Depends(RequireDriver)],
)
async def update_driver_location(
    data: DriverLocationUpdate,
    current_user: CurrentUser,
    session: DbSession,
):
    """Update driver's live location."""
    pickup_service = PickupService(session)
    
    await pickup_service.update_driver_location(
        driver_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    
    return SuccessResponse(message="Location updated")


@router.get(
    "/driver/stats",
    summary="Get driver stats",
    description="Get driver's performance statistics.",
    dependencies=[Depends(RequireDriver)],
)
async def get_driver_stats(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get driver's statistics."""
    pickup_service = PickupService(session)
    
    stats = await pickup_service.get_driver_stats(current_user.id)
    
    return stats
