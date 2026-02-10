"""
Waste Management Routes
=======================

API endpoints for waste entry and classification.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status

from src.api.deps import CurrentUser, DbSession, OptionalUser, PublicUser, get_optional_user
from src.models.waste import ClassificationConfidence, WasteCategory
from src.schemas.common import PaginatedResponse
from src.schemas.waste import (
    ClassificationResult,
    WasteEntryCreate,
    WasteEntryResponse,
    WasteEntryDetailResponse,
    ClassificationRequest,
    ManualClassificationRequest,
)
from src.services import WasteService
from src.services.rewards_service import RewardsService, RewardType
from src.services.storage_service import storage, StorageError

router = APIRouter(prefix="/waste", tags=["Waste Management"])


@router.post(
    "/upload",
    response_model=WasteEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload waste image",
    description="Upload a waste item image for classification.",
)
async def upload_waste_image(
    current_user: PublicUser,
    session: DbSession,
    file: UploadFile = File(..., description="Waste item image"),
    latitude: float | None = Query(None, ge=-90, le=90),
    longitude: float | None = Query(None, ge=-180, le=180),
    address: str | None = Query(None, max_length=500),
    notes: str | None = Query(None, max_length=1000),
):
    """Upload waste image and get AI classification."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )
    
    # Read file content
    content = await file.read()
    
    # Size limit: 10MB
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image must be under 10MB",
        )
    
    # Upload image to storage
    try:
        image_url, thumbnail_url = await storage.upload_image(
            content=content,
            filename=file.filename or "upload.jpg",
            user_id=str(current_user.id),
        )
    except StorageError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}",
        )
    
    waste_service = WasteService(session)
    rewards_service = RewardsService(session)
    
    # Create waste entry
    entry_data = WasteEntryCreate(
        latitude=latitude,
        longitude=longitude,
        address=address,
        user_notes=notes,
    )
    
    entry = await waste_service.create_entry(
        user_id=current_user.id,
        image_url=image_url,
        data=entry_data,
        thumbnail_url=thumbnail_url,
    )
    
    # Run AI classification
    classification = await waste_service.classify_entry(entry.id)
    
    # Award points for classification (base points based on confidence)
    points_awarded = 0
    if entry.confidence_tier == ClassificationConfidence.HIGH:
        points_awarded = 15  # High confidence = 15 points
    elif entry.confidence_tier == ClassificationConfidence.MEDIUM:
        points_awarded = 10  # Medium confidence = 10 points
    elif entry.confidence_tier == ClassificationConfidence.LOW:
        points_awarded = 5   # Low confidence = 5 points
    
    if points_awarded > 0:
        await rewards_service.award_points(
            user_id=current_user.id,
            points=points_awarded,
            reward_type=RewardType.RECYCLING_POINTS,
            description=f"Waste classified as {entry.category.value}",
            waste_entry_id=entry.id,
        )
    
    # Commit all changes
    await session.commit()
    await session.refresh(entry)
    
    return WasteEntryResponse.from_entry(entry, classification)


@router.get(
    "/history",
    response_model=PaginatedResponse[WasteEntryResponse],
    summary="Get waste history",
    description="Get paginated list of user's waste entries.",
)
async def get_waste_history(
    current_user: PublicUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None, description="Filter by category"),
):
    """Get user's waste entry history."""
    waste_service = WasteService(session)
    
    # Convert page/page_size to limit/offset
    offset = (page - 1) * page_size
    
    # Convert category string to enum if provided
    category_enum = None
    if category:
        try:
            category_enum = WasteCategory(category)
        except ValueError:
            pass  # Invalid category, ignore filter
    
    entries, total = await waste_service.get_user_entries(
        user_id=current_user.id,
        limit=page_size,
        offset=offset,
        category=category_enum,
    )
    
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    
    return PaginatedResponse(
        items=[WasteEntryResponse.from_entry(e, e.classification) for e in entries],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{entry_id}",
    response_model=WasteEntryDetailResponse,
    summary="Get waste entry",
    description="Get details of a specific waste entry.",
)
async def get_waste_entry(
    entry_id: uuid.UUID,
    current_user: PublicUser,
    session: DbSession,
):
    """Get waste entry details."""
    waste_service = WasteService(session)
    entry = await waste_service.get_entry(entry_id)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waste entry not found",
        )
    
    # Check ownership (unless admin)
    from src.models.user import UserRole
    if entry.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Get recommendations
    recommendations = await waste_service.get_recommendations(entry.id)
    
    # Build response
    from src.schemas.waste import RecommendationResponse
    response = WasteEntryResponse.from_entry(entry, entry.classification)
    
    return WasteEntryDetailResponse(
        **response.model_dump(),
        recommendations=[
            RecommendationResponse(
                id=r.id,
                title=r.title,
                description=r.description,
                recommendation_type=r.recommendation_type,
                priority=r.priority,
                icon=r.icon,
                action_url=r.action_url,
                action_label=r.action_label,
            ) for r in recommendations
        ],
    )


