"""
Test Suite for Blogs 4 Blocks - New Features (Iteration 9)

Features tested:
1. Partners Feature - Send/Accept/Decline partner requests, search users, co-author posts
2. Like Toggle - Like/unlike posts (toggle behavior)
3. Email Analytics Tracking - Open pixel, click redirect, admin analytics dashboard

Test Credentials:
- Admin: admin-digest-test@example.com / test123456
- Alice: alice-partner@test.com / test123456
- Bob: bob-partner@test.com / test123456
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://blogs-4-blocks.preview.emergentagent.com').rstrip('/')

class TestSetup:
    """Setup and verify test prerequisites"""
    
    def test_health_check(self):
        """Verify backend is accessible"""
        response = requests.get(f"{BASE_URL}/api/categories")
        print(f"Health check: {response.status_code}")
        assert response.status_code == 200, f"Backend not accessible: {response.status_code}"


class TestAuthAndCredentials:
    """Verify test user credentials work"""
    
    @pytest.fixture
    def alice_auth(self):
        """Get Alice's auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Alice auth failed")
    
    @pytest.fixture
    def bob_auth(self):
        """Get Bob's auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bob-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Bob auth failed")
    
    @pytest.fixture
    def admin_auth(self):
        """Get Admin's auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin-digest-test@example.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin auth failed")
    
    def test_alice_login(self, alice_auth):
        """Alice can login successfully"""
        assert alice_auth is not None
        print("Alice login: PASS")
    
    def test_bob_login(self, bob_auth):
        """Bob can login successfully"""
        assert bob_auth is not None
        print("Bob login: PASS")
    
    def test_admin_login(self, admin_auth):
        """Admin can login successfully"""
        assert admin_auth is not None
        print("Admin login: PASS")


