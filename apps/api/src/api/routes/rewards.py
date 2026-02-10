"""
Rewards Routes
==============

API endpoints for gamification and rewards.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import CurrentUser, DbSession, PublicUser
from src.schemas.common import PaginatedResponse
from src.schemas.rewards import (
    AchievementWithProgress,
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
    from src.models.rewards import Reward

    # Query rewards directly since service may not have paginated method
    limit = page_size
    offset = (page - 1) * page_size

    query = select(Reward).where(Reward.user_id == current_user.id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Get rewards
    query = query.order_by(Reward.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(query)
    rewards = list(result.scalars().all())

    return PaginatedResponse(
        items=[RewardResponse.from_reward(r) for r in rewards],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 0,
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
    # Service get_streak() returns StreakResponse directly
    return await rewards_service.get_streak(current_user.id)


@router.get(
    "/achievements",
    response_model=list[AchievementWithProgress],
    summary="Get achievements",
    description="Get all achievements and user's progress.",
)
async def get_achievements(
    current_user: PublicUser,
    session: DbSession,
):
    """Get all achievements with user's progress."""
    rewards_service = RewardsService(session)
    results = await rewards_service.get_user_achievements(current_user.id)

    response = []
    for achievement, user_achievement in results:
        item = AchievementWithProgress(
            id=achievement.id,
            code=achievement.code,
            name=achievement.name,
            description=achievement.description,
            category=achievement.category,
            icon=achievement.icon,
            badge_color=getattr(achievement, 'badge_color', '#6366F1'),
            tier=achievement.tier,
            points_reward=achievement.points_reward,
            earned_at=user_achievement.completed_at if user_achievement and user_achievement.completed else None,
            progress=user_achievement.progress if user_achievement else 0,
            target=achievement.requirement_value,
        )
        response.append(item)

    return response


@router.get(
    "/achievements/recent",
    response_model=list[AchievementWithProgress],
    summary="Get recent achievements",
    description="Get recently unlocked achievements.",
)
async def get_recent_achievements(
    current_user: PublicUser,
    session: DbSession,
    limit: int = Query(5, ge=1, le=20),
):
    """Get recently unlocked achievements."""
    from src.models.rewards import Achievement, UserAchievement

    # Query recent completed achievements
    result = await session.execute(
        select(Achievement, UserAchievement)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == current_user.id,
            UserAchievement.completed == True,
        )
        .order_by(UserAchievement.completed_at.desc())
        .limit(limit)
    )
    rows = result.all()

    return [
        AchievementWithProgress(
            id=a.id,
            code=a.code,
            name=a.name,
            description=a.description,
            category=a.category,
            icon=a.icon,
            badge_color=getattr(a, 'badge_color', '#6366F1'),
            tier=a.tier,
            points_reward=a.points_reward,
            earned_at=ua.completed_at,
            progress=ua.progress,
            target=a.requirement_value,
        )
        for a, ua in rows
    ]


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

    # Service get_leaderboard() returns LeaderboardResponse directly
    return await rewards_service.get_leaderboard(
        period=period,
        limit=limit,
        user_id=current_user.id,
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
    return {
        "actions": [
            {"action": "waste_entry", "points": 10, "description": "Upload waste image"},
            {"action": "correct_classification", "points": 5, "description": "AI classification verified"},
            {"action": "pickup_completed", "points": 25, "description": "Complete a pickup"},
            {"action": "daily_streak", "points": 15, "description": "Daily activity bonus"},
            {"action": "weekly_streak", "points": 50, "description": "7-day streak bonus"},
            {"action": "referral", "points": 100, "description": "Refer a friend"},
            {"action": "achievement", "points": "varies", "description": "Unlock achievement"},
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
    from src.models.rewards import Reward, RewardType

    rewards_service = RewardsService(session)

    # Check if already claimed today
    today = date.today()
    result = await session.execute(
        select(Reward).where(
            Reward.user_id == current_user.id,
            Reward.reward_type == RewardType.STREAK_BONUS,
            func.date(Reward.created_at) == today,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Daily bonus already claimed today",
        )

    # Award daily bonus and update streak
    streak, bonus = await rewards_service.update_streak(current_user.id)

    # Award base daily points if no streak bonus was given
    if bonus == 0:
        reward = await rewards_service.award_points(
            user_id=current_user.id,
            points=5,
            reward_type=RewardType.STREAK_BONUS,
            description="Daily login bonus",
        )
    else:
        # Streak bonus was already awarded inside update_streak
        result = await session.execute(
            select(Reward)
            .where(Reward.user_id == current_user.id)
            .order_by(Reward.created_at.desc())
            .limit(1)
        )
        reward = result.scalar_one_or_none()

    if not reward:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create reward",
        )

    return RewardResponse.from_reward(reward)
