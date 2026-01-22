"""Fix enum values - align with database

Revision ID: a1b2c3d4e5f6
Revises: 3b11939b5277
Create Date: 2026-01-20 16:00:00.000000

MIGRATION SAFETY NOTICE:
========================
This migration was created to fix enum value consistency between
the database and Python code. It is intentionally a no-op because
the initial migration already created the enums correctly.

DO NOT DELETE OR RENAME this migration file - it has already been
applied to production databases.

If you need schema changes, create a NEW migration using:
    alembic revision --autogenerate -m "description"
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None  # This is now the initial migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    No-op migration.
    
    The initial migration already creates enums with the correct values.
    This migration exists only to maintain chain integrity.
    """
    pass


def downgrade() -> None:
    """
    No-op migration.
    """
    pass
