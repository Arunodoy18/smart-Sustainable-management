from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import hashlib
from app.core.config import settings


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using SHA-256 with salt."""
    if ':' not in hashed_password:
        return False
    salt, stored_hash = hashed_password.split(':', 1)
    computed_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
    return computed_hash == stored_hash


def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256 with a random salt."""
    import secrets
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{password_hash}"
