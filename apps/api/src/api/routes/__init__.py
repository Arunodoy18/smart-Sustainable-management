"""
API Routes
==========

Router configuration and route registration.
"""

from .auth import router as auth_router
from .waste import router as waste_router
from .pickup import router as pickup_router
from .rewards import router as rewards_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "waste_router",
    "pickup_router",
    "rewards_router",
    "admin_router",
]
