"""
Rewards Service
===============

Business logic for gamification and rewards system.
"""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.logging import get_logger
from src.models.rewards import (
    Achievement,
    Leaderboard,
    Reward,
    RewardRedemption,
    RewardType,
    UserAchievement,
    UserPoints,
    UserStreak,
)
from src.models.user import User
from src.models.waste import WasteCategory, WasteEntry
from src.schemas.rewards import (
    LeaderboardEntry,
    LeaderboardResponse,
    LevelInfo,
    PointsBreakdown,
    RewardSummary,
    StreakResponse,
)

logger = get_logger(__name__)


# Level thresholds
LEVEL_THRESHOLDS = [
    0,      # Level 1
    100,    # Level 2
    300,    # Level 3
    600,    # Level 4
    1000,   # Level 5
    1500,   # Level 6
    2200,   # Level 7
    3000,   # Level 8
    4000,   # Level 9
    5200,   # Level 10
]

LEVEL_NAMES = [
    "Eco Beginner",
    "Waste Warrior",
    "Green Guardian",
    "Recycling Ranger",
    "Sustainability Scout",
    "Environmental Elite",
    "Planet Protector",
    "Climate Champion",
    "Earth Ambassador",
    "Eco Legend",
]

# Streak milestones and bonuses
STREAK_MILESTONES = {
    3: 25,   # 3 days = 25 bonus points
    7: 75,   # 7 days = 75 bonus points
    14: 200, # 14 days = 200 bonus points
    30: 500, # 30 days = 500 bonus points
    60: 1000,
    90: 2000,
    180: 5000,
    365: 10000,
}


