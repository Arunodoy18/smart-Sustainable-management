"""
Authentication Service
======================

Business logic for authentication and authorization.
"""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.cache import cache
from src.core.config import settings
from src.core.logging import get_logger
from src.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token_type,
)
from src.models.user import PasswordReset, RefreshToken, User, UserRole, UserStatus
from src.schemas.user import (
    DriverRegistration,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)

logger = get_logger(__name__)


class AuthenticationError(Exception):
    """Authentication failed."""

    pass


class AuthorizationError(Exception):
    """Authorization failed."""

    pass


class AuthService:
    """
    Authentication service.
    
    Handles user registration, login, token management, and password resets.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def register_user(self, data: UserCreate) -> User:
        """
        Register a new user.
        
        Args:
            data: User registration data
            
        Returns:
            Created user
            
        Raises:
            AuthenticationError: If email already exists
        """
        # Check if email exists
        existing = await self.session.execute(
            select(User).where(User.email == data.email.lower())
        )
        if existing.scalar_one_or_none():
            raise AuthenticationError("Email already registered")

        # Create user
        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            role=data.role,
            status=UserStatus.ACTIVE if not settings.enable_email_verification else UserStatus.PENDING,
        )

        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        logger.info(
            "User registered",
            user_id=str(user.id),
            email=user.email,
            role=user.role.value,
        )

        return user

    async def register_driver(self, data: DriverRegistration) -> User:
        """
        Register a new driver.
        
        Drivers require admin approval before they can start working.
        """
        from src.models.pickup import DriverProfile, DriverStatus

        user = await self.register_user(data)

        # Create driver profile
        profile = DriverProfile(
            user_id=user.id,
            status=DriverStatus.PENDING_APPROVAL if settings.enable_driver_approval else DriverStatus.APPROVED,
            vehicle_type=data.vehicle_type,
            vehicle_registration=data.vehicle_registration,
            license_number=data.license_number,
        )

        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(user)

        logger.info("Driver registered", user_id=str(user.id))

        return user

    async def login(
        self,
        data: LoginRequest,
        device_info: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        """
        Authenticate user and issue tokens.
        
        Args:
            data: Login credentials
            device_info: Optional device information
            ip_address: Optional client IP address
            
        Returns:
            Access and refresh tokens
            
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Find user
        result = await self.session.execute(
            select(User).where(User.email == data.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning("Login failed: user not found", email=data.email)
            raise AuthenticationError("Invalid email or password")

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise AuthenticationError("Account is temporarily locked")

        # Verify password
        if not verify_password(data.password, user.hashed_password):
            # Increment failed attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            await self.session.flush()

            logger.warning(
                "Login failed: invalid password",
                user_id=str(user.id),
                attempts=user.failed_login_attempts,
            )
            raise AuthenticationError("Invalid email or password")

        # Check user status
        if user.status != UserStatus.ACTIVE:
            raise AuthenticationError(f"Account is {user.status.value}")

        # Reset failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(timezone.utc)

        # Generate tokens
        access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"role": user.role.value},
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        # Store refresh token
        token_record = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days),
            device_info=device_info,
            ip_address=ip_address,
        )
        self.session.add(token_record)
        await self.session.flush()

        logger.info("User logged in", user_id=str(user.id))
        
        from src.schemas.user import UserResponse

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
            user=UserResponse(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                avatar_url=user.avatar_url,
                role=user.role,
                status=user.status,
                email_verified=user.email_verified,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login_at=user.last_login_at,
            ),
        )

    async def refresh_tokens(
        self,
        refresh_token: str,
        device_info: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        """
        Refresh access token using refresh token.
        
        Implements token rotation - the old refresh token is revoked.
        """
        # Verify token
        payload = verify_token_type(refresh_token, "refresh")
        if not payload:
            raise AuthenticationError("Invalid refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid refresh token")

        # Find token in database
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token == refresh_token,
                RefreshToken.revoked == False,
            )
        )
        token_record = result.scalar_one_or_none()

        if not token_record:
            # Token reuse detected - revoke all user tokens
            await self._revoke_all_user_tokens(UUID(user_id))
            raise AuthenticationError("Refresh token has been revoked")

        if token_record.expires_at < datetime.now(timezone.utc):
            raise AuthenticationError("Refresh token has expired")

        # Get user
        result = await self.session.execute(
            select(User).where(User.id == UUID(user_id))
        )
        user = result.scalar_one_or_none()

        if not user or user.status != UserStatus.ACTIVE:
            raise AuthenticationError("User not found or inactive")

        # Revoke old token
        token_record.revoked = True
        token_record.revoked_at = datetime.now(timezone.utc)

        # Generate new tokens
        new_access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"role": user.role.value},
        )
        new_refresh_token = create_refresh_token(subject=str(user.id))

        # Store new refresh token
        new_token_record = RefreshToken(
            user_id=user.id,
            token=new_refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days),
            device_info=device_info,
            ip_address=ip_address,
        )
        self.session.add(new_token_record)
        await self.session.flush()

        logger.info("Tokens refreshed", user_id=str(user.id))

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def logout(self, refresh_token: str) -> None:
        """Revoke refresh token on logout."""
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token)
        )
        token_record = result.scalar_one_or_none()

        if token_record:
            token_record.revoked = True
            token_record.revoked_at = datetime.now(timezone.utc)
            await self.session.flush()

    async def logout_all_devices(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        await self._revoke_all_user_tokens(user_id)

    async def _revoke_all_user_tokens(self, user_id: UUID) -> None:
        """Revoke all tokens for a user."""
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
            )
        )
        tokens = result.scalars().all()

        for token in tokens:
            token.revoked = True
            token.revoked_at = datetime.now(timezone.utc)

        await self.session.flush()
        logger.info("All tokens revoked", user_id=str(user_id))

    async def request_password_reset(self, email: str) -> str | None:
        """
        Generate password reset token.
        
        Returns token if user exists, None otherwise.
        Does not reveal whether email exists.
        """
        result = await self.session.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Generate token
        token = secrets.token_urlsafe(32)

        # Store token
        reset = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        self.session.add(reset)
        await self.session.flush()

        logger.info("Password reset requested", user_id=str(user.id))

        return token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset password using reset token.
        
        Returns True if successful, False if token is invalid.
        """
        result = await self.session.execute(
            select(PasswordReset).where(
                PasswordReset.token == token,
                PasswordReset.used == False,
            )
        )
        reset = result.scalar_one_or_none()

        if not reset:
            return False

        if reset.expires_at < datetime.now(timezone.utc):
            return False

        # Get user
        result = await self.session.execute(
            select(User).where(User.id == reset.user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # Update password
        user.hashed_password = hash_password(new_password)

        # Mark token as used
        reset.used = True
        reset.used_at = datetime.now(timezone.utc)

        # Revoke all refresh tokens
        await self._revoke_all_user_tokens(user.id)

        await self.session.flush()

        logger.info("Password reset completed", user_id=str(user.id))

        return True

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> bool:
        """Change password for authenticated user."""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        if not verify_password(current_password, user.hashed_password):
            return False

        user.hashed_password = hash_password(new_password)

        # Revoke all refresh tokens except current session
        await self._revoke_all_user_tokens(user.id)

        await self.session.flush()

        logger.info("Password changed", user_id=str(user.id))

        return True

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def verify_email(self, token: str) -> bool:
        """Verify user email with token."""
        # Implementation depends on email verification token storage
        # This is a placeholder for the actual implementation
        pass
