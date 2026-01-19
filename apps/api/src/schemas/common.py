"""
Common Schema Utilities
=======================

Shared Pydantic models and utilities.
"""

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        },
    )


class TimestampMixin(BaseModel):
    """Mixin for created_at/updated_at timestamps."""

    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseSchema, Generic[T]):
    """Generic paginated response."""

    items: list[T]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_pages: int = Field(ge=0)

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        """Create paginated response from items."""
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class SuccessResponse(BaseSchema):
    """Generic success response."""

    success: bool = True
    message: str


class ErrorDetail(BaseSchema):
    """Error detail for API responses."""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseSchema):
    """Error response format."""

    success: bool = False
    error: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class HealthResponse(BaseSchema):
    """Health check response."""

    status: str = "healthy"
    version: str
    environment: str
    timestamp: datetime
    services: dict[str, Any] = Field(default_factory=dict)


class PaginationParams(BaseSchema):
    """Pagination query parameters."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Items per page",
    )

    @property
    def offset(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.page_size
