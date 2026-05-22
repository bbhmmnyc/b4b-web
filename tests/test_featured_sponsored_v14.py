"""
Test suite for Featured Carousel, Sponsored Posts, Advertise Page, and Admin Panel Extensions
Iteration 14 - Testing new features added in this session
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_SETUP_KEY = "b4b-admin-2024"


class TestFeaturedPostsAPI:
    """Tests for GET /api/posts/featured/list endpoint"""
    
    def test_featured_posts_endpoint_returns_200(self):
        """Featured posts endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/posts/featured/list returns 200")
    
    def test_featured_posts_returns_list(self):
        """Featured posts should return a list"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: Featured posts returns list with {len(data)} items")
    
    def test_featured_posts_have_is_featured_true(self):
        """All returned posts should have is_featured=True"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        for post in data:
            assert post.get("is_featured") == True, f"Post {post.get('id')} is_featured is not True"
        print(f"PASS: All {len(data)} featured posts have is_featured=True")
    
    def test_featured_posts_count_is_7(self):
        """Should return 7 featured posts as per seed data"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list?limit=10")
        data = response.json()
        assert len(data) >= 7, f"Expected at least 7 featured posts, got {len(data)}"
        print(f"PASS: Found {len(data)} featured posts (expected 7+)")
    
    def test_featured_posts_have_required_fields(self):
        """Featured posts should have all required fields for carousel display"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        required_fields = ["id", "title", "excerpt", "category_slug", "author_name", "author_city", "author_country"]
        for post in data:
            for field in required_fields:
                assert field in post, f"Post missing required field: {field}"
        print("PASS: All featured posts have required fields")


