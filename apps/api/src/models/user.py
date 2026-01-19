"""
User & Role Models
==================

Database models for users, roles, and authentication.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database.base import Base

if TYPE_CHECKING:
    from src.models.pickup import DriverProfile, Pickup
    from src.models.rewards import Reward, UserStreak
    from src.models.waste import WasteEntry


class UserRole(str, enum.Enum):
    """User role enumeration."""

    CITIZEN = "citizen"
    DRIVER = "driver"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    """User account status."""

    PENDING = "pending"  # Awaiting email verification
    ACTIVE = "active"  # Fully active account
    SUSPENDED = "suspended"  # Temporarily suspended
    DEACTIVATED = "deactivated"  # Self-deactivated


class User(Base):
    """
    User account model.
    
    Supports multiple roles: citizen, driver, admin.
    """

    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email_lower", "email"),
        Index("ix_users_role_status", "role", "status"),
    )

    # Authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Role & Status
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.CITIZEN,
        nullable=False,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"),
        default=UserStatus.PENDING,
        nullable=False,
    )
    
    # Verification
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Security
    last_login_at: Mapped[datetime | None] = mapped_column(nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    waste_entries: Mapped[list["WasteEntry"]] = relationship(
        "WasteEntry",
        back_populates="user",
        lazy="selectin",
    )
    rewards: Mapped[list["Reward"]] = relationship(
        "Reward",
        back_populates="user",
        lazy="selectin",
    )
    user_streak: Mapped["UserStreak | None"] = relationship(
        "UserStreak",
        back_populates="user",
        uselist=False,
    )
    driver_profile: Mapped["DriverProfile | None"] = relationship(
        "DriverProfile",
        back_populates="user",
        uselist=False,
    )
    pickups_as_driver: Mapped[list["Pickup"]] = relationship(
        "Pickup",
        back_populates="driver",
        foreign_keys="Pickup.driver_id",
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active(self) -> bool:
        """Check if user is active."""
        return self.status == UserStatus.ACTIVE and self.deleted_at is None

    @property
    def is_driver(self) -> bool:
        """Check if user is a driver."""
        return self.role == UserRole.DRIVER

    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN


class RefreshToken(Base):
    """
    Refresh token storage for token rotation.
    
    Each refresh token can only be used once. When used, it is marked
    as revoked and a new token is issued.
    """

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_token", "token"),
        Index("ix_refresh_tokens_user_id_revoked", "user_id", "revoked"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    
    # Device tracking
    device_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


class PasswordReset(Base):
    """Password reset token storage."""

    __tablename__ = "password_resets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_at: Mapped[datetime | None] = mapped_column(nullable=True)
