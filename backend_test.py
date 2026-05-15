import requests
import sys
from datetime import datetime
import json

class CategorySystemTester:
    def __init__(self, base_url="https://blogs-4-blocks.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result = response.json() if response.text else {}
                    if isinstance(result, list) and len(result) > 0:
                        print(f"   Response count: {len(result)}")
                    elif isinstance(result, dict) and 'message' in result:
                        print(f"   Message: {result['message']}")
                    return True, result
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "demo@b4b.com", "password": "password123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Logged in as: {response['user']['name']}")
            return True
        return False

    def test_get_all_categories(self):
        """Test GET /api/categories - should return 11 approved categories"""
        success, response = self.run_test(
            "GET All Categories",
            "GET",
            "categories",
            200
        )
        
        if success:
            categories = response if isinstance(response, list) else []
            expected_count = 11
            actual_count = len(categories)
            
            if actual_count == expected_count:
                print(f"   ✅ Found {actual_count} categories (expected {expected_count})")
                
                # Check for new categories
                new_categories = ['digital-marketing', 'marketing-and-ai', 'keywords', 'careers']
                found_new = []
                for cat in categories:
                    if cat.get('slug') in new_categories:
                        found_new.append(cat.get('slug'))
                        print(f"   ✅ Found new category: {cat.get('name')} ({cat.get('slug')})")
                
                missing = set(new_categories) - set(found_new)
                if missing:
                    print(f"   ❌ Missing new categories: {missing}")
                    self.failed_tests.append(f"Missing categories: {missing}")
                
                return len(found_new) == len(new_categories)
            else:
                print(f"   ❌ Expected {expected_count} categories, got {actual_count}")
                self.failed_tests.append(f"Expected {expected_count} categories, got {actual_count}")
                return False
        
        return success

    def test_get_category_with_subcategories(self):
        """Test GET /api/categories/marketing-forum-hub - should return category with subcategories"""
        success, response = self.run_test(
            "GET Category with Subcategories",
            "GET",
            "categories/marketing-and-ai",
            200
        )
        
        if success:
            if 'subcategories' in response:
                print(f"   ✅ Category has subcategories: {len(response['subcategories'])}")
            else:
                print("   ⚠️ No subcategories found")
            
            if response.get('status') == 'approved':
                print("   ✅ Category status is approved")
            else:
                print(f"   ❌ Category status is {response.get('status')}")
        
        return success

    def test_suggest_category(self):
        """Test POST /api/categories/suggest - create a pending category"""
        test_name = f"Test Category {datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "Suggest New Category",
            "POST",
            "categories/suggest",
            200,
            data={
                "name": test_name,
                "description": f"Test category suggested at {datetime.now()}"
            }
        )
        
        if success and 'slug' in response:
            self.suggested_slug = response['slug']
            print(f"   ✅ Suggested category slug: {self.suggested_slug}")
            return True
        
        return success

    def test_get_pending_categories(self):
        """Test GET /api/categories/pending/list - should return pending categories"""
        success, response = self.run_test(
            "GET Pending Categories",
            "GET",
            "categories/pending/list",
            200
        )
        
        if success:
            pending_cats = response if isinstance(response, list) else []
            print(f"   Found {len(pending_cats)} pending categories")
            for cat in pending_cats:
                if cat.get('status') == 'pending':
                    print(f"   - {cat.get('name')} ({cat.get('slug')})")
        
        return success

    def test_approve_category(self):
        """Test PUT /api/categories/{slug}/approve - approve a pending category"""
        if not hasattr(self, 'suggested_slug'):
            print("❌ Skipping approve test - no suggested category slug")
            return False
            
        success, response = self.run_test(
            "Approve Pending Category",
            "PUT",
            f"categories/{self.suggested_slug}/approve",
            200
        )
        
        if success and response.get('status') == 'approved':
            print(f"   ✅ Category {response.get('name')} approved successfully")
            self.approved_slug = self.suggested_slug
            return True
        
        return success

    def test_approved_category_appears(self):
        """Test that approved category appears in main categories list"""
        if not hasattr(self, 'approved_slug'):
            print("❌ Skipping approved category test - no approved slug")
            return False
            
        success, response = self.run_test(
            "Approved Category in Main List",
            "GET",
            "categories",
            200
        )
        
        if success:
            categories = response if isinstance(response, list) else []
            found_approved = False
            for cat in categories:
                if cat.get('slug') == self.approved_slug and cat.get('status') == 'approved':
                    found_approved = True
                    print(f"   ✅ Found approved category: {cat.get('name')}")
                    break
            
            if not found_approved:
                print(f"   ❌ Approved category {self.approved_slug} not found in main list")
                self.failed_tests.append(f"Approved category {self.approved_slug} not in main list")
            
            return found_approved
        
        return success

    def test_reject_category(self):
        """Test DELETE /api/categories/{slug}/reject - reject a pending category"""
        # First create another pending category to reject
        test_name = f"Reject Test {datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "Create Category to Reject",
            "POST",
            "categories/suggest",
            200,
            data={
                "name": test_name,
                "description": "Category created to test rejection"
            }
        )
        
        if success and 'slug' in response:
            reject_slug = response['slug']
            success, response = self.run_test(
                "Reject Pending Category",
                "DELETE",
                f"categories/{reject_slug}/reject",
                200
            )
            
            if success and 'message' in response:
                print(f"   ✅ Rejection message: {response['message']}")
                return True
        
        return success

    def test_duplicate_category_error(self):
        """Test that suggesting duplicate category returns error"""
        success, response = self.run_test(
            "Duplicate Category Error",
            "POST",
            "categories/suggest",
            400,  # Expecting error
            data={
                "name": "Social Media Marketing",  # This already exists
                "description": "Duplicate category test"
            }
        )
        return success

    def test_specific_new_categories(self):
        """Test that all 4 new categories are present"""
        success, response = self.run_test(
            "Check New Categories",
            "GET",
            "categories",
            200
        )
        
        if success:
            categories = response if isinstance(response, list) else []
            new_cats = {
                'digital-marketing': 'Digital Marketing',
                'marketing-and-ai': 'Marketing & AI', 
                'keywords': 'Keywords & Search Strategy',
                'careers': 'Marketing Careers'
            }
            
            found_cats = {}
            for cat in categories:
                slug = cat.get('slug')
                if slug in new_cats:
                    found_cats[slug] = cat.get('name')
                    print(f"   ✅ Found: {cat.get('name')} ({slug})")
            
            missing = set(new_cats.keys()) - set(found_cats.keys())
            if missing:
                print(f"   ❌ Missing new categories: {[new_cats[m] for m in missing]}")
                return False
            
            return True
        
        return success

def main():
    """Run all category system tests"""
    print("🚀 Starting Category System Testing")
    print("="*50)
    
    tester = CategorySystemTester()
    
    # Login first
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test all category endpoints
    tests = [
        tester.test_get_all_categories,
        tester.test_specific_new_categories,
        tester.test_get_category_with_subcategories,
        tester.test_suggest_category,
        tester.test_get_pending_categories,
        tester.test_approve_category,
        tester.test_approved_category_appears,
        tester.test_reject_category,
        tester.test_duplicate_category_error,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            tester.failed_tests.append(f"{test.__name__}: {e}")
    
    # Print results
    print("\n" + "="*50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    else:
        print("✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())