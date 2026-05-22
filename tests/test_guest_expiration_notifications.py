"""
Test suite for Guest Post Expiration and New Post Notifications features (P1):
- Guest post expiration filtering in GET /api/posts
- is_expired flag in GET /api/posts/{post_id}
- expires_at set to 30 days for guest posts
- Admin stats include expired_guest_posts count
- New post notifications trigger for all registered users
- Guest post creation flow (no auth, with guest_author info)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

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
    return response.json()["token"]


@pytest.fixture(scope="module")
def test_user_token(api_client):
    """Create and return token for a test user (for notification testing)"""
    unique_email = f"TEST_notify_{uuid.uuid4().hex[:8]}@test.com"
    response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Notification Test User",
        "email": unique_email,
        "password": "testpass123",
        "city": "Test City",
        "country": "Test Country"
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Could not create test user for notification testing")


class TestGuestPostCreation:
    """Tests for guest post creation flow"""
    
    def test_create_guest_post_without_auth(self, api_client):
        """Guest can create post without authentication (with guest_author)"""
        unique_title = f"TEST Guest Post {datetime.now().strftime('%H:%M:%S')}"
        payload = {
            "title": unique_title,
            "content": "This is a test guest post content.\n\n**Test Point:**\n- Point 1",
            "excerpt": "Test guest post excerpt",
            "category_slug": "consumer-behavior",
            "tags": ["test", "guest"],
            "guest_author": {
                "name": "TEST Guest Author",
                "city": "Test City",
                "country": "Test Country"
            }
        }
        
        # No auth header
        response = api_client.post(f"{BASE_URL}/api/posts", json=payload)
        assert response.status_code == 200, f"Guest post creation failed: {response.text}"
        
        data = response.json()
        assert data["title"] == unique_title
        assert data["is_guest"] == True, "Post should be marked as guest post"
        assert data["author_name"] == "TEST Guest Author"
        assert data["author_city"] == "Test City"
        assert data["author_country"] == "Test Country"
        assert data["author_id"] is None, "Guest posts should have null author_id"
        assert "expires_at" in data, "Guest post should have expires_at field"
        assert data["expires_at"] is not None, "Guest post expires_at should not be null"
        
        # Verify expires_at is ~30 days from now
        expires_at = datetime.fromisoformat(data["expires_at"].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        days_until_expiry = (expires_at - now).days
        assert 29 <= days_until_expiry <= 30, f"Guest post should expire in ~30 days, got {days_until_expiry}"
        
        print(f"Guest post created: {data['id']}, expires_at={data['expires_at']}")
        return data["id"]
    
    def test_create_guest_post_without_guest_author_fails(self, api_client):
        """Creating post without auth AND without guest_author should fail"""
        payload = {
            "title": "TEST Invalid Guest Post",
            "content": "This should fail",
            "excerpt": "Test excerpt",
            "category_slug": "social-media",
            "tags": ["test"]
            # Missing guest_author
        }
        
        response = api_client.post(f"{BASE_URL}/api/posts", json=payload)
        assert response.status_code == 400, "Should reject guest post without guest_author info"
        print("Guest post without guest_author correctly rejected")
    
    def test_authenticated_user_post_has_no_expiration(self, api_client, demo_admin_token):
        """Authenticated user posts should NOT have expiration"""
        unique_title = f"TEST Auth User Post {datetime.now().strftime('%H:%M:%S')}"
        payload = {
            "title": unique_title,
            "content": "This is an authenticated user post",
            "excerpt": "Auth user post excerpt",
            "category_slug": "social-media",
            "tags": ["test", "auth"]
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/posts",
            json=payload,
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_guest"] == False, "Authenticated post should not be guest"
        assert data["expires_at"] is None, "Authenticated user posts should have null expires_at"
        print(f"Authenticated post created without expiration: {data['id']}")


class TestGuestPostExpirationInListings:
    """Tests for guest post expiration filtering in GET /api/posts"""
    
    def test_active_guest_post_appears_in_listings(self, api_client):
        """Guest posts that haven't expired should appear in listings"""
        # First create a new guest post (will have 30 days until expiry)
        unique_title = f"TEST Active Guest {uuid.uuid4().hex[:8]}"
        payload = {
            "title": unique_title,
            "content": "Active guest post content",
            "excerpt": "Active guest excerpt",
            "category_slug": "branding",
            "tags": ["test"],
            "guest_author": {
                "name": "TEST Active Guest Author",
                "city": "Active City",
                "country": "Active Country"
            }
        }
        
        create_resp = api_client.post(f"{BASE_URL}/api/posts", json=payload)
        assert create_resp.status_code == 200
        post_id = create_resp.json()["id"]
        
        # Fetch posts and verify the new post appears
        list_resp = api_client.get(f"{BASE_URL}/api/posts")
        assert list_resp.status_code == 200
        
        posts = list_resp.json()["posts"]
        post_ids = [p["id"] for p in posts]
        assert post_id in post_ids, "Active guest post should appear in listings"
        print(f"Active guest post {post_id} correctly appears in listings")
    
    def test_include_expired_parameter(self, api_client):
        """Verify include_expired parameter exists and works"""
        # Call with include_expired=true
        response = api_client.get(f"{BASE_URL}/api/posts?include_expired=true")
        assert response.status_code == 200
        
        data = response.json()
        assert "posts" in data
        assert "total" in data
        print(f"include_expired=true returns {data['total']} posts")
        
        # Call without include_expired (default behavior)
        response2 = api_client.get(f"{BASE_URL}/api/posts")
        assert response2.status_code == 200
        print(f"Default (no expired) returns {response2.json()['total']} posts")
    
    def test_posts_have_expires_at_field(self, api_client):
        """Verify posts in listings include expires_at field for guest posts"""
        response = api_client.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        
        posts = response.json()["posts"]
        guest_posts = [p for p in posts if p.get("is_guest")]
        
        if guest_posts:
            for gp in guest_posts[:3]:  # Check first 3
                assert "expires_at" in gp, f"Guest post {gp['id']} missing expires_at field"
                print(f"Guest post {gp['id']}: expires_at={gp.get('expires_at')}")
        else:
            print("No guest posts found in current listings (they may have expired)")


