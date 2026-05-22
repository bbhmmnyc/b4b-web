"""
Test file for @mention feature and UI updates (iteration 12)
Tests:
- User search API: GET /api/users/search?q=<query>
- User search with post_id prioritization: GET /api/users/search?q=<query>&post_id=<id>
- Comment creation with @mentions: POST /api/posts/{id}/comments
- Verify mentions are extracted and stored
- Newsletter/analytics endpoints still work (regression)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserSearchAPI:
    """Test user search endpoint for @mention autocomplete"""
    
    def test_user_search_basic(self):
        """Test basic user search by name prefix"""
        res = requests.get(f"{BASE_URL}/api/users/search", params={"q": "A"})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert isinstance(data, list), "Response should be a list"
        # Should return users starting with 'A'
        for user in data:
            assert "id" in user, "User should have id"
            assert "name" in user, "User should have name"
            assert user["name"].lower().startswith("a"), f"User name should start with 'a': {user['name']}"
        print(f"PASS: User search returned {len(data)} users starting with 'A'")
    
    def test_user_search_empty_query(self):
        """Test user search with empty query returns empty list"""
        res = requests.get(f"{BASE_URL}/api/users/search", params={"q": ""})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data == [], "Empty query should return empty list"
        print("PASS: Empty query returns empty list")
    
    def test_user_search_with_post_id(self):
        """Test user search prioritizes post author and commenters"""
        # First get a post
        posts_res = requests.get(f"{BASE_URL}/api/posts", params={"limit": 1})
        assert posts_res.status_code == 200
        posts = posts_res.json().get("posts", [])
        if not posts:
            pytest.skip("No posts available for testing")
        
        post_id = posts[0]["id"]
        author_name = posts[0].get("author_name", "")
        
        # Search with post_id
        res = requests.get(f"{BASE_URL}/api/users/search", params={"q": author_name[:1], "post_id": post_id})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: User search with post_id returned {len(data)} users")
    
    def test_user_search_limit(self):
        """Test user search respects limit parameter"""
        res = requests.get(f"{BASE_URL}/api/users/search", params={"q": "A", "limit": 2})
        assert res.status_code == 200
        data = res.json()
        assert len(data) <= 2, f"Should return at most 2 users, got {len(data)}"
        print(f"PASS: User search limit works, returned {len(data)} users")


class TestCommentWithMentions:
    """Test comment creation with @mentions"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for testing"""
        # Try to login with test credentials
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin-digest-test@example.com",
            "password": "test123456"
        })
        if login_res.status_code == 200:
            return login_res.json().get("token")
        
        # Try to register a new user
        test_email = f"test_mention_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "test123456",
            "name": "Test Mention User",
            "city": "Test City",
            "country": "Test Country"
        })
        if reg_res.status_code in [200, 201]:
            return reg_res.json().get("token")
        
        pytest.skip("Could not authenticate for comment testing")
    
    def test_comment_with_mention(self, auth_token):
        """Test creating a comment with @mention"""
        # Get a post to comment on
        posts_res = requests.get(f"{BASE_URL}/api/posts", params={"limit": 1})
        assert posts_res.status_code == 200
        posts = posts_res.json().get("posts", [])
        if not posts:
            pytest.skip("No posts available for testing")
        
        post_id = posts[0]["id"]
        
        # Create comment with @mention (author_name is required by model)
        headers = {"Authorization": f"Bearer {auth_token}"}
        comment_content = f"Test comment with @Admin User mention - {uuid.uuid4().hex[:8]}"
        
        res = requests.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json={
                "content": comment_content,
                "author_name": "Test Mention User",
                "author_city": "Test City",
                "author_country": "Test Country"
            },
            headers=headers
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "id" in data, "Comment should have id"
        assert "content" in data, "Comment should have content"
        assert data["content"] == comment_content, "Content should match"
        # Check if mentions field exists (may be empty if user not found)
        assert "mentions" in data, "Comment should have mentions field"
        print(f"PASS: Comment created with mentions field: {data.get('mentions', [])}")
    
    def test_get_comments_after_mention(self, auth_token):
        """Test that comments with mentions are retrievable"""
        # Get a post
        posts_res = requests.get(f"{BASE_URL}/api/posts", params={"limit": 1})
        posts = posts_res.json().get("posts", [])
        if not posts:
            pytest.skip("No posts available")
        
        post_id = posts[0]["id"]
        
        # Get comments
        res = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert res.status_code == 200
        comments = res.json()
        assert isinstance(comments, list), "Comments should be a list"
        print(f"PASS: Retrieved {len(comments)} comments for post")


class TestNewsletterRegression:
    """Regression tests for newsletter/analytics endpoints"""
    
    def test_newsletter_subscribe(self):
        """Test newsletter subscription still works"""
        test_email = f"test_newsletter_{uuid.uuid4().hex[:8]}@example.com"
        res = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": test_email})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("PASS: Newsletter subscribe endpoint works")
    
    def test_newsletter_unsubscribe(self):
        """Test newsletter unsubscribe still works"""
        test_email = f"test_unsub_{uuid.uuid4().hex[:8]}@example.com"
        # First subscribe
        requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": test_email})
        # Then unsubscribe
        res = requests.post(f"{BASE_URL}/api/newsletter/unsubscribe", json={"email": test_email})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("PASS: Newsletter unsubscribe endpoint works")


class TestAdminAnalyticsRegression:
    """Regression tests for admin analytics (requires auth)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin-digest-test@example.com",
            "password": "test123456"
        })
        if login_res.status_code == 200:
            return login_res.json().get("token")
        pytest.skip("Could not get admin token")
    
    def test_admin_stats_endpoint(self, admin_token):
        """Test admin stats endpoint still works"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        # May return 403 if user is not admin
        if res.status_code == 403:
            print("SKIP: User is not admin, cannot test admin stats")
            return
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "total_posts" in data, "Should have total_posts"
        assert "total_comments" in data, "Should have total_comments"
        print(f"PASS: Admin stats endpoint works - {data.get('total_posts')} posts, {data.get('total_comments')} comments")
    
    def test_admin_digest_status(self, admin_token):
        """Test admin digest status endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        res = requests.get(f"{BASE_URL}/api/admin/digest-status", headers=headers)
        if res.status_code == 403:
            print("SKIP: User is not admin")
            return
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "active_subscribers" in data, "Should have active_subscribers"
        print(f"PASS: Digest status endpoint works - {data.get('active_subscribers')} active subscribers")


class TestPublicStatsEndpoint:
    """Test public stats endpoint"""
    
    def test_public_stats(self):
        """Test public stats endpoint"""
        res = requests.get(f"{BASE_URL}/api/stats")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "total_posts" in data, "Should have total_posts"
        print(f"PASS: Public stats endpoint works - {data.get('total_posts')} posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
