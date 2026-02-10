"""
Waste Management Service
========================

Business logic for waste entries and classifications.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.logging import get_logger
from src.models.waste import (
    BinType,
    Classification,
    ClassificationConfidence,
    Recommendation,
    WasteCategory,
    WasteCategoryRule,
    WasteEntry,
    WasteEntryStatus,
    WasteSubCategory,
)
from src.schemas.waste import (
    ClassificationResult,
    WasteEntryCreate,
    WasteEntryUpdate,
    WasteHistorySummary,
)

logger = get_logger(__name__)


class WasteService:
    """
    Waste management service.
    
    Handles waste entry creation, classification, and history.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_entry(
        self,
        user_id: UUID,
        image_url: str,
        data: WasteEntryCreate,
        thumbnail_url: str | None = None,
    ) -> WasteEntry:
        """
        Create a new waste entry.
        
        Args:
            user_id: Owner user ID
            image_url: URL of uploaded image
            data: Entry creation data
            thumbnail_url: Optional thumbnail URL
            
        Returns:
            Created waste entry
        """
        entry = WasteEntry(
            user_id=user_id,
            image_url=image_url,
            image_thumbnail_url=thumbnail_url,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            user_notes=data.user_notes,
            status=WasteEntryStatus.PENDING,
        )

        self.session.add(entry)
        await self.session.flush()

        logger.info(
            "Waste entry created",
            entry_id=str(entry.id),
            user_id=str(user_id),
        )

        return entry

    async def get_entry(self, entry_id: UUID) -> WasteEntry | None:
        """Get waste entry by ID."""
        result = await self.session.execute(
            select(WasteEntry)
            .options(
                selectinload(WasteEntry.classification),
                selectinload(WasteEntry.recommendations),
                selectinload(WasteEntry.pickup),
            )
            .where(WasteEntry.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def get_user_entries(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
        category: WasteCategory | None = None,
        status: WasteEntryStatus | None = None,
    ) -> tuple[list[WasteEntry], int]:
        """
        Get user's waste entries with pagination.
        
        Returns:
            Tuple of (entries, total_count)
        """
        query = select(WasteEntry).where(WasteEntry.user_id == user_id)

        if category:
            query = query.where(WasteEntry.category == category)
        if status:
            query = query.where(WasteEntry.status == status)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        # Get entries with classification eagerly loaded
        query = query.order_by(WasteEntry.created_at.desc())
        query = query.options(selectinload(WasteEntry.classification))
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        entries = list(result.scalars().all())

        return entries, total

    async def update_entry(
        self,
        entry_id: UUID,
        data: WasteEntryUpdate,
    ) -> WasteEntry | None:
        """Update waste entry."""
        entry = await self.get_entry(entry_id)
        if not entry:
            return None

        if data.user_verified is not None:
            entry.user_verified = data.user_verified
        if data.user_override_category is not None:
            entry.user_override_category = data.user_override_category
            entry.category = data.user_override_category
            # Re-calculate bin type
            rule = await self._get_category_rule(data.user_override_category)
            if rule:
                entry.bin_type = rule.bin_type
        if data.user_notes is not None:
            entry.user_notes = data.user_notes

        await self.session.flush()

        logger.info("Waste entry updated", entry_id=str(entry_id))

        return entry

    async def classify_entry(self, entry_id: UUID) -> Classification:
        """
        Run AI classification on a waste entry.
        
        Args:
            entry_id: ID of the waste entry to classify
            
        Returns:
            Classification record
        """
        import time
        from src.ml import ClassificationPipeline
        from src.services.storage_service import storage
        
        entry = await self.get_entry(entry_id)
        if not entry:
            raise ValueError(f"Waste entry {entry_id} not found")
        
        # Get image data
        image_data = None
        if entry.image_url:
            # Extract key from URL
            if entry.image_url.startswith("/storage/"):
                key = entry.image_url.replace("/storage/", "")
                image_data = await storage.get_file(key)
            else:
                # For external URLs, we'd need to fetch - for now use mock
                pass
        
        # Run classification
        start_time = time.time()
        pipeline = ClassificationPipeline.get_instance()
        result = await pipeline.classify(image_data)
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Determine category rule for bin type
        rule = await self._get_category_rule(result.category, result.subcategory)
        bin_type = rule.bin_type if rule else BinType.BLACK
        
        # Update entry with classification
        entry.category = result.category
        entry.subcategory = result.subcategory
        entry.bin_type = bin_type
        entry.ai_confidence = result.confidence
        entry.confidence_tier = result.confidence_tier
        entry.ai_raw_predictions = result.all_predictions
        entry.status = WasteEntryStatus.CLASSIFIED

        # Create detailed classification record
        classification = Classification(
            waste_entry_id=entry.id,
            primary_model_name=result.primary_model,
            primary_model_version=result.primary_model_version,
            primary_predictions=result.all_predictions,
            primary_confidence=result.confidence,
            primary_category=result.category,
            processing_time_ms=processing_time_ms,
            requires_manual_review=result.confidence_tier == ClassificationConfidence.LOW,
        )

        self.session.add(classification)

        # Generate recommendations
        await self._generate_recommendations(entry)

        # Calculate environmental impact
        await self._calculate_impact(entry)

        await self.session.flush()

        logger.info(
            "Classification completed",
            entry_id=str(entry_id),
            category=result.category.value,
            confidence=result.confidence,
            processing_time_ms=processing_time_ms,
        )

        return classification

    async def get_recommendations(self, entry_id: UUID) -> list[Recommendation]:
        """Get recommendations for a waste entry."""
        result = await self.session.execute(
            select(Recommendation)
            .where(Recommendation.waste_entry_id == entry_id)
            .order_by(Recommendation.priority)
        )
        return list(result.scalars().all())

    async def apply_classification(
        self,
        entry_id: UUID,
        classification_result: ClassificationResult,
        model_name: str,
        model_version: str,
        processing_time_ms: int,
    ) -> WasteEntry:
        """
        Apply AI classification to waste entry.
        
        Args:
            entry_id: Waste entry ID
            classification_result: Classification from ML pipeline
            model_name: Name of primary model
            model_version: Version of primary model
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            Updated waste entry
        """
        entry = await self.get_entry(entry_id)
        if not entry:
            raise ValueError(f"Waste entry {entry_id} not found")

        # Update entry with classification
        entry.category = classification_result.category
        entry.subcategory = classification_result.subcategory
        entry.bin_type = classification_result.bin_type
        entry.ai_confidence = classification_result.confidence
        entry.confidence_tier = classification_result.confidence_tier
        entry.ai_raw_predictions = classification_result.all_predictions
        entry.status = WasteEntryStatus.CLASSIFIED

        # Create detailed classification record
        classification = Classification(
            waste_entry_id=entry.id,
            primary_model_name=model_name,
            primary_model_version=model_version,
            primary_predictions=classification_result.all_predictions,
            primary_confidence=classification_result.confidence,
            primary_category=classification_result.category,
            processing_time_ms=processing_time_ms,
            requires_manual_review=classification_result.confidence_tier == ClassificationConfidence.LOW,
        )

        self.session.add(classification)

        # Generate recommendations
        await self._generate_recommendations(entry)

        # Calculate environmental impact
        await self._calculate_impact(entry)

        await self.session.flush()

        logger.info(
            "Classification applied",
            entry_id=str(entry_id),
            category=classification_result.category.value,
            confidence=classification_result.confidence,
        )

        return entry

    async def _generate_recommendations(self, entry: WasteEntry) -> None:
        """Generate disposal recommendations for entry."""
        if not entry.category:
            return

        rule = await self._get_category_rule(entry.category, entry.subcategory)
        if not rule:
            return

        # Primary disposal recommendation
        disposal_rec = Recommendation(
            waste_entry_id=entry.id,
            title=f"Dispose in {entry.bin_type.value.title()} Bin",
            description=rule.disposal_instructions,
            recommendation_type="disposal",
            priority=0,
            icon="trash",
        )
        self.session.add(disposal_rec)

        # Recycling info if applicable
        if rule.recyclable:
            recycling_rec = Recommendation(
                waste_entry_id=entry.id,
                title="This item is recyclable! ♻️",
                description="Make sure it's clean and dry before disposal. Check local recycling guidelines.",
                recommendation_type="recycling",
                priority=1,
                icon="recycle",
            )
            self.session.add(recycling_rec)

        # Special handling warning
        if rule.special_handling:
            special_rec = Recommendation(
                waste_entry_id=entry.id,
                title="⚠️ Special Handling Required",
                description="This item requires special disposal. Do not place in regular bins.",
                recommendation_type="special_handling",
                priority=-1,
                icon="warning",
            )
            self.session.add(special_rec)

        # Pickup suggestion for large items
        if rule.requires_pickup:
            pickup_rec = Recommendation(
                waste_entry_id=entry.id,
                title="Request a Pickup",
                description="This item is too large for regular disposal. Request a pickup for proper handling.",
                recommendation_type="pickup",
                priority=2,
                icon="truck",
                action_label="Request Pickup",
            )
            self.session.add(pickup_rec)

    async def _calculate_impact(self, entry: WasteEntry) -> None:
        """Calculate environmental impact for entry."""
        if not entry.category:
            return

        rule = await self._get_category_rule(entry.category, entry.subcategory)
        if not rule:
            return

        # Estimate weight based on category (simplified)
        estimated_weights = {
            WasteCategory.ORGANIC: Decimal("0.5"),
            WasteCategory.RECYCLABLE: Decimal("0.3"),
            WasteCategory.HAZARDOUS: Decimal("0.2"),
            WasteCategory.ELECTRONIC: Decimal("1.0"),
            WasteCategory.GENERAL: Decimal("0.4"),
            WasteCategory.MEDICAL: Decimal("0.1"),
        }

        entry.estimated_weight_kg = estimated_weights.get(
            entry.category, Decimal("0.3")
        )

        # Calculate CO2 saved
        if rule.recyclable or rule.compostable:
            entry.co2_saved_kg = entry.estimated_weight_kg * rule.co2_factor_kg_per_kg

    async def _get_category_rule(
        self,
        category: WasteCategory,
        subcategory: WasteSubCategory | None = None,
    ) -> WasteCategoryRule | None:
        """Get category rule for waste classification."""
        # Try specific subcategory first
        if subcategory:
            result = await self.session.execute(
                select(WasteCategoryRule).where(
                    WasteCategoryRule.category == category,
                    WasteCategoryRule.subcategory == subcategory,
                    WasteCategoryRule.is_active == True,
                )
            )
            rule = result.scalar_one_or_none()
            if rule:
                return rule

        # Fallback to category-level rule
        result = await self.session.execute(
            select(WasteCategoryRule).where(
                WasteCategoryRule.category == category,
                WasteCategoryRule.subcategory == None,
                WasteCategoryRule.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def get_user_history_summary(self, user_id: UUID) -> WasteHistorySummary:
        """Get summary of user's waste history."""
        # Get entries count by category
        result = await self.session.execute(
            select(
                WasteEntry.category,
                func.count(WasteEntry.id).label("count"),
            )
            .where(WasteEntry.user_id == user_id)
            .group_by(WasteEntry.category)
        )
        category_counts = {row.category.value: row.count for row in result if row.category}

        # Get totals
        result = await self.session.execute(
            select(
                func.count(WasteEntry.id).label("total"),
                func.sum(WasteEntry.estimated_weight_kg).label("weight"),
                func.sum(WasteEntry.co2_saved_kg).label("co2"),
            )
            .where(WasteEntry.user_id == user_id)
        )
        row = result.one()

        total = row.total or 0
        recyclable_count = category_counts.get("recyclable", 0) + category_counts.get("organic", 0)
        recycling_rate = (recyclable_count / total * 100) if total > 0 else 0

        return WasteHistorySummary(
            total_entries=total,
            entries_by_category=category_counts,
            total_weight_kg=row.weight or Decimal("0"),
            total_co2_saved_kg=row.co2 or Decimal("0"),
            recycling_rate=recycling_rate,
        )

    async def calculate_user_impact(self, user_id: UUID) -> dict[str, Any]:
        """
        Calculate user's total environmental impact.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with impact statistics
        """
        result = await self.session.execute(
            select(
                func.count(WasteEntry.id).label("total_entries"),
                func.sum(WasteEntry.estimated_weight_kg).label("total_weight"),
                func.sum(WasteEntry.co2_saved_kg).label("total_co2_saved"),
            )
            .where(WasteEntry.user_id == user_id)
        )
        row = result.one()
        
        return {
            "total_entries": row.total_entries or 0,
            "total_weight_kg": float(row.total_weight or 0),
            "co2_saved_kg": float(row.total_co2_saved or 0),
            "trees_equivalent": round(float(row.total_co2_saved or 0) * 0.05, 1),  # Rough estimate
        }

    async def get_bin_types_info(self) -> list[dict[str, Any]]:
        """Get information about all bin types."""
        return [
            {
                "type": BinType.GREEN,
                "name": "Green Bin",
                "description": "Organic waste - food scraps, garden waste",
                "color": "#22C55E",
                "icon": "leaf",
                "accepted_categories": [WasteCategory.ORGANIC],
            },
            {
                "type": BinType.BLUE,
                "name": "Blue Bin",
                "description": "Recyclables - plastic, paper, glass, metal",
                "color": "#3B82F6",
                "icon": "recycle",
                "accepted_categories": [WasteCategory.RECYCLABLE],
            },
            {
                "type": BinType.RED,
                "name": "Red Bin",
                "description": "Hazardous waste - chemicals, batteries, paint",
                "color": "#EF4444",
                "icon": "alert-triangle",
                "accepted_categories": [WasteCategory.HAZARDOUS],
            },
            {
                "type": BinType.BLACK,
                "name": "Black Bin",
                "description": "General waste - non-recyclable items",
                "color": "#1F2937",
                "icon": "trash",
                "accepted_categories": [WasteCategory.GENERAL],
            },
            {
                "type": BinType.YELLOW,
                "name": "Yellow Bin",
                "description": "Medical waste - sharps, pharmaceuticals",
                "color": "#EAB308",
                "icon": "plus-circle",
                "accepted_categories": [WasteCategory.MEDICAL],
            },
            {
                "type": BinType.SPECIAL,
                "name": "Special Collection",
                "description": "E-waste, furniture, large items",
                "color": "#8B5CF6",
                "icon": "package",
                "accepted_categories": [WasteCategory.ELECTRONIC],
            },
        ]
