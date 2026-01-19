"""
API Package
===========

FastAPI API configuration and dependencies.
"""

from .deps import (
    get_current_user,
    get_optional_user,
    require_role,
    RequireAdmin,
    RequireDriver,
    RequireCitizen,
    CurrentUser,
    OptionalUser,
    DbSession,
)
from .routes import (
    auth_router,
    waste_router,
    pickup_router,
    rewards_router,
    admin_router,
)

__all__ = [
    # Dependencies
    "get_current_user",
    "get_optional_user",
    "require_role",
    "RequireAdmin",
    "RequireDriver",
    "RequireCitizen",
    "CurrentUser",
    "OptionalUser",
    "DbSession",
    # Routers
    "auth_router",
    "waste_router",
    "pickup_router",
    "rewards_router",
    "admin_router",
]
