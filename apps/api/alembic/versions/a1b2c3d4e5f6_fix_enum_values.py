"""Fix enum values to lowercase

Revision ID: a1b2c3d4e5f6
Revises: 3b11939b5277
Create Date: 2026-01-21 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3b11939b5277'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert uppercase enum values to lowercase
    # PostgreSQL requires recreating enums to change values
    
    # For user_role enum
    op.execute("ALTER TYPE user_role RENAME TO user_role_old")
    op.execute("CREATE TYPE user_role AS ENUM ('citizen', 'driver', 'admin')")
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN role TYPE user_role 
        USING (
            CASE role::text
                WHEN 'CITIZEN' THEN 'citizen'
                WHEN 'DRIVER' THEN 'driver'
                WHEN 'ADMIN' THEN 'admin'
                ELSE lower(role::text)
            END
        )::user_role
    """)
    op.execute("DROP TYPE user_role_old")
    
    # For user_status enum
    op.execute("ALTER TYPE user_status RENAME TO user_status_old")
    op.execute("CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated')")
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN status TYPE user_status 
        USING (
            CASE status::text
                WHEN 'PENDING' THEN 'pending'
                WHEN 'ACTIVE' THEN 'active'
                WHEN 'SUSPENDED' THEN 'suspended'
                WHEN 'DEACTIVATED' THEN 'deactivated'
                ELSE lower(status::text)
            END
        )::user_status
    """)
    op.execute("DROP TYPE user_status_old")


def downgrade() -> None:
    # Revert to uppercase enums
    op.execute("ALTER TYPE user_role RENAME TO user_role_old")
    op.execute("CREATE TYPE user_role AS ENUM ('CITIZEN', 'DRIVER', 'ADMIN')")
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN role TYPE user_role 
        USING upper(role::text)::user_role
    """)
    op.execute("DROP TYPE user_role_old")
    
    op.execute("ALTER TYPE user_status RENAME TO user_status_old")
    op.execute("CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')")
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN status TYPE user_status 
        USING upper(status::text)::user_status
    """)
    op.execute("DROP TYPE user_status_old")
