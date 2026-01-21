"""
Authentication Routes
=====================

API endpoints for authentication and user management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import (
    CurrentUser,
    DbSession,
    get_client_ip,
    get_user_agent,
)
from src.core.logging import get_logger
from src.models.user import UserRole
from src.schemas.user import (
    DriverRegistration,
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserProfileResponse,
    UserResponse,
    UserUpdate,
)
from src.schemas.common import SuccessResponse
from src.services import AuthenticationError, AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new citizen account.",
)
async def register(
    data: UserCreate,
    session: DbSession,
):
    """
    Register a new user account.
    
    Returns:
        201: User successfully created
        400: Email already exists or invalid data
        422: Request validation failed
        
    Note: All database errors are caught and returned as 400.
          This endpoint never returns 500 for user errors.
    """
    # Force citizen role for public registration
    data.role = UserRole.CITIZEN
    
    try:
        auth_service = AuthService(session)
        user = await auth_service.register_user(data)
        logger.info(f"Successfully registered user: {user.email}")
        return user
    except AuthenticationError as e:
        logger.info(f"Registration failed: {str(e)} for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Catch-all for any unexpected errors (should never happen with proper service layer)
        logger.error(f"Unexpected error in register endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please try again.",
        )


@router.post(
    "/register/driver",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as driver",
    description="Create a new driver account. Requires admin approval.",
)
async def register_driver(
    data: DriverRegistration,
    session: DbSession,
):
    """
    Register a new driver account.
    
    Returns:
        201: Driver account created (pending approval)
        400: Email already exists or invalid data
        422: Request validation failed
    """
    try:
        auth_service = AuthService(session)
        user = await auth_service.register_driver(data)
        logger.info(f"Successfully registered driver: {user.email}")
        return user
    except AuthenticationError as e:
        logger.info(f"Driver registration failed: {str(e)} for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error in register_driver endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver registration failed. Please try again.",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate and receive access tokens.",
)
async def login(
    data: LoginRequest,
    session: DbSession,
    client_ip: Annotated[str | None, Depends(get_client_ip)] = None,
    user_agent: Annotated[str | None, Depends(get_user_agent)] = None,
):
    """
    Authenticate user and return tokens.
    
    Returns:
        200: Login successful with access/refresh tokens
        401: Invalid credentials or account not active
        422: Request validation failed
    """
    try:
        auth_service = AuthService(session)
        tokens = await auth_service.login(
            data,
            device_info=user_agent,
            ip_address=client_ip,
        )
        logger.info(f"User logged in successfully: {data.email}")
        return tokens
    except AuthenticationError as e:
        logger.info(f"Login failed: {str(e)} for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error in login endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed. Please try again.",
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh tokens",
    description="Get new access token using refresh token.",
)
async def refresh_tokens(
    data: RefreshTokenRequest,
    session: DbSession,
    client_ip: Annotated[str | None, Depends(get_client_ip)] = None,
    user_agent: Annotated[str | None, Depends(get_user_agent)] = None,
):
    """Refresh access token."""
    try:
        auth_service = AuthService(session)
        tokens = await auth_service.refresh_tokens(
            data.refresh_token,
            device_info=user_agent,
            ip_address=client_ip,
        )
        return tokens
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post(
    "/logout",
    response_model=SuccessResponse,
    summary="Logout",
    description="Revoke refresh token.",
)
async def logout(
    data: RefreshTokenRequest,
    session: DbSession,
):
    """Logout and revoke refresh token."""
    auth_service = AuthService(session)
    await auth_service.logout(data.refresh_token)
    return SuccessResponse(message="Logged out successfully")


@router.post(
    "/logout-all",
    response_model=SuccessResponse,
    summary="Logout all devices",
    description="Revoke all refresh tokens for the current user.",
)
async def logout_all(
    current_user: CurrentUser,
    session: DbSession,
):
    """Logout from all devices."""
    auth_service = AuthService(session)
    await auth_service.logout_all_devices(current_user.id)
    return SuccessResponse(message="Logged out from all devices")


@router.post(
    "/password/reset",
    response_model=SuccessResponse,
    summary="Request password reset",
    description="Send password reset email.",
)
async def request_password_reset(
    data: PasswordResetRequest,
    session: DbSession,
):
    """Request password reset email."""
    auth_service = AuthService(session)
    token = await auth_service.request_password_reset(data.email)
    
    # In production, send email with token
    # For now, just return success regardless of whether email exists
    # This prevents email enumeration attacks
    
    return SuccessResponse(
        message="If an account exists with this email, a reset link has been sent."
    )


@router.post(
    "/password/reset/confirm",
    response_model=SuccessResponse,
    summary="Confirm password reset",
    description="Reset password using token.",
)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    session: DbSession,
):
    """Reset password with token."""
    auth_service = AuthService(session)
    success = await auth_service.reset_password(data.token, data.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    return SuccessResponse(message="Password reset successfully")


@router.post(
    "/password/change",
    response_model=SuccessResponse,
    summary="Change password",
    description="Change password for authenticated user.",
)
async def change_password(
    data: PasswordChangeRequest,
    current_user: CurrentUser,
    session: DbSession,
):
    """Change password for current user."""
    auth_service = AuthService(session)
    success = await auth_service.change_password(
        current_user.id,
        data.current_password,
        data.new_password,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    return SuccessResponse(message="Password changed successfully")


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user",
    description="Get profile of authenticated user.",
)
async def get_current_user_profile(
    current_user: CurrentUser,
    session: DbSession,
):
    """Get current user's profile."""
    from src.services import RewardsService
    
    rewards_service = RewardsService(session)
    summary = await rewards_service.get_user_reward_summary(current_user.id)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        status=current_user.status,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login_at=current_user.last_login_at,
        total_points=summary.total_points,
        current_streak=summary.current_streak,
        total_waste_entries=0,  # Could calculate from DB
        level=summary.level,
    )


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile",
    description="Update current user's profile.",
)
async def update_profile(
    data: UserUpdate,
    current_user: CurrentUser,
    session: DbSession,
):
    """Update current user's profile."""
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    if data.phone is not None:
        current_user.phone = data.phone
    
    await session.flush()
    
    return current_user
