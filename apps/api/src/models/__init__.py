"""
Models Module
=============

Exports all database models for easy importing.
"""

from src.models.analytics import (
    AuditLog,
    ImpactMetrics,
    SystemMetrics,
    WasteHotspot,
    ZoneAnalytics,
)
from src.models.pickup import (
    DriverLog,
    DriverProfile,
    DriverStatus,
    Pickup,
    PickupPriority,
    PickupStatus,
    Zone,
)
from src.models.rewards import (
    Achievement,
    AchievementCategory,
    Leaderboard,
    Reward,
    RewardRedemption,
    RewardType,
    UserAchievement,
    UserPoints,
    UserStreak,
)
from src.models.user import (
    PasswordReset,
    RefreshToken,
    User,
    UserRole,
    UserStatus,
)
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

__all__ = [
    # User models
    "User",
    "UserRole",
    "UserStatus",
    "RefreshToken",
    "PasswordReset",
    # Waste models
    "WasteEntry",
    "WasteEntryStatus",
    "WasteCategory",
    "WasteSubCategory",
    "BinType",
    "Classification",
    "ClassificationConfidence",
    "Recommendation",
    "WasteCategoryRule",
    # Pickup models
    "Pickup",
    "PickupStatus",
    "PickupPriority",
    "DriverProfile",
    "DriverStatus",
    "DriverLog",
    "Zone",
    # Rewards models
    "Reward",
    "RewardType",
    "UserStreak",
    "UserPoints",
    "Achievement",
    "AchievementCategory",
    "UserAchievement",
    "Leaderboard",
    "RewardRedemption",
    # Analytics models
    "ImpactMetrics",
    "ZoneAnalytics",
    "WasteHotspot",
    "SystemMetrics",
    "AuditLog",
]
