"""
Application Configuration
=========================

Centralized configuration management using Pydantic Settings.
All configuration is loaded from environment variables with sensible defaults.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="EcoWaste AI", description="Application name")
    app_env: Literal["development", "staging", "production"] = Field(
        default="development", description="Application environment"
    )
    debug: bool = Field(default=False, description="Debug mode")
    secret_key: str = Field(
        default="change-me-in-production-min-32-chars",
        min_length=32,
        description="Application secret key",
    )
    api_version: str = Field(default="v1", description="API version prefix")

    # Server
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, ge=1, le=65535, description="API port")
    frontend_url: str = Field(
        default="http://localhost:3000", description="Frontend URL for CORS"
    )
    allowed_origins: str = Field(
        default="https://wastifi.netlify.app,http://localhost:3000,http://localhost:5173,http://localhost:8080",
        description="Comma-separated list of allowed CORS origins",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://smartwaste:smartwaste_dev@localhost:5432/smartwaste",
        description="Database connection URL (PostgreSQL)",
    )
    database_pool_size: int = Field(
        default=20, ge=5, le=100, description="Database connection pool size"
    )
    database_max_overflow: int = Field(
        default=10, ge=0, le=50, description="Database max overflow connections"
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0", description="Redis connection URL"
    )
    redis_cache_ttl: int = Field(
        default=3600, ge=60, description="Default Redis cache TTL in seconds"
    )

    # JWT Authentication
    jwt_secret_key: str = Field(
        default="jwt-secret-key-change-in-production",
        min_length=32,
        description="JWT signing secret key",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=30, ge=5, le=1440, description="Access token expiration in minutes"
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7, ge=1, le=30, description="Refresh token expiration in days"
    )

    # Object Storage
    storage_backend: Literal["local", "s3"] = Field(
        default="local", description="Storage backend type"
    )
    s3_endpoint_url: str | None = Field(
        default=None, description="S3 endpoint URL (for MinIO/LocalStack)"
    )
    s3_access_key_id: str | None = Field(default=None, description="S3 access key ID")
    s3_secret_access_key: str | None = Field(
        default=None, description="S3 secret access key"
    )
    s3_bucket_name: str = Field(
        default="ecowaste-uploads", description="S3 bucket name"
    )
    s3_region: str = Field(default="us-east-1", description="S3 region")

    # ML Pipeline
    ml_model_path: str = Field(default="./models", description="ML model directory")
    ml_confidence_high_threshold: float = Field(
        default=0.85, ge=0.0, le=1.0, description="High confidence threshold"
    )
    ml_confidence_medium_threshold: float = Field(
        default=0.60, ge=0.0, le=1.0, description="Medium confidence threshold"
    )
    ml_batch_size: int = Field(default=32, ge=1, le=128, description="ML batch size")
    
    # CLIP Model Configuration
    use_clip_classifier: bool = Field(
        default=True, description="Use CLIP model for classification (False = mock classifier)"
    )
    clip_model_id: str = Field(
        default="openai/clip-vit-large-patch14",
        description="HuggingFace model ID for CLIP classifier"
    )
    clip_device: str | None = Field(
        default=None,
        description="Device for CLIP inference (cuda/cpu/None=auto)"
    )
    clip_cache_dir: str | None = Field(
        default=None,
        description="Directory to cache CLIP model files"
    )

    # Maps
    mapbox_access_token: str | None = Field(
        default=None, description="Mapbox access token"
    )

    # Email
    smtp_host: str | None = Field(default=None, description="SMTP host")
    smtp_port: int = Field(default=587, description="SMTP port")
    smtp_user: str | None = Field(default=None, description="SMTP username")
    smtp_password: str | None = Field(default=None, description="SMTP password")
    smtp_from_email: str = Field(
        default="noreply@ecowaste.ai", description="Default from email"
    )

    # Rate Limiting
    rate_limit_requests_per_minute: int = Field(
        default=60, ge=10, description="Rate limit requests per minute"
    )
    rate_limit_burst: int = Field(default=10, ge=1, description="Rate limit burst size")

    # Monitoring
    sentry_dsn: str | None = Field(default=None, description="Sentry DSN")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Log level"
    )

    # Feature Flags
    enable_email_verification: bool = Field(
        default=False, description="Enable email verification"
    )
    enable_driver_approval: bool = Field(
        default=True, description="Require admin approval for drivers"
    )
    enable_rewards_system: bool = Field(
        default=True, description="Enable rewards/gamification system"
    )

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins into list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @computed_field
    @property
    def async_database_url(self) -> str:
        """Convert database URL to async version for SQLAlchemy."""
        url = self.database_url
        # Handle Render's postgres:// URL format
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @computed_field
    @property
    def sync_database_url(self) -> str:
        """Get sync database URL for Alembic migrations."""
        url = self.database_url
        # Handle Render's postgres:// URL format
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        elif url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
        return url

    @computed_field
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.app_env == "production"

    @computed_field
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


# Convenience export
settings = get_settings()
