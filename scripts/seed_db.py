#!/usr/bin/env python3
"""
Database Seeder
===============

Seeds the database with initial data for development and production.
"""

import asyncio
import argparse
from datetime import datetime
from uuid import uuid4

# Add parent to path for imports
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "api"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.core.config import settings
from src.core.security import get_password_hash
from src.models.user import User


async def seed_users(session: AsyncSession) -> None:
    """Seed default users."""
    
    users_data = [
        {
            "email": "admin@smartwaste.com",
            "password": "Admin123!",
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
        },
        {
            "email": "demo@smartwaste.com",
            "password": "Demo123!",
            "first_name": "Demo",
            "last_name": "Citizen",
            "role": "citizen",
        },
        {
            "email": "driver@smartwaste.com",
            "password": "Driver123!",
            "first_name": "Demo",
            "last_name": "Driver",
            "role": "driver",
        },
    ]
    
    for user_data in users_data:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.email == user_data["email"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"  User {user_data['email']} already exists, skipping...")
            continue
        
        user = User(
            id=uuid4(),
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            role=user_data["role"],
            status="active",
            email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(user)
        print(f"  Created user: {user_data['email']} (role: {user_data['role']})")
    
    await session.commit()


async def main(production: bool = False) -> None:
    """Main seeding function."""
    
    print("\n" + "=" * 50)
    print("Smart Waste Database Seeder")
    print("=" * 50 + "\n")
    
    if production:
        print("⚠️  Running in PRODUCTION mode")
        confirm = input("Are you sure? (type 'yes' to continue): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            return
    
    # Create engine
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("\n📝 Seeding users...")
        await seed_users(session)
    
    await engine.dispose()
    
    print("\n✅ Database seeding complete!\n")
    print("Default credentials:")
    print("  Admin: admin@smartwaste.com / Admin123!")
    print("  Citizen: demo@smartwaste.com / Demo123!")
    print("  Driver: driver@smartwaste.com / Driver123!")
    print("\n⚠️  Change these passwords in production!\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the database")
    parser.add_argument(
        "--production",
        action="store_true",
        help="Run in production mode (requires confirmation)",
    )
    args = parser.parse_args()
    
    asyncio.run(main(production=args.production))
