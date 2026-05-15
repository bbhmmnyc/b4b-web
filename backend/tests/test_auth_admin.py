"""
Test suite for Authentication, Registration, and Admin features:
- User registration flow
- User login flow  
- Admin setup (self-promote via secret key)
- Admin toggle user admin status
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_SETUP_KEY = "b4b-admin-2024"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def demo_admin_token(api_client):
    """Get token for demo admin user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@b4b.com",
        "password": "password123"
    })
    assert response.status_code == 200, f"Demo admin login failed: {response.text}"
    data = response.json()
    assert "token" in data
    assert data["user"]["is_admin"] == True
    return data["token"]


class TestHealthAndBasic:
    """Basic health checks"""
    
    def test_stats_endpoint(self, api_client):
        """Verify API is responding"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_posts" in data
        assert "total_comments" in data
        print(f"Stats: {data}")


class TestUserLogin:
    """User login flow tests"""
    
    def test_login_with_demo_admin(self, api_client):
        """Login with demo admin account"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@b4b.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "demo@b4b.com"
        assert data["user"]["is_admin"] == True
        print(f"Login successful: {data['user']['name']} (admin={data['user']['is_admin']})")
    
    def test_login_invalid_credentials(self, api_client):
        """Login with wrong password should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@b4b.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Invalid login correctly rejected: {data['detail']}")
    
    def test_login_nonexistent_user(self, api_client):
        """Login with non-existent user should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401


class TestUserRegistration:
    """User registration flow tests"""
    
    def test_register_new_user(self, api_client):
        """Register a new user and verify they are logged in"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test User",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        }
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token returned after registration"
        assert "user" in data, "No user data returned"
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
        assert data["user"]["city"] == "Test City"
        assert data["user"]["is_admin"] == False, "New users should NOT be admin by default"
        print(f"Registered user: {data['user']['email']} (is_admin={data['user']['is_admin']})")
        
        # Verify can fetch user with token
        me_response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {data['token']}"}
        )
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == unique_email
        print(f"Verified /auth/me returns correct user")
    
    def test_register_duplicate_email(self, api_client):
        """Registering with existing email should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate User",
            "email": "demo@b4b.com",  # Already exists
            "password": "testpass123",
            "city": "Some City",
            "country": "Some Country"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower()
        print(f"Duplicate email correctly rejected: {data['detail']}")


class TestAdminSetup:
    """Admin setup (self-promote) flow tests"""
    
    def test_self_promote_without_auth(self, api_client):
        """Self-promote without authentication should fail"""
        response = api_client.post(f"{BASE_URL}/api/admin/self-promote", json={
            "secret_key": ADMIN_SETUP_KEY
        })
        assert response.status_code == 401
        print("Self-promote without auth correctly rejected")
    
    def test_self_promote_wrong_key(self, api_client):
        """Self-promote with wrong key should fail"""
        # First register a new user
        unique_email = f"TEST_admin_wrong_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Admin Wrong Key",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        assert reg_resp.status_code == 200
        token = reg_resp.json()["token"]
        
        # Try self-promote with wrong key
        response = api_client.post(
            f"{BASE_URL}/api/admin/self-promote",
            json={"secret_key": "wrong-key"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"Wrong setup key correctly rejected: {data['detail']}")
    
    def test_self_promote_correct_key(self, api_client):
        """Self-promote with correct key should work"""
        # Register a new user
        unique_email = f"TEST_admin_correct_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Admin Correct Key",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        assert reg_resp.status_code == 200
        user_data = reg_resp.json()
        token = user_data["token"]
        assert user_data["user"]["is_admin"] == False, "Should not be admin initially"
        
        # Self-promote with correct key
        response = api_client.post(
            f"{BASE_URL}/api/admin/self-promote",
            json={"secret_key": ADMIN_SETUP_KEY},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_admin"] == True
        print(f"Self-promote successful: {data['message']}")
        
        # Verify user is now admin via /auth/me
        me_resp = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["is_admin"] == True
        print("Verified user is now admin via /auth/me")


class TestAdminToggleUsers:
    """Admin toggle other users' admin status"""
    
    def test_toggle_admin_without_auth(self, api_client):
        """Toggle admin without authentication should fail"""
        response = api_client.put(f"{BASE_URL}/api/admin/users/some-id/toggle-admin")
        assert response.status_code == 401
    
    def test_toggle_admin_as_non_admin(self, api_client):
        """Non-admin trying to toggle should fail"""
        # Register a non-admin user
        unique_email = f"TEST_nonadmin_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin User",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        assert reg_resp.status_code == 200
        token = reg_resp.json()["token"]
        
        response = api_client.put(
            f"{BASE_URL}/api/admin/users/some-user-id/toggle-admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        print("Non-admin toggle correctly rejected")
    
    def test_toggle_admin_for_other_user(self, api_client, demo_admin_token):
        """Admin can toggle another user's admin status"""
        # First register a new user to toggle
        unique_email = f"TEST_toggle_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Toggle Target User",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        assert reg_resp.status_code == 200
        target_user_id = reg_resp.json()["user"]["id"]
        target_token = reg_resp.json()["token"]
        
        # Verify user is not admin initially
        me_resp = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {target_token}"}
        )
        assert me_resp.json()["is_admin"] == False
        
        # Admin toggles user to admin
        toggle_resp = api_client.put(
            f"{BASE_URL}/api/admin/users/{target_user_id}/toggle-admin",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert toggle_resp.status_code == 200
        data = toggle_resp.json()
        assert data["is_admin"] == True
        assert data["user_id"] == target_user_id
        print(f"Toggle to admin successful: {data['message']}")
        
        # Verify user is now admin
        me_resp2 = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {target_token}"}
        )
        assert me_resp2.json()["is_admin"] == True
        
        # Toggle back to non-admin
        toggle_resp2 = api_client.put(
            f"{BASE_URL}/api/admin/users/{target_user_id}/toggle-admin",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert toggle_resp2.status_code == 200
        assert toggle_resp2.json()["is_admin"] == False
        print("Toggle back to non-admin successful")
    
    def test_admin_cannot_toggle_self(self, api_client, demo_admin_token):
        """Admin cannot toggle their own admin status"""
        # Get demo admin user id
        me_resp = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        admin_user_id = me_resp.json()["id"]
        
        # Try to toggle self
        response = api_client.put(
            f"{BASE_URL}/api/admin/users/{admin_user_id}/toggle-admin",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "cannot change your own" in data.get("detail", "").lower()
        print(f"Self-toggle correctly prevented: {data['detail']}")


class TestAdminPanel:
    """Admin panel endpoint tests"""
    
    def test_admin_stats(self, api_client, demo_admin_token):
        """Admin can access stats endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_posts" in data
        assert "total_users" in data
        assert "pending_categories" in data
        print(f"Admin stats: posts={data['total_posts']}, users={data['total_users']}")
    
    def test_admin_users_list(self, api_client, demo_admin_token):
        """Admin can list all users"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify user structure
        first_user = data[0]
        assert "id" in first_user
        assert "name" in first_user
        assert "email" in first_user
        assert "password" not in first_user  # Password should not be returned
        print(f"Admin users list: {len(data)} users")
    
    def test_admin_stats_non_admin(self, api_client):
        """Non-admin cannot access admin stats"""
        # Register a non-admin user
        unique_email = f"TEST_noadmin_stats_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin Stats",
            "email": unique_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        token = reg_resp.json()["token"]
        
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        print("Non-admin stats access correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
