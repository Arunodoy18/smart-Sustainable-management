"""
Rewards Routes
==============

API endpoints for gamification and rewards.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import CurrentUser, DbSession, PublicUser
from src.schemas.common import PaginatedResponse
from src.schemas.rewards import (
    RewardResponse,
    RewardSummary,
    StreakResponse,
    AchievementResponse,
    LeaderboardEntry,
    LeaderboardResponse,
)
from src.services import RewardsService

router = APIRouter(prefix="/rewards", tags=["Rewards & Gamification"])


@router.get(
    "/summary",
    response_model=RewardSummary,
    summary="Get reward summary",
    description="Get user's reward points and level summary.",
)
async def get_reward_summary(
    current_user: PublicUser,
    session: DbSession,
):
    """Get user's reward summary."""
    rewards_service = RewardsService(session)
    summary = await rewards_service.get_user_reward_summary(current_user.id)
    
    return summary


@router.get(
    "/history",
    response_model=PaginatedResponse[RewardResponse],
    summary="Get reward history",
    description="Get paginated list of reward transactions.",
)
async def get_reward_history(
    current_user: PublicUser,
    session: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get user's reward transaction history."""
    rewards_service = RewardsService(session)
    
    rewards, total = await rewards_service.get_user_rewards(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    
    return PaginatedResponse(
        items=[RewardResponse.from_reward(r) for r in rewards],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size if page_size else 0,
    )


@router.get(
    "/streak",
    response_model=StreakResponse,
    summary="Get streak info",
    description="Get user's current streak information.",
)
async def get_streak(
    current_user: PublicUser,
    session: DbSession,
):
    """Get user's streak information."""
    rewards_service = RewardsService(session)
    streak = await rewards_service.get_user_streak(current_user.id)
    
    if not streak:
        return StreakResponse(
            current_streak=0,
            longest_streak=0,
            last_activity_date=None,
            next_milestone=7,
            progress_to_next=0.0,
        )
    
    return StreakResponse.from_streak(streak)


@router.get(
    "/achievements",
    response_model=list[AchievementResponse],
    summary="Get achievements",
    description="Get all achievements and user's progress.",
)
async def get_achievements(
    current_user: PublicUser,
    session: DbSession,
):
    """Get all achievements with user's progress."""
    rewards_service = RewardsService(session)
    achievements = await rewards_service.get_all_achievements(current_user.id)
    
    return [AchievementResponse.from_achievement(a, unlocked) for a, unlocked in achievements]


@router.get(
    "/achievements/recent",
    response_model=list[AchievementResponse],
    summary="Get recent achievements",
    description="Get recently unlocked achievements.",
)
async def get_recent_achievements(
    current_user: PublicUser,
    session: DbSession,
    limit: int = Query(5, ge=1, le=20),
):
    """Get recently unlocked achievements."""
    rewards_service = RewardsService(session)
    achievements = await rewards_service.get_recent_achievements(
        user_id=current_user.id,
        limit=limit,
    )
    
    return [AchievementResponse.from_achievement(a, unlocked=True) for a in achievements]


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get leaderboard",
    description="Get points leaderboard.",
)
async def get_leaderboard(
    current_user: PublicUser,
    session: DbSession,
    period: str = Query("weekly", pattern="^(daily|weekly|monthly|all_time)$"),
    limit: int = Query(10, ge=1, le=100),
):
    """Get leaderboard rankings."""
    rewards_service = RewardsService(session)
    
    entries, user_rank = await rewards_service.get_leaderboard(
        user_id=current_user.id,
        period=period,
        limit=limit,
    )
    
    return LeaderboardResponse(
        entries=entries,
        user_rank=user_rank,
        period=period,
    )


@router.get(
    "/levels",
    summary="Get level info",
    description="Get information about reward levels.",
)
async def get_levels():
    """Get level thresholds and benefits."""
    return {
        "levels": [
            {
                "level": 1,
                "name": "Eco Starter",
                "min_points": 0,
                "benefits": ["Basic rewards", "Standard pickup scheduling"],
            },
            {
                "level": 2,
                "name": "Green Guardian",
                "min_points": 500,
                "benefits": ["Priority pickup scheduling", "5% bonus points"],
            },
            {
                "level": 3,
                "name": "Sustainability Hero",
                "min_points": 1500,
                "benefits": ["Express pickup option", "10% bonus points", "Exclusive badges"],
            },
            {
                "level": 4,
                "name": "Eco Champion",
                "min_points": 3500,
                "benefits": ["Free monthly pickup", "15% bonus points", "Early access features"],
            },
            {
                "level": 5,
                "name": "Planet Protector",
                "min_points": 7000,
                "benefits": ["Unlimited free pickups", "20% bonus points", "VIP support", "Special recognition"],
            },
        ],
    }


@router.get(
    "/point-values",
    summary="Get point values",
    description="Get points awarded for different actions.",
)
async def get_point_values():
    """Get point values for actions."""
    from src.models.rewards import RewardType
    
    return {
        "actions": [
            {"action": RewardType.WASTE_ENTRY.value, "points": 10, "description": "Upload waste image"},
            {"action": RewardType.CORRECT_CLASSIFICATION.value, "points": 5, "description": "AI classification verified"},
            {"action": RewardType.PICKUP_COMPLETED.value, "points": 25, "description": "Complete a pickup"},
            {"action": RewardType.DAILY_STREAK.value, "points": 15, "description": "Daily activity bonus"},
            {"action": RewardType.WEEKLY_STREAK.value, "points": 50, "description": "7-day streak bonus"},
            {"action": RewardType.REFERRAL.value, "points": 100, "description": "Refer a friend"},
            {"action": RewardType.ACHIEVEMENT.value, "points": "varies", "description": "Unlock achievement"},
        ],
        "multipliers": [
            {"name": "Level 2 bonus", "multiplier": 1.05},
            {"name": "Level 3 bonus", "multiplier": 1.10},
            {"name": "Level 4 bonus", "multiplier": 1.15},
            {"name": "Level 5 bonus", "multiplier": 1.20},
            {"name": "Weekend bonus", "multiplier": 1.25},
        ],
    }


@router.post(
    "/claim-daily",
    response_model=RewardResponse,
    summary="Claim daily bonus",
    description="Claim daily login bonus.",
)
async def claim_daily_bonus(
    current_user: PublicUser,
    session: DbSession,
):
    """Claim daily login bonus."""
    rewards_service = RewardsService(session)
    
    reward = await rewards_service.claim_daily_bonus(current_user.id)
    
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Daily bonus already claimed today",
        )
    
    return RewardResponse.from_reward(reward)
