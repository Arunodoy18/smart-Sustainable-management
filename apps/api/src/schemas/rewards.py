"""
Rewards & Gamification Schemas
==============================

Pydantic schemas for rewards endpoints.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import Field

from src.models.rewards import AchievementCategory, RewardType
from src.schemas.common import BaseSchema, TimestampMixin


# =============================================================================
# Reward Schemas
# =============================================================================


class RewardResponse(BaseSchema, TimestampMixin):
    """Individual reward transaction."""

    id: UUID
    user_id: UUID
    reward_type: RewardType
    points: int
    description: str
    waste_entry_id: UUID | None = None
    pickup_id: UUID | None = None


class RewardSummary(BaseSchema):
    """User's reward summary."""

    total_points: int
    available_points: int
    redeemed_points: int
    level: int
    level_progress: int
    points_to_next_level: int
    current_streak: int
    longest_streak: int


class RewardHistory(BaseSchema):
    """Paginated reward history."""

    rewards: list[RewardResponse]
    total: int
    total_points_earned: int


# =============================================================================
# Streak Schemas
# =============================================================================


class StreakResponse(BaseSchema):
    """User streak information."""

    current_streak: int
    longest_streak: int
    last_activity_date: date | None = None
    streak_active: bool
    next_milestone: int | None = None
    points_at_milestone: int | None = None


class StreakMilestone(BaseSchema):
    """Streak milestone definition."""

    days: int
    bonus_points: int
    badge_name: str
    badge_icon: str


# =============================================================================
# Achievement Schemas
# =============================================================================


class AchievementResponse(BaseSchema):
    """Achievement definition."""

    id: UUID
    code: str
    name: str
    description: str
    category: AchievementCategory
    icon: str
    badge_color: str
    tier: int
    points_reward: int


class UserAchievementResponse(BaseSchema):
    """User's achievement progress."""

    achievement: AchievementResponse
    progress: int
    requirement_value: int
    progress_percentage: float
    completed: bool
    completed_at: datetime | None = None


class AchievementUnlock(BaseSchema):
    """Achievement unlock notification."""

    achievement: AchievementResponse
    points_earned: int
    unlocked_at: datetime


# =============================================================================
# Leaderboard Schemas
# =============================================================================


class LeaderboardEntry(BaseSchema):
    """Single leaderboard entry."""

    rank: int
    user_id: UUID
    display_name: str
    avatar_url: str | None = None
    points: int
    level: int
    total_entries: int


class LeaderboardResponse(BaseSchema):
    """Leaderboard response."""

    period: str  # weekly, monthly, all_time
    period_start: date
    period_end: date
    entries: list[LeaderboardEntry]
    user_rank: int | None = None
    total_participants: int


class LeaderboardFilters(BaseSchema):
    """Leaderboard filters."""

    period: str = Field(default="weekly", pattern="^(weekly|monthly|all_time)$")
    limit: int = Field(default=10, ge=1, le=100)


# =============================================================================
# Redemption Schemas
# =============================================================================


class RedemptionOption(BaseSchema):
    """Available reward redemption option."""

    id: str
    name: str
    description: str
    points_required: int
    category: str
    image_url: str | None = None
    available: bool
    stock: int | None = None


class RedemptionRequest(BaseSchema):
    """Redeem points for reward."""

    reward_id: str
    quantity: int = Field(default=1, ge=1, le=10)


class RedemptionResponse(BaseSchema, TimestampMixin):
    """Redemption transaction."""

    id: UUID
    user_id: UUID
    reward_name: str
    points_spent: int
    status: str
    redemption_code: str | None = None


class RedemptionHistory(BaseSchema):
    """User's redemption history."""

    redemptions: list[RedemptionResponse]
    total: int
    total_points_redeemed: int


# =============================================================================
# Points Calculation Schemas
# =============================================================================


class PointsBreakdown(BaseSchema):
    """Breakdown of points for an action."""

    base_points: int
    streak_bonus: int
    first_time_bonus: int
    category_bonus: int
    total_points: int
    multiplier: float = 1.0


class LevelInfo(BaseSchema):
    """Level information."""

    current_level: int
    level_name: str
    current_points: int
    points_for_current_level: int
    points_for_next_level: int
    progress_percentage: float
    perks: list[str]
