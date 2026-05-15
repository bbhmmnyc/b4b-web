"""
Test Weekly Digest Feature for Blogs 4 Blocks:
- NEWSLETTER SUBSCRIPTION: POST /api/newsletter/subscribe
- NEWSLETTER UNSUBSCRIBE: POST /api/newsletter/unsubscribe
- ADMIN DIGEST STATUS: GET /api/admin/digest-status
- ADMIN MANUAL SEND DIGEST: POST /api/admin/send-digest
- ADMIN SUBSCRIBERS LIST: GET /api/admin/subscribers
- ADMIN DELETE EXPIRED GUEST POSTS: DELETE /api/admin/posts/expired-guests
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test admin credentials
ADMIN_EMAIL = "admin-digest-test@example.com"
ADMIN_PASSWORD = "test123456"
ADMIN_SETUP_KEY = "b4b-admin-2024"


class TestNewsletterSubscription:
    """Test newsletter subscribe/unsubscribe endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_subscribe_new_email(self, session):
        """POST /api/newsletter/subscribe - new email subscribes successfully"""
        test_email = f"test_digest_{uuid.uuid4().hex[:8]}@test.com"
        
        res = session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "name": "Digest Test User"
        })
        
        assert res.status_code == 200, f"Subscribe failed: {res.text}"
        data = res.json()
        
        assert "subscribed" in data
        assert data["subscribed"] == True
        assert "message" in data
        print(f"SUCCESS: Email {test_email} subscribed - message: {data['message']}")
    
    def test_subscribe_already_subscribed_email(self, session):
        """POST /api/newsletter/subscribe - already subscribed email returns appropriate message"""
        test_email = f"test_digest_{uuid.uuid4().hex[:8]}@test.com"
        
        # Subscribe first
        session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email
        })
        
        # Subscribe again
        res = session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email
        })
        
        assert res.status_code == 200
        data = res.json()
        assert "already subscribed" in data.get("message", "").lower() or data.get("subscribed") == True
        print("SUCCESS: Already subscribed email handled correctly")
    
    def test_unsubscribe_email(self, session):
        """POST /api/newsletter/unsubscribe - unsubscribe works correctly"""
        test_email = f"test_digest_{uuid.uuid4().hex[:8]}@test.com"
        
        # Subscribe first
        session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email
        })
        
        # Unsubscribe
        res = session.post(f"{BASE_URL}/api/newsletter/unsubscribe", json={
            "email": test_email
        })
        
        assert res.status_code == 200, f"Unsubscribe failed: {res.text}"
        data = res.json()
        assert data.get("subscribed") == False
        assert "unsubscribed" in data.get("message", "").lower()
        print(f"SUCCESS: Email {test_email} unsubscribed")
    
    def test_unsubscribe_nonexistent_email(self, session):
        """POST /api/newsletter/unsubscribe - non-existent email handled gracefully"""
        fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@fake.com"
        
        res = session.post(f"{BASE_URL}/api/newsletter/unsubscribe", json={
            "email": fake_email
        })
        
        # Should return 200 with appropriate message, not error
        assert res.status_code == 200
        data = res.json()
        assert "not found" in data.get("message", "").lower() or data.get("subscribed") == False
        print("SUCCESS: Non-existent email unsubscribe handled gracefully")
    
    def test_resubscribe_after_unsubscribe(self, session):
        """POST /api/newsletter/subscribe - resubscription after unsubscribe works"""
        test_email = f"test_digest_{uuid.uuid4().hex[:8]}@test.com"
        
        # Subscribe
        session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email
        })
        
        # Unsubscribe
        session.post(f"{BASE_URL}/api/newsletter/unsubscribe", json={
            "email": test_email
        })
        
        # Resubscribe
        res = session.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email
        })
        
        assert res.status_code == 200
        data = res.json()
        assert data.get("subscribed") == True
        assert "back" in data.get("message", "").lower() or "subscribed" in data.get("message", "").lower()
        print("SUCCESS: Resubscription after unsubscribe works")


