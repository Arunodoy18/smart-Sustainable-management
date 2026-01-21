"""
Rewards & Gamification Models
=============================

Database models for the rewards and gamification system.
"""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database.base import Base

if TYPE_CHECKING:
    from src.models.user import User


class RewardType(str, enum.Enum):
    """Types of rewards users can earn.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    RECYCLING_POINTS = "RECYCLING_POINTS"
    STREAK_BONUS = "STREAK_BONUS"
    FIRST_SORT_BONUS = "FIRST_SORT_BONUS"
    REFERRAL_BONUS = "REFERRAL_BONUS"
    ACHIEVEMENT_UNLOCK = "ACHIEVEMENT_UNLOCK"
    PICKUP_COMPLETION = "PICKUP_COMPLETION"  # For drivers
    ON_TIME_BONUS = "ON_TIME_BONUS"  # For drivers
    CLEAN_COLLECTION = "CLEAN_COLLECTION"  # For drivers


class AchievementCategory(str, enum.Enum):
    """Achievement categories.
    
    IMPORTANT: Values MUST be UPPERCASE to match PostgreSQL enum values.
    DO NOT change these values - they are used in production databases.
    """

    RECYCLING = "RECYCLING"
    CONSISTENCY = "CONSISTENCY"
    COMMUNITY = "COMMUNITY"
    ENVIRONMENTAL = "ENVIRONMENTAL"
    DRIVER_PERFORMANCE = "DRIVER_PERFORMANCE"


class Reward(Base):
    """
    Individual reward transaction.
    
    Tracks all points earned by users and drivers.
    """

    __tablename__ = "rewards"
    __table_args__ = (
        Index("ix_rewards_user_created", "user_id", "created_at"),
        Index("ix_rewards_type_created", "reward_type", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Reward details
    reward_type: Mapped[RewardType] = mapped_column(
        Enum(RewardType, name="reward_type"),
        nullable=False,
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Reference to source
    waste_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("waste_entries.id"),
        nullable=True,
    )
    pickup_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pickups.id"),
        nullable=True,
    )
    achievement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("achievements.id"),
        nullable=True,
    )
    
    # Additional data
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="rewards")


class UserStreak(Base):
    """
    User streak tracking.
    
    Tracks consecutive days of recycling activity.
    """

    __tablename__ = "user_streaks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    
    # Current streak
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Best streak
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    longest_streak_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Streak bonuses
    last_streak_bonus_at: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_streak")


class UserPoints(Base):
    """
    Aggregated user points summary.
    
    Provides fast access to total points without summing rewards table.
    """

    __tablename__ = "user_points"
    __table_args__ = (
        Index("ix_user_points_total", "total_points"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    
    # Point totals
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    available_points: Mapped[int] = mapped_column(Integer, default=0)
    redeemed_points: Mapped[int] = mapped_column(Integer, default=0)
    
    # Level
    level: Mapped[int] = mapped_column(Integer, default=1)
    level_progress: Mapped[int] = mapped_column(Integer, default=0)
    
    # Stats
    total_waste_entries: Mapped[int] = mapped_column(Integer, default=0)
    total_recycled_items: Mapped[int] = mapped_column(Integer, default=0)


class Achievement(Base):
    """
    Achievement definitions.
    
    Defines all possible achievements users can unlock.
    """

    __tablename__ = "achievements"

    # Identification
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Category
    category: Mapped[AchievementCategory] = mapped_column(
        Enum(AchievementCategory, name="achievement_category"),
        nullable=False,
    )
    
    # Requirements
    requirement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_value: Mapped[int] = mapped_column(Integer, nullable=False)
    requirement_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # Reward
    points_reward: Mapped[int] = mapped_column(Integer, default=0)
    
    # Display
    icon: Mapped[str] = mapped_column(String(100), nullable=False)
    badge_color: Mapped[str] = mapped_column(String(20), default="#22C55E")
    
    # Ordering
    tier: Mapped[int] = mapped_column(Integer, default=1)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)


class UserAchievement(Base):
    """
    User achievement unlocks.
    
    Tracks which achievements a user has earned.
    """

    __tablename__ = "user_achievements"
    __table_args__ = (
        Index("ix_user_achievements_user_achievement", "user_id", "achievement_id", unique=True),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    achievement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("achievements.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Progress
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Notification
    notified: Mapped[bool] = mapped_column(Boolean, default=False)


class Leaderboard(Base):
    """
    Leaderboard snapshots.
    
    Periodically computed leaderboard rankings.
    """

    __tablename__ = "leaderboards"
    __table_args__ = (
        Index("ix_leaderboards_period_type", "period_start", "leaderboard_type"),
    )

    # Period
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    leaderboard_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # weekly, monthly, all_time
    
    # Rankings (stored as JSON array)
    rankings: Mapped[list] = mapped_column(JSONB, nullable=False)
    
    # Metadata
    total_participants: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[datetime] = mapped_column(nullable=False)


class RewardRedemption(Base):
    """
    Reward redemption history.
    
    Tracks when users redeem points for rewards.
    """

    __tablename__ = "reward_redemptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Redemption details
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_name: Mapped[str] = mapped_column(String(200), nullable=False)
    reward_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
    )  # pending, fulfilled, cancelled
    fulfilled_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Additional data
    redemption_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
