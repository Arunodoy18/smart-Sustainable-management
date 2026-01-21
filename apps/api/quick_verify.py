#!/usr/bin/env python3
"""
Quick Production Verification
==============================

Fast smoke test for deployed API.
Run this immediately after deployment to catch critical issues.

Usage:
    python quick_verify.py https://your-app.onrender.com
"""

import asyncio
import sys

import httpx


async def verify_deployment(api_url: str) -> bool:
    """Run quick smoke tests."""
    api_url = api_url.rstrip("/")
    
    print(f"🔍 Verifying deployment: {api_url}\n")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test 1: Health check
        print("1️⃣ Testing /health...")
        try:
            response = await client.get(f"{api_url}/health")
            if response.status_code == 200:
                print("   ✅ Health check passed\n")
            else:
                print(f"   ❌ Health check failed: {response.status_code}\n")
                return False
        except Exception as e:
            print(f"   ❌ Health check error: {e}\n")
            return False
        
        # Test 2: Readiness check
        print("2️⃣ Testing /ready...")
        try:
            response = await client.get(f"{api_url}/ready")
            if response.status_code == 200:
                data = response.json()
                if data.get("ready"):
                    print(f"   ✅ Readiness check passed")
                    print(f"      Database: {data['checks']['database']}")
                    print(f"      Cache: {data['checks']['cache']}\n")
                else:
                    print(f"   ⚠️  Service not ready: {data}\n")
                    return False
            else:
                print(f"   ❌ Readiness check failed: {response.status_code}\n")
                return False
        except Exception as e:
            print(f"   ❌ Readiness check error: {e}\n")
            return False
        
        # Test 3: Auth registration (new user)
        print("3️⃣ Testing /api/v1/auth/register...")
        test_email = f"verify-{int(asyncio.get_event_loop().time())}@example.com"
        try:
            response = await client.post(
                f"{api_url}/api/v1/auth/register",
                json={
                    "email": test_email,
                    "password": "SecurePass123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            if response.status_code == 201:
                print(f"   ✅ Registration successful\n")
            else:
                print(f"   ❌ Registration failed: {response.status_code}")
                print(f"      Response: {response.text}\n")
                return False
        except Exception as e:
            print(f"   ❌ Registration error: {e}\n")
            return False
        
        # Test 4: Duplicate email (CRITICAL - must be 400, not 500)
        print("4️⃣ Testing duplicate email protection (CRITICAL)...")
        try:
            response = await client.post(
                f"{api_url}/api/v1/auth/register",
                json={
                    "email": test_email,  # Same email
                    "password": "SecurePass123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            if response.status_code == 400:
                print(f"   ✅ Duplicate email correctly rejected with 400\n")
            elif response.status_code == 500:
                print(f"   🚨 CRITICAL: Duplicate email returned 500!")
                print(f"      This must be fixed before production use.\n")
                return False
            else:
                print(f"   ⚠️  Unexpected status code: {response.status_code}\n")
        except Exception as e:
            print(f"   ❌ Duplicate email test error: {e}\n")
            return False
        
        # Test 5: Login
        print("5️⃣ Testing /api/v1/auth/login...")
        try:
            response = await client.post(
                f"{api_url}/api/v1/auth/login",
                json={"email": test_email, "password": "SecurePass123!"},
            )
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "refresh_token" in data:
                    print(f"   ✅ Login successful with tokens\n")
                else:
                    print(f"   ❌ Login response missing tokens\n")
                    return False
            else:
                print(f"   ❌ Login failed: {response.status_code}")
                print(f"      Response: {response.text}\n")
                return False
        except Exception as e:
            print(f"   ❌ Login error: {e}\n")
            return False
    
    return True


async def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python quick_verify.py <API_URL>")
        print("Example: python quick_verify.py https://your-app.onrender.com")
        sys.exit(1)
    
    api_url = sys.argv[1]
    success = await verify_deployment(api_url)
    
    if success:
        print("=" * 60)
        print("✅ ALL CHECKS PASSED - Deployment verified!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("=" * 60)
        print("❌ VERIFICATION FAILED - Check errors above")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
