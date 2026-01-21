#!/usr/bin/env python3
"""
Production Auth Test Suite
===========================

Comprehensive test suite to verify auth endpoints NEVER return HTTP 500.
Tests all error scenarios that should return 4xx instead of 5xx.

Run this after deploying to Render to verify production readiness.
"""

import asyncio
import sys
from typing import Any

import httpx
from pydantic import BaseModel

# Configuration
API_BASE_URL = "http://localhost:8000"  # Change to Render URL for prod testing
TEST_TIMEOUT = 10.0


class TestResult(BaseModel):
    """Test result data."""

    test_name: str
    passed: bool
    expected_status: int
    actual_status: int | None
    error: str | None = None


class AuthTester:
    """Test runner for auth endpoints."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.results: list[TestResult] = []

    async def run_all_tests(self) -> bool:
        """Run all test cases and return overall pass/fail."""
        print("=" * 80)
        print("🧪 PRODUCTION AUTH TEST SUITE")
        print("=" * 80)
        print(f"Testing API: {self.base_url}\n")

        async with httpx.AsyncClient(timeout=TEST_TIMEOUT) as client:
            # Test 1: Health check
            await self.test_health(client)

            # Test 2: Valid registration
            test_email = f"test-{asyncio.get_event_loop().time()}@example.com"
            await self.test_register_success(client, test_email)

            # Test 3: Duplicate email registration (should be 400, not 500)
            await self.test_register_duplicate(client, test_email)

            # Test 4: Invalid password (missing uppercase)
            await self.test_register_weak_password(client)

            # Test 5: Invalid email format
            await self.test_register_invalid_email(client)

            # Test 6: Login with valid credentials
            await self.test_login_success(client, test_email, "SecurePass123!")

            # Test 7: Login with wrong password
            await self.test_login_wrong_password(client, test_email)

            # Test 8: Login with non-existent email
            await self.test_login_nonexistent_user(client)

            # Test 9: Missing required fields
            await self.test_register_missing_fields(client)

            # Test 10: Invalid role (try to register as admin)
            await self.test_register_invalid_role(client)

        # Print results
        self._print_results()
        return all(r.passed for r in self.results)

    async def test_health(self, client: httpx.AsyncClient):
        """Test health endpoint always returns 200."""
        try:
            response = await client.get(f"{self.base_url}/health")
            passed = response.status_code == 200
            self.results.append(
                TestResult(
                    test_name="Health Check",
                    passed=passed,
                    expected_status=200,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Health Check",
                    passed=False,
                    expected_status=200,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_success(self, client: httpx.AsyncClient, email: str):
        """Test successful registration returns 201."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={
                    "email": email,
                    "password": "SecurePass123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            passed = response.status_code == 201
            self.results.append(
                TestResult(
                    test_name="Register Success",
                    passed=passed,
                    expected_status=201,
                    actual_status=response.status_code,
                    error=None if passed else response.text,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Register Success",
                    passed=False,
                    expected_status=201,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_duplicate(self, client: httpx.AsyncClient, email: str):
        """Test duplicate email returns 400 (NOT 500)."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={
                    "email": email,
                    "password": "SecurePass123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            # CRITICAL: Must be 400, never 500
            passed = response.status_code == 400
            self.results.append(
                TestResult(
                    test_name="Duplicate Email (CRITICAL)",
                    passed=passed,
                    expected_status=400,
                    actual_status=response.status_code,
                    error=None if passed else f"Got {response.status_code} instead of 400",
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Duplicate Email (CRITICAL)",
                    passed=False,
                    expected_status=400,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_weak_password(self, client: httpx.AsyncClient):
        """Test weak password returns 422 (validation error)."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={
                    "email": "weak@example.com",
                    "password": "weak",  # Missing uppercase, too short
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            passed = response.status_code == 422
            self.results.append(
                TestResult(
                    test_name="Weak Password",
                    passed=passed,
                    expected_status=422,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Weak Password",
                    passed=False,
                    expected_status=422,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_invalid_email(self, client: httpx.AsyncClient):
        """Test invalid email returns 422 (validation error)."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={
                    "email": "not-an-email",
                    "password": "SecurePass123!",
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "+1234567890",
                },
            )
            passed = response.status_code == 422
            self.results.append(
                TestResult(
                    test_name="Invalid Email",
                    passed=passed,
                    expected_status=422,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Invalid Email",
                    passed=False,
                    expected_status=422,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_login_success(self, client: httpx.AsyncClient, email: str, password: str):
        """Test successful login returns 200 with tokens."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            passed = response.status_code == 200
            if passed:
                data = response.json()
                passed = "access_token" in data and "refresh_token" in data
            self.results.append(
                TestResult(
                    test_name="Login Success",
                    passed=passed,
                    expected_status=200,
                    actual_status=response.status_code,
                    error=None if passed else "Missing tokens in response",
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Login Success",
                    passed=False,
                    expected_status=200,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_login_wrong_password(self, client: httpx.AsyncClient, email: str):
        """Test wrong password returns 401 (NOT 500)."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"email": email, "password": "WrongPassword123!"},
            )
            passed = response.status_code == 401
            self.results.append(
                TestResult(
                    test_name="Wrong Password (CRITICAL)",
                    passed=passed,
                    expected_status=401,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Wrong Password (CRITICAL)",
                    passed=False,
                    expected_status=401,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_login_nonexistent_user(self, client: httpx.AsyncClient):
        """Test non-existent user returns 401 (NOT 500)."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/login",
                json={
                    "email": "nonexistent@example.com",
                    "password": "SecurePass123!",
                },
            )
            passed = response.status_code == 401
            self.results.append(
                TestResult(
                    test_name="Non-existent User",
                    passed=passed,
                    expected_status=401,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Non-existent User",
                    passed=False,
                    expected_status=401,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_missing_fields(self, client: httpx.AsyncClient):
        """Test missing required fields returns 422."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={"email": "test@example.com"},  # Missing password and other fields
            )
            passed = response.status_code == 422
            self.results.append(
                TestResult(
                    test_name="Missing Fields",
                    passed=passed,
                    expected_status=422,
                    actual_status=response.status_code,
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Missing Fields",
                    passed=False,
                    expected_status=422,
                    actual_status=None,
                    error=str(e),
                )
            )

    async def test_register_invalid_role(self, client: httpx.AsyncClient):
        """Test attempting to register as admin is forced to citizen."""
        try:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json={
                    "email": f"admin-test-{asyncio.get_event_loop().time()}@example.com",
                    "password": "SecurePass123!",
                    "first_name": "Admin",
                    "last_name": "User",
                    "phone": "+1234567890",
                    "role": "ADMIN",  # Trying to register as admin
                },
            )
            # Should succeed (201) but role forced to CITIZEN
            passed = response.status_code == 201
            if passed:
                data = response.json()
                passed = data.get("role") == "CITIZEN"
            self.results.append(
                TestResult(
                    test_name="Force Citizen Role",
                    passed=passed,
                    expected_status=201,
                    actual_status=response.status_code,
                    error=None if passed else "Role not forced to CITIZEN",
                )
            )
        except Exception as e:
            self.results.append(
                TestResult(
                    test_name="Force Citizen Role",
                    passed=False,
                    expected_status=201,
                    actual_status=None,
                    error=str(e),
                )
            )

    def _print_results(self):
        """Print test results in a formatted table."""
        print("\n" + "=" * 80)
        print("📊 TEST RESULTS")
        print("=" * 80)

        passed_count = sum(1 for r in self.results if r.passed)
        total_count = len(self.results)

        for result in self.results:
            status_icon = "✅" if result.passed else "❌"
            print(f"\n{status_icon} {result.test_name}")
            print(f"   Expected: {result.expected_status}, Got: {result.actual_status}")
            if result.error:
                print(f"   Error: {result.error}")

        print("\n" + "=" * 80)
        print(f"SUMMARY: {passed_count}/{total_count} tests passed")
        print("=" * 80)

        # Critical checks
        critical_failures = [
            r
            for r in self.results
            if not r.passed and "CRITICAL" in r.test_name
        ]
        if critical_failures:
            print("\n🚨 CRITICAL FAILURES DETECTED:")
            for failure in critical_failures:
                print(f"   - {failure.test_name}: {failure.error or 'Status code mismatch'}")
            print("\n⚠️  THESE MUST BE FIXED BEFORE PRODUCTION DEPLOYMENT!")


async def main():
    """Run all tests."""
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
    else:
        api_url = API_BASE_URL

    tester = AuthTester(api_url)
    success = await tester.run_all_tests()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
