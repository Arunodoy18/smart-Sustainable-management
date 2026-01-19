"""
Pickup Service
==============

Business logic for pickup scheduling and driver management.
"""

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.logging import get_logger
from src.models.pickup import (
    DriverLog,
    DriverProfile,
    DriverStatus,
    Pickup,
    PickupPriority,
    PickupStatus,
    Zone,
)
from src.models.user import User
from src.models.waste import WasteEntry, WasteEntryStatus
from src.schemas.pickup import (
    DriverPickupComplete,
    PickupRequest,
    PickupResponse,
    PickupUpdate,
)

logger = get_logger(__name__)


class PickupService:
    """
    Pickup scheduling and management service.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def request_pickup(
        self,
        user_id: UUID,
        data: PickupRequest,
    ) -> Pickup:
        """
        Request a waste pickup.
        
        Args:
            user_id: Requesting user ID
            data: Pickup request data
            
        Returns:
            Created pickup
        """
        # Verify waste entry exists and belongs to user
        result = await self.session.execute(
            select(WasteEntry).where(
                WasteEntry.id == data.waste_entry_id,
                WasteEntry.user_id == user_id,
            )
        )
        entry = result.scalar_one_or_none()

        if not entry:
            raise ValueError("Waste entry not found")

        # Check if pickup already exists
        result = await self.session.execute(
            select(Pickup).where(Pickup.waste_entry_id == data.waste_entry_id)
        )
        if result.scalar_one_or_none():
            raise ValueError("Pickup already requested for this entry")

        # Generate QR code
        qr_code = f"ECO-{secrets.token_hex(8).upper()}"

        pickup = Pickup(
            waste_entry_id=data.waste_entry_id,
            user_id=user_id,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            address_details=data.address_details,
            scheduled_date=data.scheduled_date,
            scheduled_time_start=data.scheduled_time_start,
            scheduled_time_end=data.scheduled_time_end,
            priority=data.priority,
            status=PickupStatus.REQUESTED,
            qr_code=qr_code,
        )

        self.session.add(pickup)

        # Update waste entry status
        entry.status = WasteEntryStatus.PICKUP_REQUESTED

        await self.session.flush()

        logger.info(
            "Pickup requested",
            pickup_id=str(pickup.id),
            user_id=str(user_id),
        )

        return pickup

    async def get_pickup(self, pickup_id: UUID) -> Pickup | None:
        """Get pickup by ID."""
        result = await self.session.execute(
            select(Pickup)
            .options(selectinload(Pickup.waste_entry))
            .where(Pickup.id == pickup_id)
        )
        return result.scalar_one_or_none()

    async def get_user_pickups(
        self,
        user_id: UUID,
        status: PickupStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Pickup], int]:
        """Get user's pickup history."""
        query = select(Pickup).where(Pickup.user_id == user_id)

        if status:
            query = query.where(Pickup.status == status)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        # Get pickups
        query = query.order_by(Pickup.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        pickups = list(result.scalars().all())

        return pickups, total

    async def update_pickup(
        self,
        pickup_id: UUID,
        data: PickupUpdate,
    ) -> Pickup | None:
        """Update pickup details."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            return None

        if pickup.status not in [PickupStatus.REQUESTED, PickupStatus.ASSIGNED]:
            raise ValueError("Cannot update pickup in current status")

        if data.address is not None:
            pickup.address = data.address
        if data.address_details is not None:
            pickup.address_details = data.address_details
        if data.scheduled_date is not None:
            pickup.scheduled_date = data.scheduled_date
        if data.scheduled_time_start is not None:
            pickup.scheduled_time_start = data.scheduled_time_start
        if data.scheduled_time_end is not None:
            pickup.scheduled_time_end = data.scheduled_time_end

        await self.session.flush()

        return pickup

    async def cancel_pickup(
        self,
        pickup_id: UUID,
        cancelled_by: UUID,
        reason: str,
    ) -> Pickup | None:
        """Cancel a pickup request."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            return None

        if pickup.status in [PickupStatus.COLLECTED, PickupStatus.CANCELLED]:
            raise ValueError("Cannot cancel pickup in current status")

        pickup.status = PickupStatus.CANCELLED
        pickup.cancelled_at = datetime.now(timezone.utc)
        pickup.cancelled_by_id = cancelled_by
        pickup.cancel_reason = reason

        # Update waste entry status
        result = await self.session.execute(
            select(WasteEntry).where(WasteEntry.id == pickup.waste_entry_id)
        )
        entry = result.scalar_one_or_none()
        if entry:
            entry.status = WasteEntryStatus.CLASSIFIED

        await self.session.flush()

        logger.info("Pickup cancelled", pickup_id=str(pickup_id))

        return pickup

    # =========================================================================
    # Driver Operations
    # =========================================================================

    async def get_available_pickups(
        self,
        driver_id: UUID,
        zone_id: UUID | None = None,
        limit: int = 50,
    ) -> list[Pickup]:
        """Get pickups available for assignment."""
        query = select(Pickup).where(
            Pickup.status == PickupStatus.REQUESTED,
        )

        # Filter by zone if specified
        # (Would need geo-filtering in production)

        query = query.order_by(
            Pickup.priority.desc(),
            Pickup.scheduled_date.asc().nullsfirst(),
            Pickup.created_at.asc(),
        )
        query = query.limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_driver_pickups(
        self,
        driver_id: UUID,
        status: PickupStatus | None = None,
        limit: int = 50,
    ) -> list[Pickup]:
        """Get pickups assigned to driver."""
        query = select(Pickup).where(Pickup.driver_id == driver_id)

        if status:
            query = query.where(Pickup.status == status)
        else:
            # By default, get active pickups
            query = query.where(
                Pickup.status.in_([
                    PickupStatus.ASSIGNED,
                    PickupStatus.EN_ROUTE,
                    PickupStatus.ARRIVED,
                ])
            )

        query = query.order_by(Pickup.scheduled_date.asc().nullsfirst())
        query = query.limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def assign_pickup(
        self,
        pickup_id: UUID,
        driver_id: UUID,
    ) -> Pickup:
        """Assign pickup to driver."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            raise ValueError("Pickup not found")

        if pickup.status != PickupStatus.REQUESTED:
            raise ValueError("Pickup is not available for assignment")

        # Verify driver exists and is approved
        result = await self.session.execute(
            select(DriverProfile).where(
                DriverProfile.user_id == driver_id,
                DriverProfile.status == DriverStatus.APPROVED,
            )
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise ValueError("Driver not found or not approved")

        pickup.driver_id = driver_id
        pickup.assigned_at = datetime.now(timezone.utc)
        pickup.status = PickupStatus.ASSIGNED

        # Log driver event
        log = DriverLog(
            driver_id=driver_id,
            event_type="pickup_assigned",
            pickup_id=pickup_id,
        )
        self.session.add(log)

        await self.session.flush()

        logger.info(
            "Pickup assigned",
            pickup_id=str(pickup_id),
            driver_id=str(driver_id),
        )

        return pickup

    async def driver_start_route(
        self,
        pickup_id: UUID,
        driver_id: UUID,
    ) -> Pickup:
        """Driver starts en route to pickup."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            raise ValueError("Pickup not found")

        if pickup.driver_id != driver_id:
            raise ValueError("Pickup is not assigned to this driver")

        if pickup.status != PickupStatus.ASSIGNED:
            raise ValueError("Invalid pickup status for this action")

        pickup.status = PickupStatus.EN_ROUTE
        pickup.en_route_at = datetime.now(timezone.utc)

        log = DriverLog(
            driver_id=driver_id,
            event_type="en_route",
            pickup_id=pickup_id,
        )
        self.session.add(log)

        await self.session.flush()

        return pickup

    async def driver_arrive(
        self,
        pickup_id: UUID,
        driver_id: UUID,
    ) -> Pickup:
        """Driver arrives at pickup location."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            raise ValueError("Pickup not found")

        if pickup.driver_id != driver_id:
            raise ValueError("Pickup is not assigned to this driver")

        if pickup.status != PickupStatus.EN_ROUTE:
            raise ValueError("Invalid pickup status for this action")

        pickup.status = PickupStatus.ARRIVED
        pickup.arrived_at = datetime.now(timezone.utc)

        log = DriverLog(
            driver_id=driver_id,
            event_type="arrived",
            pickup_id=pickup_id,
        )
        self.session.add(log)

        await self.session.flush()

        return pickup

    async def driver_complete_pickup(
        self,
        pickup_id: UUID,
        driver_id: UUID,
        data: DriverPickupComplete,
        proof_image_url: str | None = None,
    ) -> Pickup:
        """Driver completes pickup."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            raise ValueError("Pickup not found")

        if pickup.driver_id != driver_id:
            raise ValueError("Pickup is not assigned to this driver")

        if pickup.status != PickupStatus.ARRIVED:
            raise ValueError("Invalid pickup status for this action")

        pickup.status = PickupStatus.COLLECTED
        pickup.collected_at = datetime.now(timezone.utc)
        pickup.weight_collected_kg = data.weight_collected_kg
        pickup.proof_image_url = proof_image_url

        # Update waste entry
        result = await self.session.execute(
            select(WasteEntry).where(WasteEntry.id == pickup.waste_entry_id)
        )
        entry = result.scalar_one_or_none()
        if entry:
            entry.status = WasteEntryStatus.COLLECTED
            if data.weight_collected_kg:
                entry.estimated_weight_kg = data.weight_collected_kg

        # Update driver stats
        result = await self.session.execute(
            select(DriverProfile).where(DriverProfile.user_id == driver_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            profile.total_pickups += 1
            profile.successful_pickups += 1

        log = DriverLog(
            driver_id=driver_id,
            event_type="pickup_completed",
            pickup_id=pickup_id,
            metadata={"weight_kg": str(data.weight_collected_kg) if data.weight_collected_kg else None},
        )
        self.session.add(log)

        await self.session.flush()

        logger.info(
            "Pickup completed",
            pickup_id=str(pickup_id),
            driver_id=str(driver_id),
        )

        return pickup

    async def verify_qr_code(
        self,
        qr_code: str,
        driver_id: UUID,
    ) -> Pickup | None:
        """Verify QR code and mark as scanned."""
        result = await self.session.execute(
            select(Pickup).where(
                Pickup.qr_code == qr_code,
                Pickup.driver_id == driver_id,
            )
        )
        pickup = result.scalar_one_or_none()

        if pickup and not pickup.qr_scanned_at:
            pickup.qr_scanned_at = datetime.now(timezone.utc)
            await self.session.flush()

        return pickup

    async def rate_pickup(
        self,
        pickup_id: UUID,
        user_id: UUID,
        rating: int,
        feedback: str | None = None,
    ) -> Pickup:
        """User rates the pickup experience."""
        pickup = await self.get_pickup(pickup_id)
        if not pickup:
            raise ValueError("Pickup not found")

        if pickup.user_id != user_id:
            raise ValueError("Not authorized to rate this pickup")

        if pickup.status != PickupStatus.COLLECTED:
            raise ValueError("Can only rate completed pickups")

        if pickup.user_rating is not None:
            raise ValueError("Already rated")

        pickup.user_rating = rating
        pickup.user_feedback = feedback

        # Update driver rating
        if pickup.driver_id:
            await self._update_driver_rating(pickup.driver_id)

        await self.session.flush()

        return pickup

    async def _update_driver_rating(self, driver_id: UUID) -> None:
        """Recalculate driver's average rating."""
        result = await self.session.execute(
            select(func.avg(Pickup.user_rating))
            .where(
                Pickup.driver_id == driver_id,
                Pickup.user_rating.isnot(None),
            )
        )
        avg_rating = result.scalar()

        if avg_rating:
            result = await self.session.execute(
                select(DriverProfile).where(DriverProfile.user_id == driver_id)
            )
            profile = result.scalar_one_or_none()
            if profile:
                profile.rating = Decimal(str(round(avg_rating, 2)))

    # =========================================================================
    # Location & Availability
    # =========================================================================

    async def update_driver_location(
        self,
        driver_id: UUID,
        latitude: float,
        longitude: float,
    ) -> None:
        """Update driver's current location."""
        result = await self.session.execute(
            select(DriverProfile).where(DriverProfile.user_id == driver_id)
        )
        profile = result.scalar_one_or_none()

        if profile:
            profile.last_location_lat = latitude
            profile.last_location_lng = longitude
            profile.last_location_updated = datetime.now(timezone.utc)
            await self.session.flush()

    async def set_driver_availability(
        self,
        driver_id: UUID,
        is_available: bool,
    ) -> None:
        """Set driver availability status."""
        result = await self.session.execute(
            select(DriverProfile).where(DriverProfile.user_id == driver_id)
        )
        profile = result.scalar_one_or_none()

        if profile:
            profile.is_available = is_available
            await self.session.flush()

            log = DriverLog(
                driver_id=driver_id,
                event_type="availability_changed",
                metadata={"is_available": is_available},
            )
            self.session.add(log)
            await self.session.flush()

    async def get_available_drivers(
        self,
        zone_id: UUID | None = None,
    ) -> list[DriverProfile]:
        """Get available drivers, optionally filtered by zone."""
        query = select(DriverProfile).where(
            DriverProfile.status == DriverStatus.APPROVED,
            DriverProfile.is_available == True,
        )

        if zone_id:
            query = query.where(DriverProfile.assigned_zone_id == zone_id)

        result = await self.session.execute(query)
        return list(result.scalars().all())
