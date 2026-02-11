"""Backfill NULL defaults on critical numeric columns

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-12 04:00:00.000000

MIGRATION SAFETY NOTICE:
========================
This migration adds server-side defaults to numeric columns in
user_points and user_streaks tables, and backfills any existing
NULL values to prevent runtime crashes (e.g. int > NoneType).

Safe to run against a live production database (adds defaults
and updates NULLs to zero/one — no destructive changes).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. user_points — backfill NULLs then set server_default
    # ------------------------------------------------------------------
    op.execute("UPDATE user_points SET total_points = 0 WHERE total_points IS NULL")
    op.execute("UPDATE user_points SET available_points = 0 WHERE available_points IS NULL")
    op.execute("UPDATE user_points SET redeemed_points = 0 WHERE redeemed_points IS NULL")
    op.execute("UPDATE user_points SET level = 1 WHERE level IS NULL")
    op.execute("UPDATE user_points SET level_progress = 0 WHERE level_progress IS NULL")
    op.execute("UPDATE user_points SET total_waste_entries = 0 WHERE total_waste_entries IS NULL")
    op.execute("UPDATE user_points SET total_recycled_items = 0 WHERE total_recycled_items IS NULL")

    op.alter_column("user_points", "total_points", server_default="0", nullable=False)
    op.alter_column("user_points", "available_points", server_default="0", nullable=False)
    op.alter_column("user_points", "redeemed_points", server_default="0", nullable=False)
    op.alter_column("user_points", "level", server_default="1", nullable=False)
    op.alter_column("user_points", "level_progress", server_default="0", nullable=False)
    op.alter_column("user_points", "total_waste_entries", server_default="0", nullable=False)
    op.alter_column("user_points", "total_recycled_items", server_default="0", nullable=False)

    # ------------------------------------------------------------------
    # 2. user_streaks — backfill NULLs then set server_default
    # ------------------------------------------------------------------
    op.execute("UPDATE user_streaks SET current_streak = 0 WHERE current_streak IS NULL")
    op.execute("UPDATE user_streaks SET longest_streak = 0 WHERE longest_streak IS NULL")

    op.alter_column("user_streaks", "current_streak", server_default="0", nullable=False)
    op.alter_column("user_streaks", "longest_streak", server_default="0", nullable=False)

    # ------------------------------------------------------------------
    # 3. users — backfill safety
    # ------------------------------------------------------------------
    op.execute("UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL")


def downgrade() -> None:
    # Remove NOT NULL and server defaults (reverse to original state)
    op.alter_column("user_points", "total_points", server_default=None, nullable=True)
    op.alter_column("user_points", "available_points", server_default=None, nullable=True)
    op.alter_column("user_points", "redeemed_points", server_default=None, nullable=True)
    op.alter_column("user_points", "level", server_default=None, nullable=True)
    op.alter_column("user_points", "level_progress", server_default=None, nullable=True)
    op.alter_column("user_points", "total_waste_entries", server_default=None, nullable=True)
    op.alter_column("user_points", "total_recycled_items", server_default=None, nullable=True)

    op.alter_column("user_streaks", "current_streak", server_default=None, nullable=True)
    op.alter_column("user_streaks", "longest_streak", server_default=None, nullable=True)
