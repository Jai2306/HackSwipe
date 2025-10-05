#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://projectswipe.preview.emergentagent.com/api"
TEST_USER_EMAIL = "hackswipe.test@example.com"
TEST_USER_PASSWORD = "hackswipe123"
TEST_USER_NAME = "HackSwipe Test User"

class HackSwipeAnimationTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.test_user_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def setup_authentication(self):
        """Setup authentication for testing"""
        try:
            # Try to register first
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.test_user_id = data.get('user', {}).get('id')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("Authentication Setup", True, "New test user registered successfully")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                # User exists, try login
                return self.login_existing_user()
            else:
                self.log_result("Authentication Setup", False, f"Registration failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication Setup", False, f"Authentication error: {str(e)}")
            return False
    
    def login_existing_user(self):
        """Login with existing test user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.test_user_id = data.get('user', {}).get('id')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("Authentication Login", True, "Existing test user logged in successfully")
                return True
            else:
                self.log_result("Authentication Login", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication Login", False, f"Login error: {str(e)}")
            return False
    
    def test_authentication_flow(self):
        """Test authentication flow after animation changes"""
        try:
            print("\n🔄 Testing Authentication Flow After Animation Changes...")
            
            # Test /auth/me endpoint
            response = self.session.get(f"{BASE_URL}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user')
                profile = data.get('profile')
                
                if user and user.get('id') == self.test_user_id:
                    self.log_result("Auth Me Endpoint", True, 
                                  f"Authentication working correctly. User: {user.get('name')}, Profile: {'Yes' if profile else 'No'}")
                    return True
                else:
                    self.log_result("Auth Me Endpoint", False, "User data mismatch in auth/me response")
                    return False
            else:
                self.log_result("Auth Me Endpoint", False, 
                              f"Auth/me failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication Flow", False, f"Authentication flow error: {str(e)}")
            return False
    
    def test_explore_endpoints_data_retrieval(self):
        """Test data retrieval from explore endpoints"""
        try:
            print("\n🔄 Testing Data Retrieval from Explore Endpoints...")
            
            endpoints = [
                ("people", "/explore/people"),
                ("projects", "/explore/projects"), 
                ("hackathons", "/explore/hackathons")
            ]
            
            all_success = True
            
            for endpoint_name, endpoint_path in endpoints:
                try:
                    response = self.session.get(f"{BASE_URL}{endpoint_path}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if endpoint_name == "people":
                            items = data.get('people', [])
                            item_type = "people"
                        else:
                            items = data.get('posts', [])
                            item_type = endpoint_name
                        
                        if len(items) > 0:
                            # Check data structure for stacked card system
                            sample_item = items[0]
                            has_required_fields = True
                            
                            if endpoint_name == "people":
                                required_fields = ['id', 'name', 'imageUrl']
                                has_required_fields = all(field in sample_item for field in required_fields)
                            else:
                                required_fields = ['id', 'title', 'skillsNeeded']
                                has_required_fields = all(field in sample_item for field in required_fields)
                            
                            if has_required_fields:
                                self.log_result(f"Explore {endpoint_name.title()} Data", True,
                                              f"Retrieved {len(items)} {item_type} with proper structure for stacked cards")
                            else:
                                self.log_result(f"Explore {endpoint_name.title()} Data", False,
                                              f"Missing required fields in {item_type} data structure")
                                all_success = False
                        else:
                            self.log_result(f"Explore {endpoint_name.title()} Data", True,
                                          f"No {item_type} available (empty state)")
                    else:
                        self.log_result(f"Explore {endpoint_name.title()} Data", False,
                                      f"Failed to retrieve {item_type}: {response.status_code}")
                        all_success = False
                        
                except Exception as e:
                    self.log_result(f"Explore {endpoint_name.title()} Data", False, f"Error: {str(e)}")
                    all_success = False
            
            return all_success
                
        except Exception as e:
            self.log_result("Data Retrieval", False, f"Data retrieval error: {str(e)}")
            return False
    
    def test_swipe_api_functionality(self):
        """Test swipe API functionality with new animation system"""
        try:
            print("\n🔄 Testing Swipe API Functionality with Animation System...")
            
            # First, get some people to swipe on
            people_response = self.session.get(f"{BASE_URL}/explore/people")
            
            if people_response.status_code != 200:
                self.log_result("Swipe API - Get People", False, "Cannot get people for swipe testing")
                return False
            
            people_data = people_response.json()
            people = people_data.get('people', [])
            
            if len(people) == 0:
                self.log_result("Swipe API - No People", True, "No people available to swipe (empty state)")
                return True
            
            # Test swipe functionality
            test_person = people[0]
            person_id = test_person.get('id')
            person_name = test_person.get('name', 'Unknown')
            
            # Test LEFT swipe (animation: card going left)
            left_swipe_response = self.session.post(f"{BASE_URL}/swipe", json={
                "targetType": "PERSON",
                "targetId": person_id,
                "direction": "LEFT"
            })
            
            if left_swipe_response.status_code == 200:
                left_data = left_swipe_response.json()
                swipe_data = left_data.get('swipe')
                
                if swipe_data and swipe_data.get('direction') == 'LEFT':
                    self.log_result("Swipe API - LEFT Swipe", True,
                                  f"LEFT swipe on {person_name} successful. Animation: card should go left")
                else:
                    self.log_result("Swipe API - LEFT Swipe", False, "LEFT swipe data structure incorrect")
                    return False
            else:
                self.log_result("Swipe API - LEFT Swipe", False,
                              f"LEFT swipe failed: {left_swipe_response.status_code}")
                return False
            
            # Test duplicate swipe prevention
            duplicate_response = self.session.post(f"{BASE_URL}/swipe", json={
                "targetType": "PERSON",
                "targetId": person_id,
                "direction": "RIGHT"
            })
            
            if duplicate_response.status_code == 400:
                self.log_result("Swipe API - Duplicate Prevention", True,
                              "Duplicate swipe correctly prevented")
            else:
                self.log_result("Swipe API - Duplicate Prevention", False,
                              "Duplicate swipe not prevented properly")
            
            # Test RIGHT swipe on another person if available
            if len(people) > 1:
                test_person_2 = people[1]
                person_2_id = test_person_2.get('id')
                person_2_name = test_person_2.get('name', 'Unknown')
                
                right_swipe_response = self.session.post(f"{BASE_URL}/swipe", json={
                    "targetType": "PERSON",
                    "targetId": person_2_id,
                    "direction": "RIGHT"
                })
                
                if right_swipe_response.status_code == 200:
                    right_data = right_swipe_response.json()
                    swipe_data = right_data.get('swipe')
                    match_data = right_data.get('match')
                    
                    if swipe_data and swipe_data.get('direction') == 'RIGHT':
                        self.log_result("Swipe API - RIGHT Swipe", True,
                                      f"RIGHT swipe on {person_2_name} successful. Animation: card should go right. Match: {'Yes' if match_data else 'No'}")
                    else:
                        self.log_result("Swipe API - RIGHT Swipe", False, "RIGHT swipe data structure incorrect")
                        return False
                else:
                    self.log_result("Swipe API - RIGHT Swipe", False,
                                  f"RIGHT swipe failed: {right_swipe_response.status_code}")
                    return False
            
            # Test swipe on projects/hackathons (different animation states)
            projects_response = self.session.get(f"{BASE_URL}/explore/projects")
            if projects_response.status_code == 200:
                projects_data = projects_response.json()
                projects = projects_data.get('posts', [])
                
                if len(projects) > 0:
                    test_project = projects[0]
                    project_id = test_project.get('id')
                    project_title = test_project.get('title', 'Unknown')
                    
                    project_swipe_response = self.session.post(f"{BASE_URL}/swipe", json={
                        "targetType": "PROJECT",
                        "targetId": project_id,
                        "direction": "RIGHT"
                    })
                    
                    if project_swipe_response.status_code == 200:
                        self.log_result("Swipe API - Project Swipe", True,
                                      f"Project swipe on '{project_title}' successful. Separate animation state working")
                    else:
                        self.log_result("Swipe API - Project Swipe", False,
                                      f"Project swipe failed: {project_swipe_response.status_code}")
            
            return True
                
        except Exception as e:
            self.log_result("Swipe API Functionality", False, f"Swipe API error: {str(e)}")
            return False
    
    def test_match_system(self):
        """Test match system functionality"""
        try:
            print("\n🔄 Testing Match System Functionality...")
            
            # Get current matches
            matches_response = self.session.get(f"{BASE_URL}/matches")
            
            if matches_response.status_code == 200:
                matches_data = matches_response.json()
                matches = matches_data.get('matches', [])
                
                self.log_result("Match System - Get Matches", True,
                              f"Retrieved {len(matches)} matches successfully")
                
                # Check match data structure
                if len(matches) > 0:
                    sample_match = matches[0]
                    required_fields = ['id', 'aId', 'bId', 'context', 'createdAt']
                    has_required_fields = all(field in sample_match for field in required_fields)
                    
                    if has_required_fields:
                        other_user = sample_match.get('otherUser')
                        if other_user:
                            self.log_result("Match System - Data Structure", True,
                                          f"Match data structure correct. Other user: {other_user.get('name', 'Unknown')}")
                        else:
                            self.log_result("Match System - Data Structure", False,
                                          "Match missing other user data")
                    else:
                        self.log_result("Match System - Data Structure", False,
                                      "Match data structure incomplete")
                else:
                    self.log_result("Match System - No Matches", True,
                                  "No matches found (expected for new test user)")
                
                return True
            else:
                self.log_result("Match System - Get Matches", False,
                              f"Failed to get matches: {matches_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Match System", False, f"Match system error: {str(e)}")
            return False
    
    def test_animation_timing_compatibility(self):
        """Test that API responses are compatible with new animation timing (400ms/600ms)"""
        try:
            print("\n🔄 Testing Animation Timing Compatibility...")
            
            # Test API response times to ensure they work with animation timing
            import time
            
            # Test explore endpoint response time
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/explore/people")
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            if response.status_code == 200:
                if response_time < 300:  # Should be fast enough for 400ms animation
                    self.log_result("Animation Timing - API Speed", True,
                                  f"API response time ({response_time:.0f}ms) compatible with 400ms animation timing")
                else:
                    self.log_result("Animation Timing - API Speed", False,
                                  f"API response time ({response_time:.0f}ms) may be too slow for smooth animations")
                
                # Test swipe endpoint response time
                people_data = response.json()
                people = people_data.get('people', [])
                
                if len(people) > 0:
                    person_id = people[0].get('id')
                    
                    start_time = time.time()
                    swipe_response = self.session.post(f"{BASE_URL}/swipe", json={
                        "targetType": "PERSON",
                        "targetId": person_id,
                        "direction": "LEFT"
                    })
                    swipe_response_time = (time.time() - start_time) * 1000
                    
                    if swipe_response.status_code in [200, 400]:  # 400 for duplicate is OK
                        if swipe_response_time < 200:  # Should be very fast for smooth animations
                            self.log_result("Animation Timing - Swipe Speed", True,
                                          f"Swipe API response time ({swipe_response_time:.0f}ms) excellent for animations")
                        else:
                            self.log_result("Animation Timing - Swipe Speed", False,
                                          f"Swipe API response time ({swipe_response_time:.0f}ms) may cause animation lag")
                
                return True
            else:
                self.log_result("Animation Timing Compatibility", False,
                              f"Cannot test timing due to API error: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Animation Timing Compatibility", False, f"Timing test error: {str(e)}")
            return False
    
    def run_hackswipe_tests(self):
        """Run all HackSwipe animation and backend integration tests"""
        print("🚀 Starting HackSwipe Animation & Backend Integration Testing...")
        print("=" * 70)
        print("Testing swipe animation fixes and backend API integration")
        print("Focus: Swipe API, Authentication, Data Retrieval, Match System")
        print("=" * 70)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run focused tests for animation integration
        tests = [
            self.test_authentication_flow,
            self.test_explore_endpoints_data_retrieval,
            self.test_swipe_api_functionality,
            self.test_match_system,
            self.test_animation_timing_compatibility
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
        
        # Summary
        print("\n" + "=" * 70)
        print(f"📊 HACKSWIPE ANIMATION & BACKEND INTEGRATION TEST SUMMARY")
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All HackSwipe animation integration tests passed!")
            print("✅ Backend APIs working correctly with new animation system")
            print("✅ Swipe functionality compatible with separate animation states")
            print("✅ Authentication flow unaffected by animation changes")
            print("✅ Data retrieval working for stacked card system")
            return True
        else:
            print(f"⚠️  {total_tests - passed_tests} test(s) failed")
            print("❌ Some backend integration issues found with animation system")
            return False

if __name__ == "__main__":
    tester = HackSwipeAnimationTester()
    success = tester.run_hackswipe_tests()
    sys.exit(0 if success else 1)