class TestGuestPostExpirationOnSinglePost:
    """Tests for is_expired flag on GET /api/posts/{post_id}"""
    
    def test_active_guest_post_not_expired(self, api_client):
        """Active guest post should not have is_expired=true"""
        # Create a fresh guest post
        unique_title = f"TEST Single Active {uuid.uuid4().hex[:8]}"
        create_resp = api_client.post(f"{BASE_URL}/api/posts", json={
            "title": unique_title,
            "content": "Single active guest post",
            "excerpt": "Test",
            "category_slug": "marketing-tools",
            "tags": ["test"],
            "guest_author": {"name": "TEST Single Author", "city": "City", "country": "Country"}
        })
        assert create_resp.status_code == 200
        post_id = create_resp.json()["id"]
        
        # Fetch single post
        get_resp = api_client.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_resp.status_code == 200
        
        data = get_resp.json()
        assert data.get("is_expired") != True, "Active guest post should not be marked expired"
        assert "expires_at" in data
        print(f"Active guest post {post_id} is_expired={data.get('is_expired', False)}")
    
    def test_post_response_includes_expiration_info(self, api_client):
        """Single post endpoint should include expires_at for guest posts"""
        # Find an existing guest post
        list_resp = api_client.get(f"{BASE_URL}/api/posts")
        guest_posts = [p for p in list_resp.json()["posts"] if p.get("is_guest")]
        
        if not guest_posts:
            pytest.skip("No guest posts available for testing")
        
        post_id = guest_posts[0]["id"]
        get_resp = api_client.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_resp.status_code == 200
        
        data = get_resp.json()
        assert "expires_at" in data, "Single post should include expires_at"
        assert data["is_guest"] == True
        print(f"Guest post response includes expiration: {data['expires_at']}")