class TestUserSearch:
    """Test user search for partner requests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Auth failed")
    
    def test_search_requires_auth(self):
        """GET /api/users/search requires authentication"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        print(f"Search without auth: {response.status_code}")
        assert response.status_code == 401
    
    def test_search_users_by_name(self, auth_token):
        """GET /api/users/search?q=name returns matching users"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users/search?q=bob", headers=headers)
        print(f"Search for 'bob': {response.status_code}, found {len(response.json())} users")
        assert response.status_code == 200
        # Should find bob-partner user
        users = response.json()
        assert isinstance(users, list)
        # Print found users for debugging
        for u in users:
            print(f"  Found: {u.get('name')} - {u.get('city')}")
    
    def test_search_minimum_query_length(self, auth_token):
        """Search requires at least 2 characters"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users/search?q=a", headers=headers)
        print(f"Search with 1 char: {response.status_code}, result: {response.json()}")
        assert response.status_code == 200
        assert response.json() == []  # Should return empty list for short query
    
    def test_search_excludes_self(self, auth_token):
        """Search should not return the searching user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users/search?q=alice", headers=headers)
        print(f"Search for 'alice' (self): {response.status_code}")
        assert response.status_code == 200
        users = response.json()
        # Alice should not find herself
        for u in users:
            assert "alice-partner" not in u.get("email", "").lower()


class TestPartnersFeature:
    """Test partner request/accept/decline flow"""
    
    @pytest.fixture
    def alice_token_and_id(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user", {}).get("id")
        pytest.skip("Alice auth failed")
    
    @pytest.fixture
    def bob_token_and_id(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bob-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user", {}).get("id")
        pytest.skip("Bob auth failed")
    
    def test_get_partners_requires_auth(self):
        """GET /api/partners requires authentication"""
        response = requests.get(f"{BASE_URL}/api/partners")
        print(f"Get partners without auth: {response.status_code}")
        assert response.status_code == 401
    
    def test_get_partners(self, alice_token_and_id):
        """GET /api/partners returns accepted partners"""
        token, user_id = alice_token_and_id
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/partners", headers=headers)
        print(f"Get partners: {response.status_code}")
        assert response.status_code == 200
        partners = response.json()
        assert isinstance(partners, list)
        print(f"  Alice has {len(partners)} partners")
        for p in partners:
            print(f"    Partner: {p.get('name')} - {p.get('city')}")
            assert "partnership_id" in p
            assert "name" in p
    
    def test_get_partner_requests(self, alice_token_and_id):
        """GET /api/partners/requests returns pending incoming and outgoing requests"""
        token, user_id = alice_token_and_id
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/partners/requests", headers=headers)
        print(f"Get partner requests: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "incoming" in data
        assert "outgoing" in data
        print(f"  Incoming: {len(data['incoming'])}, Outgoing: {len(data['outgoing'])}")
    
    def test_send_partner_request_requires_auth(self):
        """POST /api/partners/request requires authentication"""
        response = requests.post(f"{BASE_URL}/api/partners/request", json={"target_id": "test"})
        print(f"Send request without auth: {response.status_code}")
        assert response.status_code == 401
    
    def test_cannot_partner_with_self(self, alice_token_and_id):
        """Cannot send partner request to yourself"""
        token, user_id = alice_token_and_id
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/partners/request", 
                                 json={"target_id": user_id}, headers=headers)
        print(f"Partner with self: {response.status_code}, {response.json()}")
        assert response.status_code == 400
        assert "yourself" in response.json().get("detail", "").lower()
    
    def test_cannot_send_duplicate_request(self, alice_token_and_id, bob_token_and_id):
        """Cannot send partner request if one already exists"""
        alice_token, alice_id = alice_token_and_id
        bob_token, bob_id = bob_token_and_id
        headers = {"Authorization": f"Bearer {alice_token}"}
        # Alice and Bob are already partners per the context
        response = requests.post(f"{BASE_URL}/api/partners/request",
                                 json={"target_id": bob_id}, headers=headers)
        print(f"Duplicate partner request: {response.status_code}")
        # Should fail because they're already partners or request exists
        assert response.status_code == 400


class TestLikeToggle:
    """Test the like/unlike toggle functionality"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Auth failed")
    
    @pytest.fixture
    def test_post_id(self):
        """Get a post ID to test with"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        if response.status_code == 200:
            posts = response.json().get("posts", [])
            if posts:
                return posts[0]["id"]
        pytest.skip("No posts available")
    
    def test_check_liked_status_without_auth(self, test_post_id):
        """GET /api/posts/{id}/liked returns liked=false without auth"""
        response = requests.get(f"{BASE_URL}/api/posts/{test_post_id}/liked")
        print(f"Check liked without auth: {response.status_code}")
        assert response.status_code == 200
        assert response.json().get("liked") == False
    
    def test_check_liked_status_with_auth(self, auth_token, test_post_id):
        """GET /api/posts/{id}/liked returns correct liked status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/posts/{test_post_id}/liked", headers=headers)
        print(f"Check liked with auth: {response.status_code}, liked: {response.json()}")
        assert response.status_code == 200
        assert "liked" in response.json()
    
    def test_like_toggle_behavior(self, auth_token, test_post_id):
        """POST /api/posts/{id}/like toggles like status"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get initial state
        initial = requests.get(f"{BASE_URL}/api/posts/{test_post_id}/liked", headers=headers)
        initial_liked = initial.json().get("liked")
        print(f"Initial liked status: {initial_liked}")
        
        # First like/unlike
        response1 = requests.post(f"{BASE_URL}/api/posts/{test_post_id}/like", headers=headers)
        assert response1.status_code == 200
        data1 = response1.json()
        print(f"After first toggle: liked={data1.get('liked')}, likes={data1.get('likes')}")
        
        # Verify toggle
        expected_liked_after_first = not initial_liked
        assert data1.get("liked") == expected_liked_after_first
        assert "likes" in data1
        
        # Toggle again
        response2 = requests.post(f"{BASE_URL}/api/posts/{test_post_id}/like", headers=headers)
        assert response2.status_code == 200
        data2 = response2.json()
        print(f"After second toggle: liked={data2.get('liked')}, likes={data2.get('likes')}")
        
        # Should be back to initial state
        assert data2.get("liked") == initial_liked
        
    def test_guest_like_no_toggle(self, test_post_id):
        """Guest likes don't toggle (always add)"""
        response = requests.post(f"{BASE_URL}/api/posts/{test_post_id}/like")
        print(f"Guest like: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("liked") == True  # Guests always get liked=True
        assert "likes" in data


class TestEmailAnalyticsTracking:
    """Test email open/click tracking and admin analytics"""
    
    def test_track_open_pixel(self):
        """GET /api/track/open returns 1x1 PNG and records event"""
        response = requests.get(f"{BASE_URL}/api/track/open?d=test-digest&e=test-hash")
        print(f"Track open: {response.status_code}, content-type: {response.headers.get('content-type')}")
        assert response.status_code == 200
        assert "image/png" in response.headers.get("content-type", "")
        # Verify it's a valid PNG (starts with PNG magic bytes)
        assert response.content[:4] == b'\x89PNG'
    
    def test_track_click_redirect(self):
        """GET /api/track/click redirects to target URL"""
        target_url = "https://example.com"
        response = requests.get(
            f"{BASE_URL}/api/track/click?d=test-digest&e=test-hash&url={target_url}",
            allow_redirects=False
        )
        print(f"Track click: {response.status_code}, location: {response.headers.get('location')}")
        assert response.status_code in [302, 307]  # Redirect status
        assert response.headers.get("location") == target_url
    
    def test_admin_analytics_requires_auth(self):
        """GET /api/admin/analytics requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        print(f"Analytics without auth: {response.status_code}")
        assert response.status_code == 401
    
    def test_admin_analytics_requires_admin_role(self):
        """GET /api/admin/analytics requires admin role"""
        # Login as regular user (Alice)
        login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if login.status_code != 200:
            pytest.skip("Auth failed")
        token = login.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=headers)
        print(f"Analytics as non-admin: {response.status_code}")
        assert response.status_code == 403
    
    def test_admin_analytics_returns_data(self):
        """GET /api/admin/analytics returns analytics data for admin"""
        # Login as admin
        login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin-digest-test@example.com",
            "password": "test123456"
        })
        if login.status_code != 200:
            pytest.skip("Admin auth failed")
        token = login.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=headers)
        print(f"Admin analytics: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Analytics data keys: {list(data.keys())}")
        
        # Verify expected fields
        assert "open_rate" in data
        assert "click_rate" in data
        assert "unique_opens" in data
        assert "unique_clicks" in data
        assert "total_digests_sent" in data
        assert "total_recipients" in data
        assert "digest_breakdown" in data
        assert "subscriber_growth_30d" in data
        assert "active_subscribers" in data
        
        print(f"  Open rate: {data['open_rate']}%")
        print(f"  Click rate: {data['click_rate']}%")
        print(f"  Unique opens: {data['unique_opens']}")
        print(f"  Unique clicks: {data['unique_clicks']}")
        print(f"  Digests sent: {data['total_digests_sent']}")


class TestCoAuthorPosts:
    """Test co-author functionality on posts"""
    
    @pytest.fixture
    def alice_auth(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alice-partner@test.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json()
        pytest.skip("Alice auth failed")
    
    def test_partners_available_for_coauthor(self, alice_auth):
        """Verify partners list is returned for co-author selection"""
        token = alice_auth.get("token")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/partners", headers=headers)
        print(f"Get partners for co-author: {response.status_code}")
        assert response.status_code == 200
        partners = response.json()
        print(f"  Available partners for co-authoring: {len(partners)}")
        for p in partners:
            print(f"    - {p.get('name')} (id: {p.get('id')[:8]}...)")


class TestAcceptDeclinePartnership:
    """Test accepting and declining partner requests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin-digest-test@example.com",
            "password": "test123456"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin auth failed")
    
    def test_accept_nonexistent_request(self, admin_token):
        """PUT /api/partners/{id}/accept returns 404 for invalid ID"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(f"{BASE_URL}/api/partners/nonexistent-id/accept", headers=headers)
        print(f"Accept nonexistent: {response.status_code}")
        assert response.status_code == 404
    
    def test_decline_nonexistent_request(self, admin_token):
        """DELETE /api/partners/{id} returns 404 for invalid ID"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BASE_URL}/api/partners/nonexistent-id", headers=headers)
        print(f"Decline nonexistent: {response.status_code}")
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