@router.post(
    "/{entry_id}/reclassify",
    response_model=ClassificationResult,
    summary="Reclassify waste entry",
    description="Re-run AI classification on existing entry.",
)
async def reclassify_waste(
    entry_id: uuid.UUID,
    current_user: PublicUser,
    session: DbSession,
):
    """Re-run classification on existing entry."""
    waste_service = WasteService(session)
    entry = await waste_service.get_entry(entry_id)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waste entry not found",
        )
    
    if entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    classification = await waste_service.classify_entry(entry_id)
    
    return ClassificationResult(
        category=classification.category,
        subcategory=classification.subcategory,
        bin_type=classification.bin_type,
        confidence=classification.confidence,
        confidence_tier=classification.confidence_tier,
        reasoning=classification.reasoning,
        is_hazardous=classification.is_hazardous,
        requires_special_handling=classification.requires_special_handling,
        handling_instructions=classification.handling_instructions,
    )


@router.post(
    "/{entry_id}/manual-classify",
    response_model=WasteEntryResponse,
    summary="Manually classify waste",
    description="Provide manual classification for low-confidence entries.",
)
async def manual_classify(
    entry_id: uuid.UUID,
    data: ManualClassificationRequest,
    current_user: PublicUser,
    session: DbSession,
):
    """Manually classify a waste entry."""
    waste_service = WasteService(session)
    entry = await waste_service.get_entry(entry_id)
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waste entry not found",
        )
    
    if entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Only allow manual classification for low-confidence entries
    if entry.classification and entry.classification.confidence_tier == ClassificationConfidence.HIGH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entry already has high-confidence classification",
        )
    
    classification = await waste_service.apply_manual_classification(
        entry_id=entry_id,
        category=data.category,
        subcategory=data.subcategory,
        user_id=current_user.id,
    )
    
    # Refresh entry
    entry = await waste_service.get_entry(entry_id)
    
    return WasteEntryResponse.from_entry(entry, classification)


@router.get(
    "/stats/impact",
    summary="Get environmental impact",
    description="Get user's environmental impact statistics.",
)
async def get_impact_stats(
    current_user: PublicUser,
    session: DbSession,
):
    """Get user's environmental impact."""
    waste_service = WasteService(session)
    impact = await waste_service.calculate_user_impact(current_user.id)
    
    return impact


@router.get(
    "/categories/all",
    summary="Get waste categories",
    description="Get list of all waste categories and subcategories.",
)
async def get_categories():
    """Get all waste categories."""
    from src.models.waste import WasteCategory, WasteSubCategory, BinType
    
    return {
        "categories": [
            {
                "value": c.value,
                "label": c.value.replace("_", " ").title(),
            }
            for c in WasteCategory
        ],
        "subcategories": [
            {
                "value": s.value,
                "label": s.value.replace("_", " ").title(),
            }
            for s in WasteSubCategory
        ],
        "bin_types": [
            {
                "value": b.value,
                "label": b.value.replace("_", " ").title(),
                "color": _get_bin_color(b),
            }
            for b in BinType
        ],
    }


def _get_bin_color(bin_type) -> str:
    """Get color for bin type."""
    from src.models.waste import BinType
    
    colors = {
        BinType.GREEN: "#22c55e",
        BinType.BLUE: "#3b82f6",
        BinType.BLACK: "#1f2937",
        BinType.YELLOW: "#eab308",
        BinType.RED: "#ef4444",
        BinType.SPECIAL: "#8b5cf6",
    }
    return colors.get(bin_type, "#6b7280")
