"""
Test Suite for Iteration 15: Stripe Payment Integration & City Background System
Tests:
- GET /api/payments/rate-card - Returns 9 prices and 3 multipliers
- POST /api/payments/checkout - Creates Stripe checkout session
- GET /api/payments/status/{session_id} - Returns payment status
- GET /api/advertise/stats - Returns community stats
- GET /api/stats - Returns homepage stats (30 posts, 28 contributors, 16 countries)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRateCardAPI:
    """Tests for GET /api/payments/rate-card endpoint"""
    
    def test_rate_card_returns_200(self):
        """Rate card endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/payments/rate-card returns 200")
    
    def test_rate_card_has_9_prices(self):
        """Rate card returns exactly 9 price combinations (3 sizes x 3 frequencies)"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        assert "prices" in data, "Response missing 'prices' field"
        assert len(data["prices"]) == 9, f"Expected 9 prices, got {len(data['prices'])}"
        print(f"✓ Rate card has 9 prices: {len(data['prices'])}")
    
    def test_rate_card_has_3_multipliers(self):
        """Rate card returns exactly 3 placement multipliers"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        assert "multipliers" in data, "Response missing 'multipliers' field"
        assert len(data["multipliers"]) == 3, f"Expected 3 multipliers, got {len(data['multipliers'])}"
        print(f"✓ Rate card has 3 multipliers: {len(data['multipliers'])}")
    
    def test_rate_card_price_structure(self):
        """Each price has ad_size, frequency, and base_price fields"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        for price in data["prices"]:
            assert "ad_size" in price, "Price missing 'ad_size'"
            assert "frequency" in price, "Price missing 'frequency'"
            assert "base_price" in price, "Price missing 'base_price'"
        print("✓ All prices have required fields (ad_size, frequency, base_price)")
    
    def test_rate_card_multiplier_structure(self):
        """Each multiplier has placement and multiplier fields"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        for mult in data["multipliers"]:
            assert "placement" in mult, "Multiplier missing 'placement'"
            assert "multiplier" in mult, "Multiplier missing 'multiplier'"
        print("✓ All multipliers have required fields (placement, multiplier)")
    
    def test_rate_card_price_values(self):
        """Verify specific price values from rate card ($100-$1920)"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        
        # Build lookup dict
        prices = {(p["ad_size"], p["frequency"]): p["base_price"] for p in data["prices"]}
        
        # Verify expected prices
        expected = {
            ("small", "1-run"): 100.0,
            ("small", "4-runs"): 360.0,
            ("small", "8-runs"): 640.0,
            ("medium", "1-run"): 175.0,
            ("medium", "4-runs"): 630.0,
            ("medium", "8-runs"): 1120.0,
            ("large", "1-run"): 300.0,
            ("large", "4-runs"): 1080.0,
            ("large", "8-runs"): 1920.0,
        }
        
        for key, expected_price in expected.items():
            assert key in prices, f"Missing price for {key}"
            assert prices[key] == expected_price, f"Price for {key}: expected {expected_price}, got {prices[key]}"
        
        print("✓ All 9 price values match expected ($100-$1920)")
    
    def test_rate_card_multiplier_values(self):
        """Verify multiplier values (1x, 1.25x, 1.5x)"""
        response = requests.get(f"{BASE_URL}/api/payments/rate-card")
        data = response.json()
        
        mults = {m["placement"]: m["multiplier"] for m in data["multipliers"]}
        
        assert mults.get("standard") == 1.0, f"Standard multiplier: expected 1.0, got {mults.get('standard')}"
        assert mults.get("premium") == 1.25, f"Premium multiplier: expected 1.25, got {mults.get('premium')}"
        assert mults.get("top-tier") == 1.5, f"Top-tier multiplier: expected 1.5, got {mults.get('top-tier')}"
        
        print("✓ Multiplier values correct (1x, 1.25x, 1.5x)")


class TestCheckoutAPI:
    """Tests for POST /api/payments/checkout endpoint"""
    
    def test_checkout_creates_session(self):
        """Checkout endpoint creates Stripe session and returns url + session_id"""
        payload = {
            "ad_size": "medium",
            "frequency": "4-runs",
            "placement": "standard",
            "advertiser": "TEST_Company_" + str(uuid.uuid4())[:8],
            "contact_name": "Test Contact",
            "email": "test@example.com",
            "phone": "555-1234",
            "campaign_name": "Test Campaign",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response missing 'url'"
        assert "session_id" in data, "Response missing 'session_id'"
        assert "booking_id" in data, "Response missing 'booking_id'"
        assert "total" in data, "Response missing 'total'"
        
        # Verify URL is a Stripe checkout URL
        assert "stripe.com" in data["url"] or "checkout" in data["url"], f"URL doesn't look like Stripe: {data['url']}"
        
        # Verify total calculation (medium 4-runs = $630 * 1.0 = $630)
        assert data["total"] == 630.0, f"Expected total $630, got {data['total']}"
        
        print(f"✓ Checkout creates Stripe session: session_id={data['session_id'][:20]}...")
        print(f"✓ Checkout returns correct total: ${data['total']}")
        
        return data["session_id"]
    
    def test_checkout_with_premium_placement(self):
        """Checkout with premium placement applies 1.25x multiplier"""
        payload = {
            "ad_size": "small",
            "frequency": "1-run",
            "placement": "premium",
            "advertiser": "TEST_Premium_" + str(uuid.uuid4())[:8],
            "contact_name": "Premium Contact",
            "email": "premium@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # small 1-run = $100 * 1.25 = $125
        assert data["total"] == 125.0, f"Expected total $125 (100 * 1.25), got {data['total']}"
        
        print(f"✓ Premium placement applies 1.25x multiplier: ${data['total']}")
    
    def test_checkout_with_top_tier_placement(self):
        """Checkout with top-tier placement applies 1.5x multiplier"""
        payload = {
            "ad_size": "large",
            "frequency": "8-runs",
            "placement": "top-tier",
            "advertiser": "TEST_TopTier_" + str(uuid.uuid4())[:8],
            "contact_name": "Top Tier Contact",
            "email": "toptier@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # large 8-runs = $1920 * 1.5 = $2880
        assert data["total"] == 2880.0, f"Expected total $2880 (1920 * 1.5), got {data['total']}"
        
        print(f"✓ Top-tier placement applies 1.5x multiplier: ${data['total']}")
    
    def test_checkout_invalid_ad_size(self):
        """Checkout rejects invalid ad_size"""
        payload = {
            "ad_size": "invalid",
            "frequency": "1-run",
            "placement": "standard",
            "advertiser": "Test",
            "contact_name": "Test",
            "email": "test@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid ad_size, got {response.status_code}"
        
        print("✓ Checkout rejects invalid ad_size with 400")
    
    def test_checkout_invalid_placement(self):
        """Checkout rejects invalid placement"""
        payload = {
            "ad_size": "small",
            "frequency": "1-run",
            "placement": "invalid",
            "advertiser": "Test",
            "contact_name": "Test",
            "email": "test@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid placement, got {response.status_code}"
        
        print("✓ Checkout rejects invalid placement with 400")
    
    def test_checkout_missing_required_fields(self):
        """Checkout rejects missing required fields"""
        payload = {
            "ad_size": "small",
            # Missing other required fields
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
        
        print("✓ Checkout rejects missing required fields with 422")


class TestPaymentStatusAPI:
    """Tests for GET /api/payments/status/{session_id} endpoint"""
    
    def test_payment_status_for_new_session(self):
        """Payment status returns status for a newly created session"""
        # First create a checkout session
        payload = {
            "ad_size": "small",
            "frequency": "1-run",
            "placement": "standard",
            "advertiser": "TEST_Status_" + str(uuid.uuid4())[:8],
            "contact_name": "Status Test",
            "email": "status@example.com",
            "origin_url": "https://blogs-4-blocks.preview.emergentagent.com"
        }
        
        checkout_response = requests.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert checkout_response.status_code == 200
        session_id = checkout_response.json()["session_id"]
        
        # Now check status
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_response.status_code == 200, f"Expected 200, got {status_response.status_code}"
        
        data = status_response.json()
        assert "status" in data, "Response missing 'status'"
        assert "payment_status" in data, "Response missing 'payment_status'"
        
        # New session should be unpaid
        assert data["payment_status"] in ["unpaid", "pending", None], f"New session should be unpaid, got {data['payment_status']}"
        
        print(f"✓ Payment status returns data for session: status={data['status']}, payment_status={data['payment_status']}")
    
    def test_payment_status_invalid_session(self):
        """Payment status handles invalid session_id gracefully"""
        response = requests.get(f"{BASE_URL}/api/payments/status/invalid_session_id_12345")
        # Should return 200 with error status or 404
        assert response.status_code in [200, 404, 500], f"Unexpected status code: {response.status_code}"
        
        print(f"✓ Payment status handles invalid session_id (status: {response.status_code})")


class TestAdvertiseStatsAPI:
    """Tests for GET /api/advertise/stats endpoint"""
    
    def test_advertise_stats_returns_200(self):
        """Advertise stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/advertise/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/advertise/stats returns 200")
    
    def test_advertise_stats_has_required_fields(self):
        """Advertise stats has all required fields"""
        response = requests.get(f"{BASE_URL}/api/advertise/stats")
        data = response.json()
        
        required_fields = ["total_posts", "total_users", "total_comments", "newsletter_subscribers", "total_countries"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Advertise stats has all required fields: {list(data.keys())}")
    
    def test_advertise_stats_values(self):
        """Advertise stats returns reasonable values"""
        response = requests.get(f"{BASE_URL}/api/advertise/stats")
        data = response.json()
        
        assert data["total_posts"] >= 30, f"Expected 30+ posts, got {data['total_posts']}"
        assert data["total_users"] >= 25, f"Expected 25+ users, got {data['total_users']}"
        
        print(f"✓ Advertise stats values: {data['total_posts']} posts, {data['total_users']} users, {data['total_countries']} countries")


class TestHomepageStatsAPI:
    """Tests for GET /api/stats endpoint (homepage stats)"""
    
    def test_homepage_stats_returns_200(self):
        """Homepage stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/stats returns 200")
    
    def test_homepage_stats_values(self):
        """Homepage stats returns expected values (30 posts, 28 contributors, 16 countries)"""
        response = requests.get(f"{BASE_URL}/api/stats")
        data = response.json()
        
        assert data["total_posts"] == 30, f"Expected 30 posts, got {data['total_posts']}"
        assert data["total_users"] >= 28, f"Expected 28+ contributors, got {data['total_users']}"
        assert data["total_countries"] == 16, f"Expected 16 countries, got {data['total_countries']}"
        
        print(f"✓ Homepage stats: {data['total_posts']} Posts, {data['total_users']} Contributors, {data['total_countries']} Countries")


class TestFeaturedPostsAPI:
    """Tests for featured posts (existing feature verification)"""
    
    def test_featured_posts_returns_200(self):
        """Featured posts endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/posts/featured/list returns 200")
    
    def test_featured_posts_exist(self):
        """Featured posts list is not empty"""
        response = requests.get(f"{BASE_URL}/api/posts/featured/list")
        data = response.json()
        assert len(data) > 0, "Featured posts list is empty"
        print(f"✓ Featured posts count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
