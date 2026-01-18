import os
import sys
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Waste Management AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Server Configuration
    PORT: int = 8000  # Port for uvicorn server (Render uses this)
    HOST: str = "0.0.0.0"  # Bind to all interfaces for containers/cloud

    # Security
    SECRET_KEY: str = "DEVELOPMENT_SECRET_KEY_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "waste_management"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    DATABASE_URL: Optional[str] = None

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AI
    OPENAI_API_KEY: str = "sk-..."
    MODEL_NAME: str = "gpt-4o"

    # Storage
    STORAGE_PATH: str = "./storage"
    
    # Frontend URL for CORS (optional, for production)
    FRONTEND_URL: Optional[str] = None

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", extra="ignore"
    )

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    def validate_production_config(self) -> list[str]:
        """
        Validate critical configuration in production.
        Returns a list of warning messages instead of exiting.
        This allows health checks to work even with config issues.
        """
        warnings = []

        if not self.is_production:
            return warnings

        # Check SECRET_KEY is not default
        if "DEVELOPMENT" in self.SECRET_KEY or "change" in self.SECRET_KEY.lower():
            warnings.append(
                "SECRET_KEY should be changed from default value in production"
            )

        # Check database is configured
        db_url = self.database_url
        if "localhost" in db_url:
            warnings.append("Database URL points to localhost in production")

        # Check OpenAI key if AI features are expected
        if (
            self.OPENAI_API_KEY.startswith("sk-...")
            or self.OPENAI_API_KEY == "mock-key"
        ):
            warnings.append("OPENAI_API_KEY is not configured (AI features may fail)")

        return warnings


settings = Settings()

# Log warnings but DO NOT exit - health checks must still work
_config_warnings = settings.validate_production_config()
if _config_warnings:
    print("\n" + "=" * 60, file=sys.stderr)
    print("WARNING: Production configuration issues detected", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    for warning in _config_warnings:
        print(f"  ⚠ {warning}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(
        "Application will start - health endpoints available at /health",
        file=sys.stderr,
    )
    print("=" * 60 + "\n", file=sys.stderr)
