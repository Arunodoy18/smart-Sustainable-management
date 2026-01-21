#!/bin/bash
# ==============================================================================
# Smart Waste AI - Production Startup Script
# ==============================================================================
#
# IMPORTANT: This script does NOT run Alembic migrations automatically.
# Migrations must be run manually BEFORE deployment using:
#
#   alembic upgrade head
#
# This is intentional for production safety. Automatic migrations can cause:
# - Data loss if a migration has bugs
# - Downtime if migrations take too long
# - Deployment failures that are hard to debug
#
# RECOVERY PROCEDURES:
# ====================
# If deployment fails due to migration issues:
#
# 1. Check current migration state:
#    alembic current
#
# 2. If database is ahead of code (migration applied but code not deployed):
#    alembic downgrade -1
#
# 3. If alembic_version table is corrupted or out of sync:
#    alembic stamp head
#    (This marks all migrations as applied without running them)
#
# 4. View migration history:
#    alembic history --verbose
#
# ==============================================================================

set -e

echo "=========================================="
echo "Smart Waste AI - Starting Application"
echo "=========================================="
echo ""
echo "Environment: ${APP_ENV:-production}"
echo "Port: ${PORT:-8000}"
echo ""

# Verify database connectivity (without running migrations)
echo "Checking database connectivity..."
python -c "
from src.core.config import settings
from sqlalchemy import create_engine, text
try:
    engine = create_engine(settings.sync_database_url)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('Database connection: OK')
except Exception as e:
    print(f'Database connection: FAILED - {e}')
    exit(1)
"

# Check if alembic_version table exists and show current state
echo ""
echo "Checking migration status..."
python -c "
from src.core.config import settings
from sqlalchemy import create_engine, text, inspect
try:
    engine = create_engine(settings.sync_database_url)
    inspector = inspect(engine)
    if 'alembic_version' in inspector.get_table_names():
        with engine.connect() as conn:
            result = conn.execute(text('SELECT version_num FROM alembic_version'))
            row = result.fetchone()
            if row:
                print(f'Current migration: {row[0]}')
            else:
                print('WARNING: alembic_version table exists but is empty')
    else:
        print('WARNING: No alembic_version table found - migrations may not have been run')
except Exception as e:
    print(f'Could not check migration status: {e}')
"

echo ""
echo "Starting uvicorn server..."
echo "=========================================="

exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
