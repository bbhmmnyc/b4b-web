"""
Regression Test Suite for Blogs 4 Blocks - Post-Refactoring (v10)
Tests all critical API endpoints after server.py was split into modular files.
"""
import os
import pytest
import requests
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"

# Test credentials from previous iterations
ADMIN_EMAIL = "admin-digest-test@example.com"
ADMIN_PASSWORD = "test123456"
ALICE_EMAIL = "alice-partner@test.com"
ALICE_PASSWORD = "test123456"
BOB_EMAIL = "bob-partner@test.com"
BOB_PASSWORD = "test123456"
ADMIN_SETUP_KEY = "b4b-admin-2024"


@pytest.fixture(scope="module")
def session():
    """Reusable requests session"""
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(session):
    """Login as admin user"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if resp.status_code != 200:
        pytest.skip(f"Admin login failed: {resp.text}")
    return resp.json().get("token")


@pytest.fixture(scope="module")
def alice_token(session):
    """Login as alice user"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": ALICE_EMAIL, "password": ALICE_PASSWORD})
    if resp.status_code != 200:
        pytest.skip(f"Alice login failed: {resp.text}")
    return resp.json().get("token")


@pytest.fixture(scope="module")
def bob_token(session):
    """Login as bob user"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": BOB_EMAIL, "password": BOB_PASSWORD})
    if resp.status_code != 200:
        pytest.skip(f"Bob login failed: {resp.text}")
    return resp.json().get("token")


class TestAuthEndpoints:
    """Test /api/auth/* routes after refactoring"""
    
    def test_auth_login_success(self, session):
        """POST /api/auth/login - valid credentials"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print("✓ POST /api/auth/login - valid login works")
    
    def test_auth_login_invalid(self, session):
        """POST /api/auth/login - invalid credentials"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": "invalid@test.com", "password": "wrongpass"})
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ POST /api/auth/login - invalid credentials returns 401")
    
    def test_auth_register_duplicate(self, session):
        """POST /api/auth/register - duplicate email"""
        resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate",
            "email": ADMIN_EMAIL,  # existing email
            "password": "test123456",
            "city": "Test",
            "country": "Test"
        })
        assert resp.status_code == 400, f"Expected 400 for duplicate email, got {resp.status_code}"
        print("✓ POST /api/auth/register - duplicate email returns 400")
    
    def test_auth_me(self, session, admin_token):
        """GET /api/auth/me - authenticated user info"""
        resp = session.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200, f"Auth me failed: {resp.text}"
        data = resp.json()
        assert data["email"] == ADMIN_EMAIL
        print("✓ GET /api/auth/me - returns authenticated user")
    
    def test_auth_me_no_token(self, session):
        """GET /api/auth/me - without token"""
        resp = session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ GET /api/auth/me - no token returns 401")


class TestCategoriesEndpoints:
    """Test /api/categories/* routes"""
    
    def test_get_categories(self, session):
        """GET /api/categories - list all approved categories"""
        resp = session.get(f"{BASE_URL}/api/categories")
        assert resp.status_code == 200, f"Get categories failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify category structure
        cat = data[0]
        assert "slug" in cat
        assert "name" in cat
        assert "status" in cat
        print(f"✓ GET /api/categories - returns {len(data)} categories")
    
    def test_get_category_by_slug(self, session):
        """GET /api/categories/{slug} - specific category with posts"""
        resp = session.get(f"{BASE_URL}/api/categories/social-media")
        assert resp.status_code == 200, f"Get category failed: {resp.text}"
        data = resp.json()
        assert data["slug"] == "social-media"
        assert "posts" in data
        assert "total" in data
        print(f"✓ GET /api/categories/social-media - returns category with {data['total']} posts")
    
    def test_get_category_not_found(self, session):
        """GET /api/categories/{slug} - non-existent category"""
        resp = session.get(f"{BASE_URL}/api/categories/nonexistent-slug")
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✓ GET /api/categories/{nonexistent} - returns 404")


class TestPostsEndpoints:
    """Test /api/posts/* routes"""
    
    def test_get_posts(self, session):
        """GET /api/posts - paginated posts list"""
        resp = session.get(f"{BASE_URL}/api/posts?limit=5&page=1")
        assert resp.status_code == 200, f"Get posts failed: {resp.text}"
        data = resp.json()
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"✓ GET /api/posts - returns {len(data['posts'])} posts (total: {data['total']})")
    
    def test_get_popular_posts(self, session):
        """GET /api/posts/popular/list - top posts by views/likes"""
        resp = session.get(f"{BASE_URL}/api/posts/popular/list")
        assert resp.status_code == 200, f"Get popular posts failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/posts/popular/list - returns {len(data)} popular posts")
    
    def test_get_post_by_id(self, session):
        """GET /api/posts/{id} - single post with view increment"""
        # First get a post ID
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        resp = session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert resp.status_code == 200, f"Get post failed: {resp.text}"
        data = resp.json()
        assert data["id"] == post_id
        assert "title" in data
        assert "content" in data
        print(f"✓ GET /api/posts/{post_id[:8]}... - returns post details")
    
    def test_get_post_not_found(self, session):
        """GET /api/posts/{id} - non-existent post"""
        resp = session.get(f"{BASE_URL}/api/posts/nonexistent-id")
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✓ GET /api/posts/{nonexistent} - returns 404")
    
    def test_get_related_posts(self, session):
        """GET /api/posts/{id}/related - related posts by category"""
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        resp = session.get(f"{BASE_URL}/api/posts/{post_id}/related")
        assert resp.status_code == 200, f"Get related posts failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/posts/{post_id[:8]}../related - returns {len(data)} related posts")
    
    def test_create_post_as_user(self, session, admin_token):
        """POST /api/posts - create post as authenticated user"""
        resp = session.post(f"{BASE_URL}/api/posts", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "title": f"TEST_Regression_Post_{int(time.time())}",
                "content": "Test content for regression testing",
                "excerpt": "Test excerpt",
                "category_slug": "social-media",
                "tags": ["test", "regression"]
            }
        )
        assert resp.status_code == 200, f"Create post failed: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert data["title"].startswith("TEST_Regression_Post_")
        print(f"✓ POST /api/posts - created post {data['id'][:8]}...")
        return data["id"]
    
    def test_like_post_toggle(self, session, alice_token):
        """POST /api/posts/{id}/like - toggle like"""
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        # Like the post
        resp = session.post(f"{BASE_URL}/api/posts/{post_id}/like",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 200, f"Like post failed: {resp.text}"
        data = resp.json()
        assert "likes" in data
        assert "liked" in data
        print(f"✓ POST /api/posts/{post_id[:8]}../like - toggle works (liked: {data['liked']})")
    
    def test_check_liked_status(self, session, alice_token):
        """GET /api/posts/{id}/liked - check if user liked post"""
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        resp = session.get(f"{BASE_URL}/api/posts/{post_id}/liked",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 200, f"Check liked failed: {resp.text}"
        data = resp.json()
        assert "liked" in data
        print(f"✓ GET /api/posts/{post_id[:8]}../liked - liked status: {data['liked']}")


class TestCommentsEndpoints:
    """Test /api/posts/{id}/comments routes"""
    
    def test_get_comments(self, session):
        """GET /api/posts/{id}/comments - list post comments"""
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        resp = session.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert resp.status_code == 200, f"Get comments failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/posts/{post_id[:8]}../comments - returns {len(data)} comments")
    
    def test_create_comment(self, session, alice_token):
        """POST /api/posts/{id}/comments - create comment"""
        list_resp = session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = list_resp.json()["posts"]
        if not posts:
            pytest.skip("No posts available")
        post_id = posts[0]["id"]
        
        resp = session.post(f"{BASE_URL}/api/posts/{post_id}/comments",
            headers={"Authorization": f"Bearer {alice_token}"},
            json={
                "content": f"Test comment {int(time.time())}",
                "author_name": "Test User"
            }
        )
        assert resp.status_code == 200, f"Create comment failed: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert "content" in data
        print(f"✓ POST /api/posts/{post_id[:8]}../comments - created comment")


class TestPartnersEndpoints:
    """Test /api/partners/* and /api/users/search routes"""
    
    def test_search_users_requires_auth(self, session):
        """GET /api/users/search - requires authentication"""
        resp = session.get(f"{BASE_URL}/api/users/search?q=test")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ GET /api/users/search - requires auth (401)")
    
    def test_search_users(self, session, alice_token):
        """GET /api/users/search - search users by name"""
        resp = session.get(f"{BASE_URL}/api/users/search?q=bob",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 200, f"Search users failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/users/search?q=bob - returns {len(data)} users")
    
    def test_get_partners(self, session, alice_token):
        """GET /api/partners - list accepted partners"""
        resp = session.get(f"{BASE_URL}/api/partners",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 200, f"Get partners failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/partners - returns {len(data)} partners")
    
    def test_get_partner_requests(self, session, alice_token):
        """GET /api/partners/requests - pending requests"""
        resp = session.get(f"{BASE_URL}/api/partners/requests",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 200, f"Get partner requests failed: {resp.text}"
        data = resp.json()
        assert "incoming" in data
        assert "outgoing" in data
        print(f"✓ GET /api/partners/requests - incoming: {len(data['incoming'])}, outgoing: {len(data['outgoing'])}")


class TestNewsletterEndpoints:
    """Test /api/newsletter/* routes"""
    
    def test_newsletter_subscribe(self, session):
        """POST /api/newsletter/subscribe - subscribe to newsletter"""
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        resp = session.post(f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": email}
        )
        assert resp.status_code == 200, f"Subscribe failed: {resp.text}"
        data = resp.json()
        assert "subscribed" in data
        print(f"✓ POST /api/newsletter/subscribe - subscribed: {data.get('subscribed')}")
    
    def test_newsletter_unsubscribe(self, session):
        """POST /api/newsletter/unsubscribe - unsubscribe from newsletter"""
        resp = session.post(f"{BASE_URL}/api/newsletter/unsubscribe",
            json={"email": "nonexistent@example.com"}
        )
        assert resp.status_code == 200, f"Unsubscribe failed: {resp.text}"
        print("✓ POST /api/newsletter/unsubscribe - handles nonexistent gracefully")


class TestAdminEndpoints:
    """Test /api/admin/* routes"""
    
    def test_admin_stats(self, session, admin_token):
        """GET /api/admin/stats - admin dashboard stats"""
        resp = session.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Admin stats failed: {resp.text}"
        data = resp.json()
        assert "total_posts" in data
        assert "total_users" in data
        assert "total_comments" in data
        print(f"✓ GET /api/admin/stats - posts: {data['total_posts']}, users: {data['total_users']}")
    
    def test_admin_stats_requires_admin(self, session, alice_token):
        """GET /api/admin/stats - requires admin role"""
        resp = session.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {alice_token}"}
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print("✓ GET /api/admin/stats - non-admin returns 403")
    
    def test_admin_digest_status(self, session, admin_token):
        """GET /api/admin/digest-status - digest status info"""
        resp = session.get(f"{BASE_URL}/api/admin/digest-status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Digest status failed: {resp.text}"
        data = resp.json()
        assert "active_subscribers" in data
        assert "total_audience" in data
        print(f"✓ GET /api/admin/digest-status - subscribers: {data['active_subscribers']}")
    
    def test_admin_analytics(self, session, admin_token):
        """GET /api/admin/analytics - email analytics"""
        resp = session.get(f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Admin analytics failed: {resp.text}"
        data = resp.json()
        assert "total_opens" in data
        assert "total_clicks" in data
        assert "open_rate" in data
        print(f"✓ GET /api/admin/analytics - open_rate: {data['open_rate']}%")


class TestTrackingEndpoints:
    """Test /api/track/* routes"""
    
    def test_track_open_pixel(self, session):
        """GET /api/track/open - tracking pixel"""
        resp = session.get(f"{BASE_URL}/api/track/open?d=test&e=testhash")
        assert resp.status_code == 200, f"Track open failed: {resp.status_code}"
        assert resp.headers.get("content-type") == "image/png"
        print("✓ GET /api/track/open - returns PNG pixel")
    
    def test_track_click_redirect(self, session):
        """GET /api/track/click - click redirect"""
        resp = session.get(f"{BASE_URL}/api/track/click?d=test&e=testhash&url=https://example.com", 
            allow_redirects=False
        )
        assert resp.status_code in [302, 307], f"Expected redirect, got {resp.status_code}"
        print("✓ GET /api/track/click - redirects correctly")


class TestMiscEndpoints:
    """Test miscellaneous routes"""
    
    def test_stats_endpoint(self, session):
        """GET /api/stats - public stats"""
        resp = session.get(f"{BASE_URL}/api/stats")
        assert resp.status_code == 200, f"Stats failed: {resp.text}"
        data = resp.json()
        assert "total_posts" in data
        assert "total_users" in data
        assert "total_countries" in data
        print(f"✓ GET /api/stats - posts: {data['total_posts']}, countries: {data['total_countries']}")


class TestProfileEndpoints:
    """Test /api/profile/* routes"""
    
    def test_profile_posts(self, session, admin_token):
        """GET /api/profile/posts - user's posts"""
        resp = session.get(f"{BASE_URL}/api/profile/posts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Profile posts failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/profile/posts - returns {len(data)} posts")
    
    def test_profile_interactions(self, session, admin_token):
        """GET /api/profile/interactions - user's interacted posts"""
        resp = session.get(f"{BASE_URL}/api/profile/interactions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Profile interactions failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/profile/interactions - returns {len(data)} interactions")
    
    def test_profile_colors(self, session, admin_token):
        """GET /api/profile/colors - profile color preferences"""
        resp = session.get(f"{BASE_URL}/api/profile/colors",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200, f"Profile colors failed: {resp.text}"
        data = resp.json()
        assert "my_posts_color" in data
        assert "interacted_color" in data
        print(f"✓ GET /api/profile/colors - colors: {data['my_posts_color']}, {data['interacted_color']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