class TestAdminDigestStatus:
    """Test GET /api/admin/digest-status endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def admin_token(self, session):
        """Get admin token"""
        res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        return res.json()["token"]
    
    def test_digest_status_requires_auth(self, session):
        """GET /api/admin/digest-status requires authentication"""
        res = session.get(f"{BASE_URL}/api/admin/digest-status")
        assert res.status_code == 401
        print("SUCCESS: Digest status requires authentication")
    
    def test_digest_status_requires_admin(self, session):
        """GET /api/admin/digest-status requires admin role"""
        # Create a non-admin user
        test_email = f"test_nonadmin_{uuid.uuid4().hex[:6]}@test.com"
        
        reg_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin Digest",
            "email": test_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        
        if reg_res.status_code == 200:
            non_admin_token = reg_res.json()["token"]
            res = session.get(f"{BASE_URL}/api/admin/digest-status",
                headers={"Authorization": f"Bearer {non_admin_token}"})
            assert res.status_code == 403
            print("SUCCESS: Digest status requires admin role")
        else:
            print("INFO: Could not create non-admin user, skipping test")
    
    def test_digest_status_returns_expected_fields(self, session, admin_token):
        """GET /api/admin/digest-status returns subscriber count, last digest, schedule info"""
        res = session.get(f"{BASE_URL}/api/admin/digest-status",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert res.status_code == 200, f"Digest status failed: {res.text}"
        data = res.json()
        
        # Check required fields
        assert "active_subscribers" in data, "Missing active_subscribers field"
        assert "registered_users" in data, "Missing registered_users field"
        assert "total_audience" in data, "Missing total_audience field"
        assert "schedule" in data, "Missing schedule field"
        assert "total_digests_sent" in data, "Missing total_digests_sent field"
        assert "recent_logs" in data, "Missing recent_logs field"
        
        # Verify data types
        assert isinstance(data["active_subscribers"], int)
        assert isinstance(data["registered_users"], int)
        assert isinstance(data["total_audience"], int)
        assert isinstance(data["recent_logs"], list)
        
        # Total audience should be sum of subscribers and users
        assert data["total_audience"] == data["active_subscribers"] + data["registered_users"]
        
        print(f"SUCCESS: Digest status returns all expected fields:")
        print(f"  - Active subscribers: {data['active_subscribers']}")
        print(f"  - Registered users: {data['registered_users']}")
        print(f"  - Total audience: {data['total_audience']}")
        print(f"  - Schedule: {data['schedule']}")
        print(f"  - Total digests sent: {data['total_digests_sent']}")
    
    def test_digest_status_shows_last_digest(self, session, admin_token):
        """GET /api/admin/digest-status includes last digest info if exists"""
        res = session.get(f"{BASE_URL}/api/admin/digest-status",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert res.status_code == 200
        data = res.json()
        
        # Check if last_digest exists (might be null if no digests sent)
        if data.get("last_digest"):
            last = data["last_digest"]
            assert "sent_at" in last, "Last digest missing sent_at"
            assert "recipients" in last, "Last digest missing recipients"
            assert "status" in last, "Last digest missing status"
            print(f"SUCCESS: Last digest found - sent at {last['sent_at']} to {last['recipients']} recipients")
        else:
            print("INFO: No digest has been sent yet (last_digest is null)")


class TestAdminSendDigest:
    """Test POST /api/admin/send-digest endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def admin_token(self, session):
        """Get admin token"""
        res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    def test_send_digest_requires_auth(self, session):
        """POST /api/admin/send-digest requires authentication"""
        res = session.post(f"{BASE_URL}/api/admin/send-digest")
        assert res.status_code == 401
        print("SUCCESS: Send digest requires authentication")
    
    def test_send_digest_requires_admin(self, session):
        """POST /api/admin/send-digest requires admin role"""
        # Create a non-admin user
        test_email = f"test_nonadmin2_{uuid.uuid4().hex[:6]}@test.com"
        
        reg_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin Send",
            "email": test_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        
        if reg_res.status_code == 200:
            non_admin_token = reg_res.json()["token"]
            res = session.post(f"{BASE_URL}/api/admin/send-digest",
                headers={"Authorization": f"Bearer {non_admin_token}"})
            assert res.status_code == 403
            print("SUCCESS: Send digest requires admin role")
        else:
            print("INFO: Could not create non-admin user, skipping test")
    
    def test_admin_can_trigger_digest(self, session, admin_token):
        """POST /api/admin/send-digest - admin can trigger the digest"""
        res = session.post(f"{BASE_URL}/api/admin/send-digest",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert res.status_code == 200, f"Send digest failed: {res.text}"
        data = res.json()
        
        assert "sent" in data or "message" in data
        print(f"SUCCESS: Digest triggered - {data}")
    
    def test_digest_logs_after_send(self, session, admin_token):
        """After sending digest, the log should be updated"""
        # Get current status
        status_res = session.get(f"{BASE_URL}/api/admin/digest-status",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert status_res.status_code == 200
        data = status_res.json()
        
        # Should have at least one log entry after previous test
        assert len(data.get("recent_logs", [])) >= 1, "Should have digest log entries"
        
        latest_log = data["recent_logs"][0]
        assert "sent_at" in latest_log
        assert "recipients" in latest_log
        assert "status" in latest_log
        assert latest_log["status"] in ["sent", "skipped"]
        
        print(f"SUCCESS: Digest log updated - latest: {latest_log}")


class TestAdminSubscribersList:
    """Test GET /api/admin/subscribers endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def admin_token(self, session):
        """Get admin token"""
        res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    def test_subscribers_requires_auth(self, session):
        """GET /api/admin/subscribers requires authentication"""
        res = session.get(f"{BASE_URL}/api/admin/subscribers")
        assert res.status_code == 401
        print("SUCCESS: Subscribers list requires authentication")
    
    def test_subscribers_requires_admin(self, session):
        """GET /api/admin/subscribers requires admin role"""
        test_email = f"test_nonadmin3_{uuid.uuid4().hex[:6]}@test.com"
        
        reg_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin Subs",
            "email": test_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        
        if reg_res.status_code == 200:
            non_admin_token = reg_res.json()["token"]
            res = session.get(f"{BASE_URL}/api/admin/subscribers",
                headers={"Authorization": f"Bearer {non_admin_token}"})
            assert res.status_code == 403
            print("SUCCESS: Subscribers list requires admin role")
        else:
            print("INFO: Could not create non-admin user, skipping test")
    
    def test_subscribers_returns_list(self, session, admin_token):
        """GET /api/admin/subscribers returns list of subscribers"""
        res = session.get(f"{BASE_URL}/api/admin/subscribers",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert res.status_code == 200, f"Subscribers list failed: {res.text}"
        data = res.json()
        
        assert isinstance(data, list), "Should return a list"
        
        if len(data) > 0:
            subscriber = data[0]
            assert "email" in subscriber, "Subscriber missing email"
            assert "active" in subscriber, "Subscriber missing active status"
            assert "subscribed_at" in subscriber, "Subscriber missing subscribed_at"
            print(f"SUCCESS: Subscribers list returns {len(data)} subscribers")
            print(f"  - Sample subscriber: {subscriber['email']}, active: {subscriber['active']}")
        else:
            print("INFO: No subscribers found (empty list)")


class TestAdminDeleteExpiredGuests:
    """Test DELETE /api/admin/posts/expired-guests endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def admin_token(self, session):
        """Get admin token"""
        res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    def test_delete_expired_requires_auth(self, session):
        """DELETE /api/admin/posts/expired-guests requires authentication"""
        res = session.delete(f"{BASE_URL}/api/admin/posts/expired-guests")
        assert res.status_code == 401
        print("SUCCESS: Delete expired guests requires authentication")
    
    def test_delete_expired_requires_admin(self, session):
        """DELETE /api/admin/posts/expired-guests requires admin role"""
        test_email = f"test_nonadmin4_{uuid.uuid4().hex[:6]}@test.com"
        
        reg_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Non Admin Delete",
            "email": test_email,
            "password": "testpass123",
            "city": "Test City",
            "country": "Test Country"
        })
        
        if reg_res.status_code == 200:
            non_admin_token = reg_res.json()["token"]
            res = session.delete(f"{BASE_URL}/api/admin/posts/expired-guests",
                headers={"Authorization": f"Bearer {non_admin_token}"})
            assert res.status_code == 403
            print("SUCCESS: Delete expired guests requires admin role")
        else:
            print("INFO: Could not create non-admin user, skipping test")
    
    def test_delete_expired_works(self, session, admin_token):
        """DELETE /api/admin/posts/expired-guests - admin can delete expired guest posts"""
        res = session.delete(f"{BASE_URL}/api/admin/posts/expired-guests",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert res.status_code == 200, f"Delete expired failed: {res.text}"
        data = res.json()
        
        assert "deleted" in data, "Response missing deleted count"
        assert "message" in data, "Response missing message"
        assert isinstance(data["deleted"], int)
        
        print(f"SUCCESS: Delete expired guests - {data['message']}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