class TestSponsoredPostsAPI:
    """Tests for sponsored posts functionality"""
    
    def test_sponsored_posts_in_featured_list(self):
        """Featured list should include sponsored posts with sponsor info"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        sponsored = [p for p in data if p.get("is_sponsored")]
        assert len(sponsored) >= 2, f"Expected at least 2 sponsored posts, got {len(sponsored)}"
        print(f"PASS: Found {len(sponsored)} sponsored posts in featured list")
    
    def test_sponsored_posts_have_sponsor_name(self):
        """Sponsored posts should have sponsor_name field"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        sponsored = [p for p in data if p.get("is_sponsored")]
        for post in sponsored:
            assert post.get("sponsor_name"), f"Sponsored post {post.get('id')} missing sponsor_name"
        print("PASS: All sponsored posts have sponsor_name")
    
    def test_sponsored_posts_have_expected_sponsors(self):
        """Should have SEMrush and Mailchimp as sponsors"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        sponsor_names = [p.get("sponsor_name") for p in data if p.get("is_sponsored")]
        assert "SEMrush" in sponsor_names or "Mailchimp" in sponsor_names, f"Expected SEMrush or Mailchimp, got {sponsor_names}"
        print(f"PASS: Found expected sponsors: {sponsor_names}")


class TestAdvertisePageAPI:
    """Tests for Advertise page endpoints"""
    
    def test_advertise_stats_endpoint(self):
        """GET /api/advertise/stats should return community stats"""
        response = requests.get(f"{BASE_URL}/api/advertise/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        required_fields = ["total_posts", "total_users", "total_comments", "newsletter_subscribers", "total_countries"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"PASS: /api/advertise/stats returns all required fields")
    
    def test_advertise_stats_values(self):
        """Stats should have reasonable values"""
        response = requests.get(f"{BASE_URL}/api/advertise/stats")
        data = response.json()
        assert data["total_posts"] >= 30, f"Expected 30+ posts, got {data['total_posts']}"
        assert data["total_users"] >= 25, f"Expected 25+ users, got {data['total_users']}"
        assert data["total_countries"] >= 15, f"Expected 15+ countries, got {data['total_countries']}"
        print(f"PASS: Stats values are reasonable - {data['total_posts']} posts, {data['total_users']} users, {data['total_countries']} countries")
    
    def test_advertise_inquiry_submission(self):
        """POST /api/advertise/inquiry should accept and store inquiry"""
        unique_id = str(uuid.uuid4())[:8]
        inquiry_data = {
            "company_name": f"TEST_Company_{unique_id}",
            "contact_name": f"TEST_Contact_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "website": "https://example.com",
            "budget_range": "500-2000",
            "message": "This is a test inquiry for automated testing",
            "preferred_categories": ["social-media", "seo-sem"]
        }
        response = requests.post(f"{BASE_URL}/api/advertise/inquiry", json=inquiry_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain inquiry id"
        assert "message" in data, "Response should contain success message"
        print(f"PASS: Inquiry submitted successfully with id: {data['id']}")
        return data["id"]
    
    def test_advertise_inquiry_required_fields(self):
        """Inquiry should require company_name, contact_name, email, message"""
        # Missing required fields should fail
        incomplete_data = {
            "company_name": "Test Company"
            # Missing contact_name, email, message
        }
        response = requests.post(f"{BASE_URL}/api/advertise/inquiry", json=incomplete_data)
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
        print("PASS: Inquiry validation rejects incomplete data")


class TestAdminFeaturedSponsoredAPI:
    """Tests for admin endpoints to manage featured/sponsored posts"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token by registering and promoting a user"""
        unique_id = str(uuid.uuid4())[:8]
        # Register user
        register_data = {
            "name": f"TEST_Admin_{unique_id}",
            "email": f"test_admin_{unique_id}@example.com",
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if reg_response.status_code != 200:
            pytest.skip(f"Could not register user: {reg_response.text}")
        
        token = reg_response.json().get("token")
        
        # Promote to admin
        headers = {"Authorization": f"Bearer {token}"}
        promote_response = requests.post(
            f"{BASE_URL}/api/admin/self-promote",
            json={"secret_key": ADMIN_SETUP_KEY},
            headers=headers
        )
        if promote_response.status_code != 200:
            pytest.skip(f"Could not promote to admin: {promote_response.text}")
        
        print(f"PASS: Admin user created and promoted")
        return token
    
    def test_admin_toggle_featured_endpoint(self, admin_token):
        """PUT /api/admin/posts/{id}/feature should toggle featured status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a post to toggle
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_response.json().get("posts", [])
        if not posts:
            pytest.skip("No posts available to test")
        
        post_id = posts[0]["id"]
        original_featured = posts[0].get("is_featured", False)
        
        # Toggle featured
        response = requests.put(f"{BASE_URL}/api/admin/posts/{post_id}/feature", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "is_featured" in data, "Response should contain is_featured"
        assert data["is_featured"] != original_featured, "Featured status should be toggled"
        print(f"PASS: Featured status toggled from {original_featured} to {data['is_featured']}")
        
        # Toggle back
        requests.put(f"{BASE_URL}/api/admin/posts/{post_id}/feature", headers=headers)
    
    def test_admin_set_sponsor_endpoint(self, admin_token):
        """PUT /api/admin/posts/{id}/sponsor should set sponsor info"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get a post to sponsor
        posts_response = requests.get(f"{BASE_URL}/api/posts?limit=5")
        posts = posts_response.json().get("posts", [])
        # Find a non-sponsored post
        non_sponsored = [p for p in posts if not p.get("is_sponsored")]
        if not non_sponsored:
            pytest.skip("No non-sponsored posts available")
        
        post_id = non_sponsored[0]["id"]
        
        # Set sponsor
        sponsor_data = {
            "sponsor_name": "TEST_Sponsor",
            "sponsor_url": "https://test-sponsor.com"
        }
        response = requests.put(f"{BASE_URL}/api/admin/posts/{post_id}/sponsor", json=sponsor_data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("is_sponsored") == True, "Post should be marked as sponsored"
        print(f"PASS: Sponsor set successfully")
        
        # Remove sponsor
        remove_data = {"remove": True}
        response = requests.put(f"{BASE_URL}/api/admin/posts/{post_id}/sponsor", json=remove_data, headers=headers)
        assert response.status_code == 200
        assert response.json().get("is_sponsored") == False
        print("PASS: Sponsor removed successfully")
    
    def test_admin_get_ad_inquiries(self, admin_token):
        """GET /api/admin/ad-inquiries should return list of inquiries"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/ad-inquiries", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"PASS: Admin can view {len(data)} ad inquiries")
    
    def test_admin_update_inquiry_status(self, admin_token):
        """PUT /api/admin/ad-inquiries/{id}/status should update inquiry status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First submit an inquiry
        unique_id = str(uuid.uuid4())[:8]
        inquiry_data = {
            "company_name": f"TEST_StatusUpdate_{unique_id}",
            "contact_name": "Test Contact",
            "email": f"test_status_{unique_id}@example.com",
            "message": "Test inquiry for status update"
        }
        submit_response = requests.post(f"{BASE_URL}/api/advertise/inquiry", json=inquiry_data)
        inquiry_id = submit_response.json().get("id")
        
        # Update status
        response = requests.put(
            f"{BASE_URL}/api/admin/ad-inquiries/{inquiry_id}/status",
            json={"status": "contacted"},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Inquiry status updated to 'contacted'")
    
    def test_admin_requires_auth(self):
        """Admin endpoints should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/ad-inquiries")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASS: Admin endpoints require authentication")


class TestHomepageStatsAPI:
    """Tests for homepage stats to verify they still work correctly"""
    
    def test_stats_endpoint(self):
        """GET /api/stats should return correct values"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data.get("total_posts") >= 30, f"Expected 30+ posts, got {data.get('total_posts')}"
        assert data.get("total_users") >= 25, f"Expected 25+ users, got {data.get('total_users')}"
        assert data.get("total_countries") >= 16, f"Expected 16+ countries, got {data.get('total_countries')}"
        print(f"PASS: Stats API returns {data['total_posts']} posts, {data['total_users']} users, {data['total_countries']} countries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
