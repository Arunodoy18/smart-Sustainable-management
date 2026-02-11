"""
API Dependencies
=================

Shared dependencies for API routes.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.security import verify_token_type
from src.models.user import User, UserRole, UserStatus
from src.services import AuthService

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """
    Validate access token and return current user.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token
    payload = verify_token_type(credentials.credentials, "access")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Get user from database
    auth_service = AuthService(session)
    user = await auth_service.get_user_by_id(UUID(user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status.value}",
        )
    
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Alias for get_current_user with explicit active check."""
    return current_user


def require_role(*roles: UserRole):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin")
        async def admin_only(user: User = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    
    return role_checker


# Convenience dependencies - these are callables, use with Depends() in routes
RequireAdmin = require_role(UserRole.ADMIN)
RequireDriver = require_role(UserRole.DRIVER, UserRole.ADMIN)
RequireCitizen = require_role(UserRole.CITIZEN, UserRole.ADMIN)


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User | None:
    """
    Get current user if authenticated, None otherwise.
    
    Useful for endpoints that work both with and without authentication.
    """
    if not credentials:
        return None
    
    try:
        payload = verify_token_type(credentials.credentials, "access")
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        auth_service = AuthService(session)
        return await auth_service.get_user_by_id(UUID(user_id))
    except Exception:
        return None


async def get_current_user_or_guest(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """
    Get current authenticated user, or create/return a guest user for public access.
    
    This allows the app to work without authentication while maintaining
    the same API structure.
    """
    # Try to get authenticated user first
    if credentials:
        try:
            payload = verify_token_type(credentials.credentials, "access")
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    auth_service = AuthService(session)
                    user = await auth_service.get_user_by_id(UUID(user_id))
                    if user and user.status == UserStatus.ACTIVE:
                        return user
        except Exception:
            pass  # Fall through to guest user
    
    # No valid authentication - use guest user
    # Check if guest user exists, create if not
    auth_service = AuthService(session)
    
    # Use a fixed email for the guest user
    guest_email = "guest@smartwaste.app"
    guest_user = await auth_service.get_user_by_email(guest_email)
    
    if not guest_user:
        # Create guest user (handle race condition with concurrent requests)
        from src.schemas.user import UserCreate
        from sqlalchemy.exc import IntegrityError
        guest_data = UserCreate(
            email=guest_email,
            password="GuestUser123!",  # Not used for guest access
            first_name="Guest",
            last_name="User",
            role=UserRole.CITIZEN,
        )
        try:
            guest_user = await auth_service.create_user(guest_data, commit=True)
        except (IntegrityError, Exception):
            await session.rollback()
            guest_user = await auth_service.get_user_by_email(guest_email)
    
    return guest_user


# Type aliases for cleaner route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
PublicUser = Annotated[User, Depends(get_current_user_or_guest)]  # User or guest
DbSession = Annotated[AsyncSession, Depends(get_session)]


def get_client_ip(
    x_forwarded_for: str | None = Header(None),
    x_real_ip: str | None = Header(None),
) -> str | None:
    """Extract client IP from headers."""
    if x_forwarded_for:
        # Take first IP from the list
        return x_forwarded_for.split(",")[0].strip()
    return x_real_ip


def get_user_agent(
    user_agent: str | None = Header(None),
) -> str | None:
    """Get user agent from headers."""
    return user_agent
