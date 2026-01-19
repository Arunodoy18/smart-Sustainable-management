"""
User & Authentication Schemas
=============================

Pydantic schemas for user and authentication endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from src.models.user import UserRole, UserStatus
from src.schemas.common import BaseSchema, TimestampMixin


# =============================================================================
# Authentication Schemas
# =============================================================================


class LoginRequest(BaseSchema):
    """User login request."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseSchema):
    """JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token expiration in seconds")


class RefreshTokenRequest(BaseSchema):
    """Refresh token request."""

    refresh_token: str


class PasswordResetRequest(BaseSchema):
    """Password reset request."""

    email: EmailStr


class PasswordResetConfirm(BaseSchema):
    """Password reset confirmation."""

    token: str
    new_password: str = Field(min_length=8, max_length=128)


class PasswordChangeRequest(BaseSchema):
    """Password change for authenticated user."""

    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# =============================================================================
# User Registration Schemas
# =============================================================================


class UserCreate(BaseSchema):
    """User registration request."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: UserRole = Field(default=UserRole.CITIZEN)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class DriverRegistration(UserCreate):
    """Driver registration with additional fields."""

    role: UserRole = Field(default=UserRole.DRIVER)
    vehicle_type: str | None = Field(default=None, max_length=100)
    vehicle_registration: str | None = Field(default=None, max_length=50)
    license_number: str | None = Field(default=None, max_length=100)


# =============================================================================
# User Response Schemas
# =============================================================================


class UserBase(BaseSchema):
    """Base user information."""

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    avatar_url: str | None = None
    role: UserRole
    status: UserStatus
    email_verified: bool


class UserResponse(UserBase, TimestampMixin):
    """Full user response."""

    last_login_at: datetime | None = None

    @property
    def full_name(self) -> str:
        """Get full name."""
        return f"{self.first_name} {self.last_name}"


class UserProfileResponse(UserResponse):
    """User profile with additional stats."""

    total_points: int = 0
    current_streak: int = 0
    total_waste_entries: int = 0
    level: int = 1


class UserUpdate(BaseSchema):
    """User profile update."""

    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)


class UserAvatarUpdate(BaseSchema):
    """User avatar update response."""

    avatar_url: str


# =============================================================================
# Admin User Management Schemas
# =============================================================================


class UserListFilters(BaseSchema):
    """Filters for user listing."""

    role: UserRole | None = None
    status: UserStatus | None = None
    search: str | None = Field(default=None, max_length=100)


class UserStatusUpdate(BaseSchema):
    """Admin user status update."""

    status: UserStatus
    reason: str | None = Field(default=None, max_length=500)


class DriverApproval(BaseSchema):
    """Driver approval request."""

    approved: bool
    rejection_reason: str | None = Field(default=None, max_length=500)


# =============================================================================
# Driver Profile Schemas
# =============================================================================


class DriverProfileResponse(BaseSchema):
    """Driver profile information."""

    user_id: UUID
    status: str
    vehicle_type: str | None = None
    vehicle_registration: str | None = None
    rating: float
    total_pickups: int
    successful_pickups: int
    on_time_rate: float
    is_available: bool


class DriverLocationUpdate(BaseSchema):
    """Driver location update."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DriverAvailabilityUpdate(BaseSchema):
    """Driver availability toggle."""

    is_available: bool
