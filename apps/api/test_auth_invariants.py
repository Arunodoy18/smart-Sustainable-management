#!/usr/bin/env python3
"""
Auth Invariant Tests
====================

CRITICAL: These tests verify that authentication endpoints maintain
specific invariants that MUST hold in production.

These are NOT unit tests - they are INVARIANT CHECKS.
If any of these fail, the system is NOT production-ready.

Run before deployment:
    python test_auth_invariants.py

Exit codes:
    0: All invariants hold
    1: Invariant violation - MUST FIX before deploying
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session_factory
from src.services.auth_service import AuthService
from src.services import AuthenticationError
from src.schemas.user import UserCreate
from src.models.user import UserRole


class InvariantViolation(Exception):
    """Raised when an invariant is violated."""
    pass


async def test_invariant_duplicate_email_never_500():
    """INVARIANT: Duplicate email must raise AuthenticationError, never crash."""
    print("Testing INVARIANT: Duplicate email raises AuthenticationError...")
    
    async with async_session_factory() as session:
        auth_service = AuthService(session)
        
        # Create first user
        user_data = UserCreate(
            email="invariant_test@example.com",
            password="SecurePass123!",
            first_name="Test",
            last_name="User",
            phone="+1234567890",
            role=UserRole.CITIZEN,
        )
        
        # First registration should succeed
        try:
            user1 = await auth_service.register_user(user_data)
            print(f"   ✅ First registration succeeded: {user1.email}")
        except Exception as e:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_test@example.com'"))
            await session.commit()
            raise InvariantViolation(f"First registration failed: {e}")
        
        # Second registration MUST raise AuthenticationError
        try:
            user2 = await auth_service.register_user(user_data)
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_test@example.com'"))
            await session.commit()
            raise InvariantViolation("Duplicate email did NOT raise AuthenticationError")
        except AuthenticationError as e:
            if "already registered" in str(e).lower():
                print(f"   ✅ Duplicate email correctly raised AuthenticationError")
            else:
                # Clean up
                await session.rollback()
                await session.execute(text("DELETE FROM users WHERE email = 'invariant_test@example.com'"))
                await session.commit()
                raise InvariantViolation(f"Wrong error message: {e}")
        except Exception as e:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_test@example.com'"))
            await session.commit()
            raise InvariantViolation(f"Duplicate email raised wrong exception: {type(e).__name__}: {e}")
        
        # Clean up
        await session.execute(text("DELETE FROM users WHERE email = 'invariant_test@example.com'"))
        await session.commit()


async def test_invariant_registration_creates_user():
    """INVARIANT: Valid registration must create user in database."""
    print("Testing INVARIANT: Registration creates user in database...")
    
    async with async_session_factory() as session:
        auth_service = AuthService(session)
        
        user_data = UserCreate(
            email="invariant_creates@example.com",
            password="SecurePass123!",
            first_name="Test",
            last_name="User",
            phone="+1234567890",
            role=UserRole.CITIZEN,
        )
        
        # Register user
        try:
            user = await auth_service.register_user(user_data)
            print(f"   ✅ Registration returned user object: {user.id}")
        except Exception as e:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_creates@example.com'"))
            await session.commit()
            raise InvariantViolation(f"Registration failed: {e}")
        
        # Verify user exists in database
        result = await session.execute(
            text("SELECT id, email FROM users WHERE email = 'invariant_creates@example.com'")
        )
        row = result.fetchone()
        
        if not row:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_creates@example.com'"))
            await session.commit()
            raise InvariantViolation("User not found in database after registration")
        
        print(f"   ✅ User exists in database: {row[0]}")
        
        # Clean up
        await session.execute(text("DELETE FROM users WHERE email = 'invariant_creates@example.com'"))
        await session.commit()


async def test_invariant_login_after_register():
    """INVARIANT: Login must succeed immediately after registration."""
    print("Testing INVARIANT: Login succeeds after registration...")
    
    async with async_session_factory() as session:
        auth_service = AuthService(session)
        
        user_data = UserCreate(
            email="invariant_login@example.com",
            password="SecurePass123!",
            first_name="Test",
            last_name="User",
            phone="+1234567890",
            role=UserRole.CITIZEN,
        )
        
        # Register
        try:
            user = await auth_service.register_user(user_data)
            print(f"   ✅ Registration succeeded: {user.email}")
        except Exception as e:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_login@example.com'"))
            await session.commit()
            raise InvariantViolation(f"Registration failed: {e}")
        
        # Login with same credentials
        from src.schemas.user import LoginRequest
        login_data = LoginRequest(
            email="invariant_login@example.com",
            password="SecurePass123!",
        )
        
        try:
            tokens = await auth_service.login(login_data)
            print(f"   ✅ Login succeeded with access_token: {tokens.access_token[:20]}...")
        except Exception as e:
            # Clean up
            await session.rollback()
            await session.execute(text("DELETE FROM users WHERE email = 'invariant_login@example.com'"))
            await session.execute(text("DELETE FROM refresh_tokens WHERE user_id = :user_id"), {"user_id": user.id})
            await session.commit()
            raise InvariantViolation(f"Login failed after registration: {e}")
        
        # Clean up
        await session.execute(text("DELETE FROM refresh_tokens WHERE user_id = :user_id"), {"user_id": user.id})
        await session.execute(text("DELETE FROM users WHERE email = 'invariant_login@example.com'"))
        await session.commit()


async def test_invariant_enum_values_uppercase():
    """INVARIANT: All enum columns must accept UPPERCASE values."""
    print("Testing INVARIANT: Enum columns accept UPPERCASE values...")
    
    async with async_session_factory() as session:
        # Test UserRole and UserStatus
        result = await session.execute(
            text("""
                INSERT INTO users (id, email, hashed_password, first_name, last_name, role, status)
                VALUES (gen_random_uuid(), 'enum_test@example.com', 'hash', 'Test', 'User', 'CITIZEN', 'ACTIVE')
                RETURNING id
            """)
        )
        user_id = result.scalar()
        
        if not user_id:
            raise InvariantViolation("Failed to insert user with UPPERCASE enum values")
        
        print(f"   ✅ User enums accepted: CITIZEN, ACTIVE")
        
        # Clean up
        await session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        await session.commit()


async def test_invariant_transaction_rollback():
    """INVARIANT: Failed transactions must rollback without corrupting database."""
    print("Testing INVARIANT: Transaction rollback on failure...")
    
    async with async_session_factory() as session:
        initial_count_result = await session.execute(text("SELECT COUNT(*) FROM users WHERE email LIKE 'rollback_test%'"))
        initial_count = initial_count_result.scalar()
        
        # Try to create user with duplicate email (should fail and rollback)
        auth_service = AuthService(session)
        
        # Create first user
        user_data1 = UserCreate(
            email="rollback_test@example.com",
            password="SecurePass123!",
            first_name="Test",
            last_name="User",
            phone="+1234567890",
            role=UserRole.CITIZEN,
        )
        
        try:
            await auth_service.register_user(user_data1)
        except Exception:
            pass
        
        # Try duplicate (should fail and rollback)
        try:
            await auth_service.register_user(user_data1)
        except AuthenticationError:
            pass  # Expected
        
        # Count should only increase by 1
        final_count_result = await session.execute(text("SELECT COUNT(*) FROM users WHERE email LIKE 'rollback_test%'"))
        final_count = final_count_result.scalar()
        
        if final_count != initial_count + 1:
            # Clean up
            await session.execute(text("DELETE FROM users WHERE email LIKE 'rollback_test%'"))
            await session.commit()
            raise InvariantViolation(f"Transaction rollback failed: expected {initial_count + 1} users, got {final_count}")
        
        print(f"   ✅ Transaction rolled back correctly")
        
        # Clean up
        await session.execute(text("DELETE FROM users WHERE email LIKE 'rollback_test%'"))
        await session.commit()


async def run_all_invariants():
    """Run all invariant tests."""
    print("=" * 80)
    print("🔒 AUTH INVARIANT TESTS")
    print("=" * 80)
    print()
    
    invariants = [
        test_invariant_duplicate_email_never_500,
        test_invariant_registration_creates_user,
        test_invariant_login_after_register,
        test_invariant_enum_values_uppercase,
        test_invariant_transaction_rollback,
    ]
    
    failed = []
    
    for invariant in invariants:
        try:
            await invariant()
        except InvariantViolation as e:
            print(f"   ❌ INVARIANT VIOLATED: {e}")
            failed.append((invariant.__name__, str(e)))
        except Exception as e:
            print(f"   ❌ UNEXPECTED ERROR: {e}")
            failed.append((invariant.__name__, f"Unexpected: {e}"))
        print()
    
    print("=" * 80)
    
    if failed:
        print(f"❌ {len(failed)} INVARIANT(S) VIOLATED - NOT PRODUCTION READY")
        print("=" * 80)
        print()
        for name, error in failed:
            print(f"  • {name}: {error}")
        return 1
    else:
        print(f"✅ ALL {len(invariants)} INVARIANTS HOLD - Production Ready")
        print("=" * 80)
        return 0


async def main():
    """Main entry point."""
    try:
        exit_code = await run_all_invariants()
        return exit_code
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
