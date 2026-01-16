import os
import sys
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Waste Management AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

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

    # Vector DB
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    # AI
    OPENAI_API_KEY: str = "sk-..."
    MODEL_NAME: str = "gpt-4o"

    # Storage
    STORAGE_PATH: str = "./storage"

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

    def validate_production_config(self) -> None:
        """Validate critical configuration in production. Fails fast with clear errors."""
        if not self.is_production:
            return

        errors = []

        # Check SECRET_KEY is not default
        if "DEVELOPMENT" in self.SECRET_KEY or "change" in self.SECRET_KEY.lower():
            errors.append("SECRET_KEY must be changed from default value in production")

        # Check database is configured
        db_url = self.database_url
        if "localhost" in db_url and self.is_production:
            errors.append("Database URL points to localhost in production")

        # Check OpenAI key if AI features are expected
        if (
            self.OPENAI_API_KEY.startswith("sk-...")
            or self.OPENAI_API_KEY == "mock-key"
        ):
            errors.append("OPENAI_API_KEY is not configured (AI features will fail)")

        if errors:
            print("\n" + "=" * 60, file=sys.stderr)
            print("FATAL: Production configuration errors detected", file=sys.stderr)
            print("=" * 60, file=sys.stderr)
            for error in errors:
                print(f"  ✗ {error}", file=sys.stderr)
            print("=" * 60 + "\n", file=sys.stderr)
            sys.exit(1)


settings = Settings()

# Validate on import (fails fast in production)
settings.validate_production_config()
