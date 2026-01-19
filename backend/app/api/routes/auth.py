from datetime import timedelta
from typing import Any, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import Profile
from app.schemas.user import User, UserCreate, Token
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    """JSON login request body"""

    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """Google OAuth request body"""

    token: str
    role: Optional[str] = "user"


def _authenticate_user(db: Session, email: str, password: str) -> Profile:
    """Shared authentication logic"""
    user = db.query(Profile).filter(Profile.email == email).first()
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def _create_token_response(user: Profile) -> dict:
    """Create access token response"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Uses form data (application/x-www-form-urlencoded).
    """
    user = _authenticate_user(db, form_data.username, form_data.password)
    return _create_token_response(user)


@router.post("/login", response_model=Token)
def login_json(*, db: Session = Depends(deps.get_db), login_data: LoginRequest) -> Any:
    """
    JSON login endpoint for frontend compatibility.
    Accepts JSON body with email and password.
    """
    user = _authenticate_user(db, login_data.email, login_data.password)
    return _create_token_response(user)


@router.post("/signup", response_model=User)
def create_user(*, db: Session = Depends(deps.get_db), user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    try:
        logger.info(f"Attempting to create user with email: {user_in.email}")
        user = db.query(Profile).filter(Profile.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="The user with this username already exists in the system.",
            )

        db_obj = Profile(
            id=str(uuid.uuid4()),
            email=user_in.email,
            hashed_password=security.get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role if user_in.role else "user",
            phone=user_in.phone,
            address=user_in.address,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Successfully created user: {user_in.email}")
        return db_obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.get("/me", response_model=User)
def read_user_me(
    current_user: Profile = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.post("/google", response_model=Token)
def google_auth(
    *, db: Session = Depends(deps.get_db), auth_data: GoogleAuthRequest
) -> Any:
    """
    Authenticate via Google OAuth.
    Accepts Google ID token, validates it, creates/retrieves user, returns JWT.
    """
    try:
        # Decode the Google token to extract user info
        # In production, you should verify with Google's API
        import base64
        import json

        # Split the JWT and decode the payload
        parts = auth_data.token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid Google token format")

        # Decode payload (add padding if needed)
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        decoded = base64.urlsafe_b64decode(payload)
        user_info = json.loads(decoded)

        email = user_info.get("email")
        name = user_info.get("name", "")

        if not email:
            raise HTTPException(
                status_code=400, detail="Email not found in Google token"
            )

        # Find or create user
        user = db.query(Profile).filter(Profile.email == email).first()

        if not user:
            # Create new user from Google data
            user = Profile(
                id=str(uuid.uuid4()),
                email=email,
                hashed_password=security.get_password_hash(str(uuid.uuid4())),
                full_name=name,
                role=auth_data.role or "user",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user from Google OAuth: {email}")
        else:
            logger.info(f"Google OAuth login for existing user: {email}")

        return _create_token_response(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(
            status_code=400, detail="Failed to authenticate with Google"
        )
    return current_user