class RewardsService:
    """
    Rewards and gamification service.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    # =========================================================================
    # Points Management
    # =========================================================================

    async def award_points(
        self,
        user_id: UUID,
        points: int,
        reward_type: RewardType,
        description: str,
        waste_entry_id: UUID | None = None,
        pickup_id: UUID | None = None,
        achievement_id: UUID | None = None,
    ) -> Reward:
        """
        Award points to a user.
        
        Args:
            user_id: User to award points to
            points: Number of points to award
            reward_type: Type of reward
            description: Human-readable description
            waste_entry_id: Optional related waste entry
            pickup_id: Optional related pickup
            achievement_id: Optional related achievement
            
        Returns:
            Created reward record
        """
        if not settings.enable_rewards_system:
            return None

        reward = Reward(
            user_id=user_id,
            points=points,
            reward_type=reward_type,
            description=description,
            waste_entry_id=waste_entry_id,
            pickup_id=pickup_id,
            achievement_id=achievement_id,
        )

        self.session.add(reward)

        # Update user's total points
        await self._update_user_points(user_id, points)

        await self.session.flush()

        logger.info(
            "Points awarded",
            user_id=str(user_id),
            points=points,
            reward_type=reward_type.value,
        )

        return reward

    async def _update_user_points(self, user_id: UUID, points_delta: int) -> UserPoints:
        """Update user's aggregated points."""
        result = await self.session.execute(
            select(UserPoints).where(UserPoints.user_id == user_id)
        )
        user_points = result.scalar_one_or_none()

        if not user_points:
            user_points = UserPoints(
                user_id=user_id,
                total_points=0,
                available_points=0,
            )
            self.session.add(user_points)

        user_points.total_points += points_delta
        user_points.available_points += points_delta

        # Update level
        new_level = self._calculate_level(user_points.total_points)
        if new_level > user_points.level:
            user_points.level = new_level
            # Could trigger level-up notification here

        # Calculate progress to next level
        current_threshold = LEVEL_THRESHOLDS[user_points.level - 1]
        next_threshold = (
            LEVEL_THRESHOLDS[user_points.level]
            if user_points.level < len(LEVEL_THRESHOLDS)
            else current_threshold
        )
        user_points.level_progress = user_points.total_points - current_threshold

        return user_points

    def _calculate_level(self, total_points: int) -> int:
        """Calculate level from total points."""
        for level, threshold in enumerate(LEVEL_THRESHOLDS, 1):
            if total_points < threshold:
                return max(1, level - 1)
        return len(LEVEL_THRESHOLDS)

    async def get_user_reward_summary(self, user_id: UUID) -> RewardSummary:
        """Get user's reward summary."""
        result = await self.session.execute(
            select(UserPoints).where(UserPoints.user_id == user_id)
        )
        user_points = result.scalar_one_or_none()

        # Get streak
        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        # Handle case when user has no points record yet
        if not user_points:
            return RewardSummary(
                total_points=0,
                available_points=0,
                redeemed_points=0,
                level=1,
                level_progress=0,
                points_to_next_level=LEVEL_THRESHOLDS[1] if len(LEVEL_THRESHOLDS) > 1 else 100,
                current_streak=streak.current_streak if streak else 0,
                longest_streak=streak.longest_streak if streak else 0,
            )

        # Calculate points to next level
        current_threshold = LEVEL_THRESHOLDS[user_points.level - 1]
        next_threshold = (
            LEVEL_THRESHOLDS[user_points.level]
            if user_points.level < len(LEVEL_THRESHOLDS)
            else current_threshold + 1000
        )
        points_to_next = next_threshold - user_points.total_points

        return RewardSummary(
            total_points=user_points.total_points,
            available_points=user_points.available_points,
            redeemed_points=user_points.redeemed_points or 0,
            level=user_points.level,
            level_progress=user_points.level_progress or 0,
            points_to_next_level=max(0, points_to_next),
            current_streak=streak.current_streak if streak else 0,
            longest_streak=streak.longest_streak if streak else 0,
        )

    async def get_level_info(self, user_id: UUID) -> LevelInfo:
        """Get detailed level information."""
        result = await self.session.execute(
            select(UserPoints).where(UserPoints.user_id == user_id)
        )
        user_points = result.scalar_one_or_none()

        level = user_points.level if user_points else 1
        total_points = user_points.total_points if user_points else 0

        current_threshold = LEVEL_THRESHOLDS[level - 1]
        next_threshold = (
            LEVEL_THRESHOLDS[level]
            if level < len(LEVEL_THRESHOLDS)
            else current_threshold + 1000
        )

        progress_in_level = total_points - current_threshold
        level_range = next_threshold - current_threshold
        progress_percentage = (progress_in_level / level_range * 100) if level_range > 0 else 100

        # Level perks (simplified)
        perks = []
        if level >= 3:
            perks.append("Priority pickup scheduling")
        if level >= 5:
            perks.append("Early access to new features")
        if level >= 7:
            perks.append("Bonus points multiplier")
        if level >= 10:
            perks.append("VIP status")

        return LevelInfo(
            current_level=level,
            level_name=LEVEL_NAMES[level - 1] if level <= len(LEVEL_NAMES) else "Eco Master",
            current_points=total_points,
            points_for_current_level=current_threshold,
            points_for_next_level=next_threshold,
            progress_percentage=round(progress_percentage, 1),
            perks=perks,
        )

    # =========================================================================
    # Streak Management
    # =========================================================================

    async def update_streak(self, user_id: UUID) -> tuple[UserStreak, int]:
        """
        Update user's streak based on today's activity.
        
        Returns:
            Tuple of (streak, bonus_points_earned)
        """
        today = date.today()

        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        if not streak:
            streak = UserStreak(
                user_id=user_id,
                current_streak=0,
                longest_streak=0,
            )
            self.session.add(streak)

        bonus_points = 0

        if streak.last_activity_date:
            days_since = (today - streak.last_activity_date).days

            if days_since == 0:
                # Already recorded today
                return streak, 0
            elif days_since == 1:
                # Consecutive day - extend streak
                streak.current_streak += 1
            else:
                # Streak broken
                streak.current_streak = 1
        else:
            # First activity
            streak.current_streak = 1

        streak.last_activity_date = today

        # Update longest streak
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
            streak.longest_streak_start = today - timedelta(days=streak.current_streak - 1)
            streak.longest_streak_end = today

        # Check for milestone bonus
        if streak.current_streak in STREAK_MILESTONES:
            if streak.last_streak_bonus_at != streak.current_streak:
                bonus_points = STREAK_MILESTONES[streak.current_streak]
                streak.last_streak_bonus_at = streak.current_streak

                # Award bonus points
                await self.award_points(
                    user_id=user_id,
                    points=bonus_points,
                    reward_type=RewardType.STREAK_BONUS,
                    description=f"🔥 {streak.current_streak}-day streak bonus!",
                )

        await self.session.flush()

        return streak, bonus_points

    async def get_streak(self, user_id: UUID) -> StreakResponse:
        """Get user's streak information."""
        today = date.today()

        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        if not streak:
            return StreakResponse(
                current_streak=0,
                longest_streak=0,
                last_activity_date=None,
                streak_active=False,
                next_milestone=3,
                points_at_milestone=25,
            )

        # Check if streak is still active
        streak_active = False
        if streak.last_activity_date:
            days_since = (today - streak.last_activity_date).days
            streak_active = days_since <= 1

        # Find next milestone
        next_milestone = None
        points_at_milestone = None
        for days, points in sorted(STREAK_MILESTONES.items()):
            if days > streak.current_streak:
                next_milestone = days
                points_at_milestone = points
                break

        return StreakResponse(
            current_streak=streak.current_streak if streak_active else 0,
            longest_streak=streak.longest_streak,
            last_activity_date=streak.last_activity_date,
            streak_active=streak_active,
            next_milestone=next_milestone,
            points_at_milestone=points_at_milestone,
        )

    # =========================================================================
    # Waste Entry Rewards
    # =========================================================================

    async def calculate_entry_points(
        self,
        user_id: UUID,
        waste_entry: WasteEntry,
    ) -> PointsBreakdown:
        """
        Calculate points for a waste entry.
        
        Points are based on:
        - Base points for proper classification
        - Bonus for recyclables/organics
        - Streak bonus
        - First-time sorter bonus
        """
        base_points = 10

        # Category bonus
        category_bonus = 0
        if waste_entry.category == WasteCategory.RECYCLABLE:
            category_bonus = 5
        elif waste_entry.category == WasteCategory.ORGANIC:
            category_bonus = 5
        elif waste_entry.category == WasteCategory.HAZARDOUS:
            category_bonus = 3  # For proper handling

        # Check if first entry (first-time bonus)
        result = await self.session.execute(
            select(func.count(WasteEntry.id))
            .where(WasteEntry.user_id == user_id)
        )
        entry_count = result.scalar() or 0
        first_time_bonus = 20 if entry_count == 1 else 0

        # Get streak bonus
        streak_bonus = 0
        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()
        if streak and streak.current_streak >= 3:
            streak_bonus = min(streak.current_streak, 10)  # Max 10 bonus points

        # Calculate total
        total_points = base_points + category_bonus + streak_bonus + first_time_bonus

        # Level multiplier (future feature)
        multiplier = 1.0

        return PointsBreakdown(
            base_points=base_points,
            streak_bonus=streak_bonus,
            first_time_bonus=first_time_bonus,
            category_bonus=category_bonus,
            total_points=int(total_points * multiplier),
            multiplier=multiplier,
        )

    async def award_entry_points(
        self,
        user_id: UUID,
        waste_entry: WasteEntry,
    ) -> int:
        """Award points for a waste entry."""
        if not settings.enable_rewards_system:
            return 0

        breakdown = await self.calculate_entry_points(user_id, waste_entry)

        await self.award_points(
            user_id=user_id,
            points=breakdown.total_points,
            reward_type=RewardType.RECYCLING_POINTS,
            description=f"Points for sorting {waste_entry.category.value if waste_entry.category else 'waste'}",
            waste_entry_id=waste_entry.id,
        )

        # Update streak
        await self.update_streak(user_id)

        # Check achievements
        await self.check_achievements(user_id)

        return breakdown.total_points

    # =========================================================================
    # Achievements
    # =========================================================================

    async def check_achievements(self, user_id: UUID) -> list[Achievement]:
        """Check and unlock any new achievements for user."""
        unlocked = []

        # Get user's current stats
        result = await self.session.execute(
            select(UserPoints).where(UserPoints.user_id == user_id)
        )
        user_points = result.scalar_one_or_none()

        result = await self.session.execute(
            select(func.count(WasteEntry.id))
            .where(WasteEntry.user_id == user_id)
        )
        entry_count = result.scalar() or 0

        result = await self.session.execute(
            select(UserStreak).where(UserStreak.user_id == user_id)
        )
        streak = result.scalar_one_or_none()

        # Get all active achievements user hasn't completed
        result = await self.session.execute(
            select(Achievement)
            .where(Achievement.is_active == True)
            .outerjoin(
                UserAchievement,
                and_(
                    UserAchievement.achievement_id == Achievement.id,
                    UserAchievement.user_id == user_id,
                    UserAchievement.completed == True,
                )
            )
            .where(UserAchievement.id == None)
        )
        available_achievements = result.scalars().all()

        for achievement in available_achievements:
            progress = await self._calculate_achievement_progress(
                achievement,
                user_id,
                user_points,
                entry_count,
                streak,
            )

            if progress >= achievement.requirement_value:
                # Unlock achievement
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    progress=progress,
                    completed=True,
                    completed_at=datetime.now(timezone.utc),
                )
                self.session.add(user_achievement)

                # Award achievement points
                if achievement.points_reward > 0:
                    await self.award_points(
                        user_id=user_id,
                        points=achievement.points_reward,
                        reward_type=RewardType.ACHIEVEMENT_UNLOCK,
                        description=f"🏆 Achievement unlocked: {achievement.name}",
                        achievement_id=achievement.id,
                    )

                unlocked.append(achievement)

                logger.info(
                    "Achievement unlocked",
                    user_id=str(user_id),
                    achievement=achievement.code,
                )

        if unlocked:
            await self.session.flush()

        return unlocked

    async def _calculate_achievement_progress(
        self,
        achievement: Achievement,
        user_id: UUID,
        user_points: UserPoints | None,
        entry_count: int,
        streak: UserStreak | None,
    ) -> int:
        """Calculate progress towards an achievement."""
        req_type = achievement.requirement_type

        if req_type == "total_entries":
            return entry_count
        elif req_type == "total_points":
            return user_points.total_points if user_points else 0
        elif req_type == "streak_days":
            return streak.current_streak if streak else 0
        elif req_type == "longest_streak":
            return streak.longest_streak if streak else 0
        elif req_type == "level":
            return user_points.level if user_points else 1
        elif req_type == "category_count":
            # Count entries in specific category
            category = achievement.requirement_metadata.get("category") if achievement.requirement_metadata else None
            if category:
                result = await self.session.execute(
                    select(func.count(WasteEntry.id))
                    .where(
                        WasteEntry.user_id == user_id,
                        WasteEntry.category == WasteCategory(category),
                    )
                )
                return result.scalar() or 0

        return 0

    async def get_user_achievements(
        self,
        user_id: UUID,
    ) -> list[tuple[Achievement, UserAchievement | None]]:
        """Get all achievements with user's progress."""
        # Get all active achievements
        result = await self.session.execute(
            select(Achievement)
            .where(Achievement.is_active == True, Achievement.is_hidden == False)
            .order_by(Achievement.tier, Achievement.display_order)
        )
        achievements = result.scalars().all()

        # Get user's progress
        result = await self.session.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
        )
        user_achievements = {ua.achievement_id: ua for ua in result.scalars().all()}

        return [(a, user_achievements.get(a.id)) for a in achievements]

    # =========================================================================
    # Leaderboard
    # =========================================================================

    async def get_leaderboard(
        self,
        period: str = "weekly",
        limit: int = 10,
        user_id: UUID | None = None,
    ) -> LeaderboardResponse:
        """Get leaderboard for specified period."""
        today = date.today()

        if period == "weekly":
            period_start = today - timedelta(days=today.weekday())
            period_end = period_start + timedelta(days=6)
        elif period == "monthly":
            period_start = today.replace(day=1)
            if today.month == 12:
                period_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                period_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        else:  # all_time
            period_start = date(2020, 1, 1)
            period_end = today

        # Get top users by points earned in period
        result = await self.session.execute(
            select(
                Reward.user_id,
                func.sum(Reward.points).label("total_points"),
            )
            .where(
                Reward.created_at >= datetime.combine(period_start, datetime.min.time()),
                Reward.created_at <= datetime.combine(period_end, datetime.max.time()),
            )
            .group_by(Reward.user_id)
            .order_by(func.sum(Reward.points).desc())
            .limit(limit)
        )
        rankings = result.all()

        # Get user details
        user_ids = [r.user_id for r in rankings]
        result = await self.session.execute(
            select(User).where(User.id.in_(user_ids))
        )
        users = {u.id: u for u in result.scalars().all()}

        result = await self.session.execute(
            select(UserPoints).where(UserPoints.user_id.in_(user_ids))
        )
        points = {up.user_id: up for up in result.scalars().all()}

        # Build entries
        entries = []
        for rank, row in enumerate(rankings, 1):
            user = users.get(row.user_id)
            user_points = points.get(row.user_id)
            if user:
                entries.append(
                    LeaderboardEntry(
                        rank=rank,
                        user_id=row.user_id,
                        display_name=f"{user.first_name} {user.last_name[0]}.",
                        avatar_url=user.avatar_url,
                        points=row.total_points,
                        level=user_points.level if user_points else 1,
                        total_entries=user_points.total_waste_entries if user_points else 0,
                    )
                )

        # Get user's rank if provided
        user_rank = None
        if user_id:
            for entry in entries:
                if entry.user_id == user_id:
                    user_rank = entry.rank
                    break

        return LeaderboardResponse(
            period=period,
            period_start=period_start,
            period_end=period_end,
            entries=entries,
            user_rank=user_rank,
            total_participants=len(rankings),
        )
