import requests
import json

url = "http://localhost:8000/api/v1/auth/signup"
data = {
    "email": "testuser2@example.com",
    "password": "simplepass123",
    "full_name": "Test User 2",
    "role": "user"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        print("\n✅ Signup successful!")
        user = response.json()
        print(f"User ID: {user.get('id')}")
        print(f"Email: {user.get('email')}")
    else:
        print(f"\n❌ Signup failed: {response.text}")
except Exception as e:
    print(f"\n❌ Error: {e}")
