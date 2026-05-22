"""
Test Suite for Iteration 16: Admin Campaigns Analytics Tab
Tests:
- GET /api/admin/campaigns - Returns revenue, featured stats, inquiry pipeline, transactions (requires admin auth)
- Existing APIs still work: GET /api/payments/rate-card, POST /api/payments/checkout, GET /api/posts/featured/list
- Admin authentication flow
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from main agent
ADMIN_EMAIL = "admin_camp@test.com"
ADMIN_PASSWORD = "pass123"
ADMIN_SETUP_KEY = "b4b-admin-2024"


class TestAdminAuth:
    """Tests for admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        assert "token" in data, "Login response missing token"
        print(f"✓ Admin login successful: {ADMIN_EMAIL}")
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Admin can login successfully"""
        assert admin_token is not None
        print(f"✓ Admin token obtained")


class TestAdminCampaignsAPI:
    """Tests for GET /api/admin/campaigns endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code}")
        return response.json()["token"]
    
    def test_campaigns_requires_auth(self):
        """Campaigns endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/campaigns")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ GET /api/admin/campaigns requires authentication")
    
    def test_campaigns_returns_200(self, admin_token):
        """Campaigns endpoint returns 200 with admin auth"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ GET /api/admin/campaigns returns 200 with admin auth")
    
    def test_campaigns_has_revenue_section(self, admin_token):
        """Campaigns response has revenue section with total, paid_count, pending_count"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "revenue" in data, "Response missing 'revenue' section"
        revenue = data["revenue"]
        assert "total" in revenue, "Revenue missing 'total'"
        assert "paid_count" in revenue, "Revenue missing 'paid_count'"
        assert "pending_count" in revenue, "Revenue missing 'pending_count'"
        
        print(f"✓ Revenue section: total=${revenue['total']}, paid={revenue['paid_count']}, pending={revenue['pending_count']}")
    
    def test_campaigns_has_featured_section(self, admin_token):
        """Campaigns response has featured section with count, views, likes, comments, posts"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "featured" in data, "Response missing 'featured' section"
        featured = data["featured"]
        assert "count" in featured, "Featured missing 'count'"
        assert "total_views" in featured, "Featured missing 'total_views'"
        assert "total_likes" in featured, "Featured missing 'total_likes'"
        assert "total_comments" in featured, "Featured missing 'total_comments'"
        assert "posts" in featured, "Featured missing 'posts'"
        
        print(f"✓ Featured section: {featured['count']} posts, {featured['total_views']} views, {featured['total_likes']} likes, {featured['total_comments']} comments")
    
    def test_campaigns_featured_posts_structure(self, admin_token):
        """Featured posts have correct structure (id, title, category, views, likes, author)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        posts = data["featured"]["posts"]
        if len(posts) > 0:
            post = posts[0]
            required_fields = ["id", "title", "category", "views", "likes", "author"]
            for field in required_fields:
                assert field in post, f"Featured post missing '{field}'"
            print(f"✓ Featured posts have correct structure: {list(post.keys())}")
        else:
            print("✓ No featured posts to verify structure (empty list)")
    
    def test_campaigns_has_sponsored_section(self, admin_token):
        """Campaigns response has sponsored section"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "sponsored" in data, "Response missing 'sponsored' section"
        sponsored = data["sponsored"]
        assert "count" in sponsored, "Sponsored missing 'count'"
        assert "total_views" in sponsored, "Sponsored missing 'total_views'"
        assert "total_likes" in sponsored, "Sponsored missing 'total_likes'"
        
        print(f"✓ Sponsored section: {sponsored['count']} posts, {sponsored['total_views']} views")
    
    def test_campaigns_has_inquiry_pipeline(self, admin_token):
        """Campaigns response has inquiry_pipeline with new, contacted, closed counts"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "inquiry_pipeline" in data, "Response missing 'inquiry_pipeline'"
        pipeline = data["inquiry_pipeline"]
        assert "new" in pipeline, "Pipeline missing 'new'"
        assert "contacted" in pipeline, "Pipeline missing 'contacted'"
        assert "closed" in pipeline, "Pipeline missing 'closed'"
        
        total = pipeline["new"] + pipeline["contacted"] + pipeline["closed"]
        print(f"✓ Inquiry pipeline: new={pipeline['new']}, contacted={pipeline['contacted']}, closed={pipeline['closed']} (total={total})")
    
    def test_campaigns_has_recent_bookings(self, admin_token):
        """Campaigns response has recent_bookings array"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "recent_bookings" in data, "Response missing 'recent_bookings'"
        assert isinstance(data["recent_bookings"], list), "recent_bookings should be a list"
        
        print(f"✓ Recent bookings: {len(data['recent_bookings'])} bookings")
    
    def test_campaigns_has_recent_transactions(self, admin_token):
        """Campaigns response has recent_transactions with correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/campaigns", headers=headers)
        data = response.json()
        
        assert "recent_transactions" in data, "Response missing 'recent_transactions'"
        transactions = data["recent_transactions"]
        assert isinstance(transactions, list), "recent_transactions should be a list"
        
        if len(transactions) > 0:
            tx = transactions[0]
            required_fields = ["id", "booking_id", "advertiser", "ad_size", "frequency", "placement", "total_price", "payment_status"]
            for field in required_fields:
                assert field in tx, f"Transaction missing '{field}'"
            print(f"✓ Recent transactions: {len(transactions)} transactions, structure verified")
        else:
            print("✓ Recent transactions: 0 transactions (empty list)")


class TestExistingAPIs:
    """Verify existing APIs still work (regression tests)"""
    
    def test_rate_card_still_works(self):
        """GET /api/payments/rate-card still returns 200"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert len(data["prices"]) == 9, f"Expected 9 prices, got {len(data['prices'])}"
        assert len(data["multipliers"]) == 3, f"Expected 3 multipliers, got {len(data['multipliers'])}"
        
        print("✓ GET /api/payments/rate-card still works (9 prices, 3 multipliers)")
    
    def test_checkout_still_works(self):
        """POST /api/payments/checkout still creates Stripe session"""
        payload = {
            "ad_size": "small",
            "frequency": "1-run",
            "placement": "standard",
            "advertiser": "TEST_Regression_" + str(uuid.uuid4())[:8],
            "contact_name": "Regression Test",
            "email": "regression@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response missing 'url'"
        assert "session_id" in data, "Response missing 'session_id'"
        assert data["total"] == 100.0, f"Expected $100, got {data['total']}"
        
        print(f"✓ POST /api/payments/checkout still works (session created, total=${data['total']})")
    
    def test_featured_posts_still_works(self):
        """GET /api/posts/featured/list still returns 200"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Featured posts should be a list"
        
        print(f"✓ GET /api/posts/featured/list still works ({len(data)} featured posts)")
    
    def test_homepage_stats_still_works(self):
        """GET /api/stats still returns correct values"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["total_posts"] >= 30, f"Expected 30+ posts, got {data['total_posts']}"
        
        print(f"✓ GET /api/stats still works ({data['total_posts']} posts, {data['total_users']} users, {data['total_countries']} countries)")


class TestAdminStatsAPI:
    """Tests for GET /api/admin/stats endpoint (existing admin feature)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code}")
        return response.json()["token"]
    
    def test_admin_stats_returns_200(self, admin_token):
        """Admin stats endpoint returns 200"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/admin/stats returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
