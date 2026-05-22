"""
Test suite for Blogs4Blocks - Iteration 13
Testing: Deployment guide (Oracle Cloud), stats, routes, pastel gradients, @mention feature
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStatsAPI:
    """Test stats endpoint returns correct non-zero values"""
    
    def test_stats_endpoint_returns_correct_values(self):
        """Stats should show 30 posts, 25 contributors, 16 countries"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        assert "total_posts" in data, "Missing total_posts in stats"
        assert "total_users" in data, "Missing total_users in stats"
        assert "total_countries" in data, "Missing total_countries in stats"
        assert "total_comments" in data, "Missing total_comments in stats"
        
        # Verify non-zero values
        assert data["total_posts"] >= 30, f"Expected at least 30 posts, got {data['total_posts']}"
        assert data["total_users"] >= 25, f"Expected at least 25 contributors, got {data['total_users']}"
        assert data["total_countries"] >= 16, f"Expected at least 16 countries, got {data['total_countries']}"
        print(f"Stats: {data['total_posts']} posts, {data['total_users']} contributors, {data['total_countries']} countries")


class TestCategoriesAPI:
    """Test categories endpoint"""
    
    def test_categories_endpoint(self):
        """Categories should return list with slugs and colors"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Categories endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Categories should be a list"
        assert len(data) >= 11, f"Expected at least 11 categories, got {len(data)}"
        
        # Check first category has required fields
        cat = data[0]
        assert "slug" in cat, "Category missing slug"
        assert "name" in cat, "Category missing name"
        assert "color" in cat, "Category missing color"
        print(f"Found {len(data)} categories")


class TestPostsAPI:
    """Test posts endpoint"""
    
    def test_posts_endpoint(self):
        """Posts should return paginated list"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=6")
        assert response.status_code == 200, f"Posts endpoint failed: {response.text}"
        
        data = response.json()
        assert "posts" in data, "Missing posts in response"
        assert "total" in data, "Missing total in response"
        assert len(data["posts"]) <= 6, "Should respect limit parameter"
        
        if data["posts"]:
            post = data["posts"][0]
            assert "id" in post, "Post missing id"
            assert "title" in post, "Post missing title"
            assert "category_slug" in post, "Post missing category_slug"
            assert "author_name" in post, "Post missing author_name"
        print(f"Found {data['total']} total posts")


class TestUserSearchAPI:
    """Test user search for @mention feature"""
    
    def test_user_search_returns_results(self):
        """User search should return users matching query"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=A&limit=5")
        assert response.status_code == 200, f"User search failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "User search should return a list"
        
        if data:
            user = data[0]
            assert "id" in user, "User missing id"
            assert "name" in user, "User missing name"
            print(f"User search returned {len(data)} users")
        else:
            print("User search returned empty list (may be no users starting with 'A')")
    
    def test_user_search_empty_query(self):
        """Empty query should return empty list"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=")
        assert response.status_code == 200, f"User search failed: {response.text}"
        
        data = response.json()
        assert data == [], "Empty query should return empty list"


class TestNewsletterAPI:
    """Test newsletter subscription"""
    
    def test_newsletter_subscribe(self):
        """Newsletter subscription should work"""
        import time
        test_email = f"test_v13_{int(time.time())}@example.com"
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": test_email})
        assert response.status_code == 200, f"Newsletter subscribe failed: {response.text}"
        print(f"Newsletter subscription successful for {test_email}")


class TestPopularPostsAPI:
    """Test popular posts endpoint"""
    
    def test_popular_posts_endpoint(self):
        """Popular posts should return list"""
        response = requests.get(f"{BASE_URL}/api/posts/popular/list?limit=4")
        assert response.status_code == 200, f"Popular posts endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Popular posts should be a list"
        print(f"Found {len(data)} popular posts")


class TestHealthEndpoint:
    """Test health check"""
    
    def test_health_endpoint(self):
        """Health endpoint should return ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health endpoint failed: {response.text}"
        print("Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
