"""Quick API test script."""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    """Test health endpoint."""
    resp = requests.get("http://localhost:8000/health")
    print(f"Health: {resp.status_code} - {resp.json()}")
    return resp.status_code == 200

def test_register():
    """Test registration."""
    import random
    email = f"test{random.randint(1000,9999)}@example.com"
    payload = {
        "email": email,
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"Register: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.status_code == 201

def test_login():
    """Test login."""
    payload = {
        "email": "test@example.com",
        "password": "TestPass123!"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"Login: {resp.status_code}")
    data = resp.json()
    print(json.dumps(data, indent=2))
    if resp.status_code == 200:
        return data.get("access_token")
    return None

def test_me(token):
    """Test /me endpoint."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Me: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.status_code == 200

def test_waste_categories(token):
    """Test waste categories."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/waste/categories/all", headers=headers)
    print(f"Categories: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.status_code == 200

def test_rewards_summary(token):
    """Test rewards summary."""
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/rewards/summary", headers=headers)
    print(f"Rewards: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("Smart Waste AI - E2E API Tests")
    print("=" * 50)
    
    results = []
    
    # Test health
    print("\n1. Testing health endpoint...")
    results.append(("Health", test_health()))
    
    # Test registration
    print("\n2. Testing registration...")
    results.append(("Register", test_register()))
    
    # Test login
    print("\n3. Testing login...")
    token = test_login()
    results.append(("Login", token is not None))
    
    if token:
        print(f"\n✓ Token acquired: {token[:30]}...")
        
        # Test authenticated endpoints
        print("\n4. Testing /me endpoint...")
        results.append(("Me", test_me(token)))
        
        print("\n5. Testing waste categories...")
        results.append(("Categories", test_waste_categories(token)))
        
        print("\n6. Testing rewards summary...")
        results.append(("Rewards", test_rewards_summary(token)))
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST RESULTS SUMMARY")
    print("=" * 50)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {name}: {status}")
    
    passed_count = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed_count}/{len(results)} tests passed")
