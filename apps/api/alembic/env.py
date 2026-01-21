"""
Alembic Environment Configuration
==================================

Configures Alembic for SQLAlchemy migrations.

CRITICAL MIGRATION RULES:
=========================
1. NEVER rename migration files after they've been applied to any environment
2. NEVER delete migration files - use downgrade() to reverse changes
3. NEVER modify an applied migration - create a new one instead
4. ALWAYS test migrations locally before deploying to production
5. ALWAYS backup the database before running migrations in production
6. NEVER change enum values in existing migrations - create new migration instead

MIGRATION WORKFLOW:
==================
1. Make model changes in src/models/
2. Generate migration: alembic revision --autogenerate -m "description"
3. Review the generated migration file (check for drops, data loss)
4. Test locally: alembic upgrade head
5. Commit migration file with code changes
6. Deploy application code
7. Run on production: alembic upgrade head (MANUALLY, not in startup script)

WHEN TO USE 'alembic upgrade head':
===================================
✅ After pulling new code with migration files
✅ To apply pending migrations to database
✅ First deployment to new environment
✅ After reviewing migration SQL with: alembic upgrade head --sql

WHEN TO USE 'alembic stamp head':
==================================
⚠️  DANGEROUS - Only use in these specific scenarios:
✅ Database schema is correct but alembic_version table is wrong
✅ Manually applied migrations and need to mark them as done
✅ Recovering from corrupted alembic_version table
❌ NEVER use to skip migrations without applying them
❌ NEVER use if schema doesn't match the target revision

RECOVERY:
=========
- View current state: alembic current
- View history: alembic history --verbose
- Downgrade one step: alembic downgrade -1
- Force mark as current: alembic stamp head (use carefully!)
- Compare DB to models: alembic check (requires alembic 1.12+)

ENUM SAFETY:
============
⚠️  PostgreSQL enum changes are DANGEROUS and can cause downtime:
- Adding enum values: Safe (use ALTER TYPE ... ADD VALUE)
- Removing enum values: Dangerous (must check no data uses it first)
- Renaming enum values: Dangerous (data migration required)
- Changing enum order: Safe but pointless (Postgres doesn't care about order)

Always coordinate enum changes between:
1. Database enum (via migration)
2. Python model enum (src/models/*.py)
3. Pydantic schema enum (if exists)
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool, engine_from_config
from sqlalchemy.engine import Connection

from alembic import context

# Ensure the src directory is in the path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import models and base
from src.core.database.base import Base
from src.core.config import settings

# Import all models to ensure they're registered with Base.metadata
# This is REQUIRED for autogenerate to detect model changes
from src.models import user, waste, pickup, rewards, analytics  # noqa: F401

# Alembic Config object
config = context.config

# Configure logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set SQLAlchemy URL from settings
# IMPORTANT: Use sync driver (postgresql://) for Alembic, not async (postgresql+asyncpg://)
config.set_main_option("sqlalchemy.url", settings.sync_database_url)

# Target metadata - this is what Alembic uses to detect schema changes
# All models must be imported above for their tables to be in Base.metadata
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This generates SQL scripts without connecting to the database.
    Useful for reviewing changes before applying them.
    
    Usage: alembic upgrade head --sql
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Compare type changes (e.g., String(100) -> String(200))
        compare_type=True,
        # Compare server defaults
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    Creates an actual database connection and applies migrations.
    This is the normal mode for development and production.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Compare type changes
            compare_type=True,
            # Compare server defaults
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