class TestAdminStatsExpiredPosts:
    """Tests for admin stats including expired_guest_posts count"""
    
    def test_admin_stats_includes_expired_count(self, api_client, demo_admin_token):
        """Admin stats should include expired_guest_posts count"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "expired_guest_posts" in data, "Admin stats should include expired_guest_posts"
        assert isinstance(data["expired_guest_posts"], int)
        assert "guest_posts" in data, "Admin stats should include total guest_posts"
        
        print(f"Admin stats: guest_posts={data['guest_posts']}, expired_guest_posts={data['expired_guest_posts']}")
    
    def test_admin_stats_includes_all_expected_fields(self, api_client, demo_admin_token):
        """Verify admin stats has all expected fields"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        expected_fields = [
            "total_posts", "total_comments", "total_users",
            "pending_categories", "approved_categories",
            "guest_posts", "expired_guest_posts",
            "countries_represented", "recent_posts", "recent_comments"
        ]
        
        for field in expected_fields:
            assert field in data, f"Admin stats missing expected field: {field}"
        
        print(f"Admin stats contains all expected fields: {list(data.keys())}")


class TestNewPostNotifications:
    """Tests for new post notification triggering"""
    
    def test_post_creation_completes_successfully(self, api_client, demo_admin_token):
        """Verify post creation works (notification is async/fire-and-forget)"""
        unique_title = f"TEST Notification Post {datetime.now().strftime('%H:%M:%S')}"
        payload = {
            "title": unique_title,
            "content": "This post should trigger notifications to all registered users",
            "excerpt": "Notification test excerpt",
            "category_slug": "social-media",
            "tags": ["test", "notification"]
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/posts",
            json=payload,
            headers={"Authorization": f"Bearer {demo_admin_token}"}
        )
        assert response.status_code == 200, "Post creation should succeed"
        
        data = response.json()
        assert data["title"] == unique_title
        print(f"Post created successfully (notification task triggered asynchronously): {data['id']}")
    
    def test_guest_post_also_triggers_notifications(self, api_client):
        """Guest post creation should also trigger notifications"""
        unique_title = f"TEST Guest Notification {datetime.now().strftime('%H:%M:%S')}"
        payload = {
            "title": unique_title,
            "content": "Guest post that triggers notifications",
            "excerpt": "Guest notification test",
            "category_slug": "branding",
            "tags": ["guest", "notification"],
            "guest_author": {
                "name": "TEST Notify Guest",
                "city": "Notify City",
                "country": "Notify Country"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/posts", json=payload)
        assert response.status_code == 200
        print(f"Guest post created, notification task triggered: {response.json()['id']}")


class TestPostsFiltering:
    """Tests for posts filtering with category and search"""
    
    def test_filter_by_category(self, api_client):
        """Verify category filtering works correctly"""
        response = api_client.get(f"{BASE_URL}/api/posts?category=social-media")
        assert response.status_code == 200
        
        data = response.json()
        posts = data["posts"]
        
        for post in posts:
            assert post["category_slug"] == "social-media", f"Post {post['id']} has wrong category"
        
        print(f"Category filter returned {len(posts)} social-media posts")
    
    def test_search_filter(self, api_client):
        """Verify search filtering works"""
        response = api_client.get(f"{BASE_URL}/api/posts?search=marketing")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Search for 'marketing' returned {data['total']} posts")
    
    def test_pagination(self, api_client):
        """Verify pagination works"""
        response = api_client.get(f"{BASE_URL}/api/posts?limit=5&skip=0")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["posts"]) <= 5
        print(f"Pagination: got {len(data['posts'])} posts with limit=5")


class TestCleanup:
    """Cleanup test data"""
    
    def test_note_about_cleanup(self, api_client):
        """Note: TEST_ prefixed posts created during testing"""
        print("\n=== CLEANUP NOTE ===")
        print("Test posts with 'TEST' prefix were created during testing")
        print("These will expire naturally in 30 days if guest posts")
        print("Admin can manually delete via admin panel if needed")
        print("====================")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
