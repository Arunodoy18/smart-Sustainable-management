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
    PublicUser,
    RequireDriver,
)
from src.models.pickup import PickupStatus
from src.models.user import User, UserRole
from src.schemas.common import PaginatedResponse, SuccessResponse
from src.schemas.pickup import (
    PickupRequest,
    PickupResponse,
    PickupDetailResponse,
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
    current_user: PublicUser,
    session: DbSession,
):
    """Request a new waste pickup."""
    pickup_service = PickupService(session)

    try:
        pickup = await pickup_service.request_pickup(
            user_id=current_user.id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return PickupResponse.from_pickup(pickup)


@router.get(
    "/my-pickups",
    response_model=PaginatedResponse[PickupResponse],
    summary="Get my pickups",
    description="Get list of user's pickup requests.",
)
async def get_my_pickups(
    current_user: PublicUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    pickup_status: PickupStatus | None = Query(None, alias="status"),
):
    """Get user's pickup history."""
    pickup_service = PickupService(session)

    # Convert page/page_size to limit/offset for service
    limit = page_size
    offset = (page - 1) * page_size

    pickups, total = await pickup_service.get_user_pickups(
        user_id=current_user.id,
        status=pickup_status,
        limit=limit,
        offset=offset,
    )

    return PaginatedResponse(
        items=[PickupResponse.from_pickup(p) for p in pickups],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 0,
    )


@router.get(
    "/{pickup_id}",
    response_model=PickupDetailResponse,
    summary="Get pickup details",
    description="Get details of a specific pickup.",
)
async def get_pickup(
    pickup_id: uuid.UUID,
    current_user: PublicUser,
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

    return PickupDetailResponse.from_pickup(pickup)


@router.post(
    "/{pickup_id}/cancel",
    response_model=SuccessResponse,
    summary="Cancel pickup",
    description="Cancel a pending pickup request.",
)
async def cancel_pickup(
    pickup_id: uuid.UUID,
    current_user: PublicUser,
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

    if pickup.status not in [PickupStatus.REQUESTED, PickupStatus.ASSIGNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel pickup in current status",
        )

    try:
        await pickup_service.cancel_pickup(
            pickup_id=pickup_id,
            cancelled_by=current_user.id,
            reason="Cancelled by user",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return SuccessResponse(message="Pickup cancelled")


@router.post(
    "/{pickup_id}/rate",
    response_model=SuccessResponse,
    summary="Rate pickup",
    description="Rate completed pickup service.",
)
async def rate_pickup(
    pickup_id: uuid.UUID,
    current_user: PublicUser,
    session: DbSession,
    rating: int = Query(..., ge=1, le=5),
    feedback: str | None = Query(None, max_length=500),
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

    if pickup.status != PickupStatus.COLLECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed pickups",
        )

    try:
        await pickup_service.rate_pickup(
            pickup_id=pickup_id,
            user_id=current_user.id,
            rating=rating,
            feedback=feedback,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

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
    current_user: PublicUser,
    session: DbSession,
    latitude: float = Query(None, ge=-90, le=90),
    longitude: float = Query(None, ge=-180, le=180),
    radius_km: float = Query(10.0, ge=1, le=50),
):
    """Get pickups available for assignment near driver."""
    pickup_service = PickupService(session)

    pickups = await pickup_service.get_available_pickups(
        driver_id=current_user.id,
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
    current_user: PublicUser,
    session: DbSession,
):
    """Get driver's assigned pickups."""
    pickup_service = PickupService(session)

    pickups = await pickup_service.get_driver_pickups(
        driver_id=current_user.id,
    )

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
    current_user: PublicUser,
    session: DbSession,
):
    """Accept a pickup as driver."""
    pickup_service = PickupService(session)

    try:
        pickup = await pickup_service.assign_pickup(
            pickup_id=pickup_id,
            driver_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    current_user: PublicUser,
    session: DbSession,
):
    """Mark driver as en route to pickup."""
    pickup_service = PickupService(session)

    try:
        pickup = await pickup_service.driver_start_route(
            pickup_id=pickup_id,
            driver_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    current_user: PublicUser,
    session: DbSession,
):
    """Mark driver as arrived at pickup location."""
    pickup_service = PickupService(session)

    try:
        pickup = await pickup_service.driver_arrive(
            pickup_id=pickup_id,
            driver_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    current_user: PublicUser,
    session: DbSession,
):
    """Complete a pickup with verification."""
    pickup_service = PickupService(session)

    try:
        pickup = await pickup_service.driver_complete_pickup(
            pickup_id=pickup_id,
            driver_id=current_user.id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    current_user: PublicUser,
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
    current_user: PublicUser,
    session: DbSession,
):
    """Get driver's statistics."""
    pickup_service = PickupService(session)

    # Return basic stats from driver pickups
    pickups = await pickup_service.get_driver_pickups(
        driver_id=current_user.id,
        limit=1000,
    )

    completed = [p for p in pickups if p.status == PickupStatus.COLLECTED]

    return {
        "total_pickups": len(pickups),
        "completed_pickups": len(completed),
        "active_pickups": len([p for p in pickups if p.status in [
            PickupStatus.ASSIGNED, PickupStatus.EN_ROUTE, PickupStatus.ARRIVED
        ]]),
    }
