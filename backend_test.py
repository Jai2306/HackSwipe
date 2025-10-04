#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://hackmate-4.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test.user.enhanced@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Enhanced Test User"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_users = []
        self.test_tokens = []
        self.test_results = {
            'auth': {'passed': 0, 'failed': 0, 'details': []},
            'profile': {'passed': 0, 'failed': 0, 'details': []},
            'explore': {'passed': 0, 'failed': 0, 'details': []},
            'swipe': {'passed': 0, 'failed': 0, 'details': []},
            'matches': {'passed': 0, 'failed': 0, 'details': []}
        }
        
    def log_result(self, category, test_name, passed, details=""):
        """Log test result"""
        if passed:
            self.test_results[category]['passed'] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]['failed'] += 1
            status = "❌ FAIL"
            
        self.test_results[category]['details'].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
            
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test 1: Valid registration
        user_data = {
            "email": "alice.developer@hackathon.com",
            "password": "SecurePass123!",
            "name": "Alice Developer"
        }
        
        response = self.make_request('POST', 'auth/register', user_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'user' in data and 'token' in data:
                self.test_users.append(data['user'])
                self.test_tokens.append(data['token'])
                self.log_result('auth', 'Valid Registration', True, f"User created: {data['user']['name']}")
            else:
                self.log_result('auth', 'Valid Registration', False, "Missing user or token in response")
        else:
            self.log_result('auth', 'Valid Registration', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Duplicate registration
        response = self.make_request('POST', 'auth/register', user_data)
        if response and response.status_code == 400:
            self.log_result('auth', 'Duplicate Registration Prevention', True, "Correctly rejected duplicate")
        else:
            self.log_result('auth', 'Duplicate Registration Prevention', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 3: Missing fields
        invalid_data = {"email": "test@test.com"}
        response = self.make_request('POST', 'auth/register', invalid_data)
        if response and response.status_code == 400:
            self.log_result('auth', 'Missing Fields Validation', True, "Correctly rejected missing fields")
        else:
            self.log_result('auth', 'Missing Fields Validation', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Register second user for matching tests
        user2_data = {
            "email": "bob.designer@hackathon.com",
            "password": "SecurePass456!",
            "name": "Bob Designer"
        }
        
        response = self.make_request('POST', 'auth/register', user2_data)
        if response and response.status_code == 200:
            data = response.json()
            self.test_users.append(data['user'])
            self.test_tokens.append(data['token'])
            self.log_result('auth', 'Second User Registration', True, f"User created: {data['user']['name']}")
        else:
            self.log_result('auth', 'Second User Registration', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Register third user for more comprehensive testing
        user3_data = {
            "email": "charlie.fullstack@hackathon.com",
            "password": "SecurePass789!",
            "name": "Charlie Fullstack"
        }
        
        response = self.make_request('POST', 'auth/register', user3_data)
        if response and response.status_code == 200:
            data = response.json()
            self.test_users.append(data['user'])
            self.test_tokens.append(data['token'])
            self.log_result('auth', 'Third User Registration', True, f"User created: {data['user']['name']}")
        else:
            self.log_result('auth', 'Third User Registration', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        if not self.test_users:
            self.log_result('auth', 'Login Test', False, "No users available for login test")
            return
            
        # Test 1: Valid login
        login_data = {
            "email": self.test_users[0]['email'],
            "password": "SecurePass123!"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'user' in data and 'token' in data:
                self.log_result('auth', 'Valid Login', True, f"Login successful for {data['user']['name']}")
            else:
                self.log_result('auth', 'Valid Login', False, "Missing user or token in response")
        else:
            self.log_result('auth', 'Valid Login', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Invalid credentials
        invalid_login = {
            "email": self.test_users[0]['email'],
            "password": "WrongPassword"
        }
        
        response = self.make_request('POST', 'auth/login', invalid_login)
        if response and response.status_code == 401:
            self.log_result('auth', 'Invalid Credentials', True, "Correctly rejected invalid password")
        else:
            self.log_result('auth', 'Invalid Credentials', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 3: Non-existent user
        nonexistent_login = {
            "email": "nonexistent@test.com",
            "password": "password"
        }
        
        response = self.make_request('POST', 'auth/login', nonexistent_login)
        if response and response.status_code == 401:
            self.log_result('auth', 'Non-existent User', True, "Correctly rejected non-existent user")
        else:
            self.log_result('auth', 'Non-existent User', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_get_current_user(self):
        """Test get current user endpoint"""
        print("\n=== Testing Get Current User ===")
        
        if not self.test_tokens:
            self.log_result('auth', 'Get Current User', False, "No tokens available")
            return
            
        # Test 1: Valid token
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('GET', 'auth/me', headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'user' in data:
                self.log_result('auth', 'Get Current User - Valid Token', True, f"Retrieved user: {data['user']['name']}")
            else:
                self.log_result('auth', 'Get Current User - Valid Token', False, "Missing user in response")
        else:
            self.log_result('auth', 'Get Current User - Valid Token', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Invalid token
        headers = {'Authorization': 'Bearer invalid_token'}
        response = self.make_request('GET', 'auth/me', headers=headers)
        
        if response and response.status_code == 401:
            self.log_result('auth', 'Get Current User - Invalid Token', True, "Correctly rejected invalid token")
        else:
            self.log_result('auth', 'Get Current User - Invalid Token', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 3: No token
        response = self.make_request('GET', 'auth/me')
        
        if response and response.status_code == 401:
            self.log_result('auth', 'Get Current User - No Token', True, "Correctly rejected missing token")
        else:
            self.log_result('auth', 'Get Current User - No Token', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_logout(self):
        """Test logout endpoint"""
        print("\n=== Testing Logout ===")
        
        if not self.test_tokens:
            self.log_result('auth', 'Logout', False, "No tokens available")
            return
            
        # Test logout with valid token
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('POST', 'auth/logout', headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                self.log_result('auth', 'Logout', True, "Logout successful")
            else:
                self.log_result('auth', 'Logout', False, "Success flag not returned")
        else:
            self.log_result('auth', 'Logout', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_profile_management(self):
        """Test profile creation and retrieval"""
        print("\n=== Testing Profile Management ===")
        
        if not self.test_tokens:
            self.log_result('profile', 'Profile Management', False, "No tokens available")
            return
            
        # Test 1: Create profile for first user
        profile_data = {
            "bio": "Passionate full-stack developer with 5 years of experience in React and Node.js",
            "looksToConnect": "Looking for innovative team members for hackathon projects",
            "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Python"],
            "interests": ["AI/ML", "Web Development", "Mobile Apps", "Blockchain"],
            "experience": [
                {
                    "title": "Senior Developer",
                    "company": "Tech Startup",
                    "duration": "2 years"
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform",
                    "description": "Built a full-stack e-commerce solution",
                    "tech": ["React", "Node.js", "MongoDB"]
                }
            ],
            "preferences": {
                "desiredRoles": ["Frontend Developer", "Full-stack Developer"],
                "techStack": ["React", "Node.js"],
                "interestTags": ["Web Development", "AI"],
                "locationRadiusKm": 50,
                "remoteOk": True,
                "availabilityHrs": 25,
                "searchPeople": True,
                "searchProjects": True,
                "searchHackathons": True
            }
        }
        
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('PUT', 'profile', profile_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'profile' in data:
                self.log_result('profile', 'Create Profile', True, f"Profile created with bio: {data['profile']['bio'][:50]}...")
            else:
                self.log_result('profile', 'Create Profile', False, "Missing profile in response")
        else:
            self.log_result('profile', 'Create Profile', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Get profile
        response = self.make_request('GET', 'profile', headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'profile' in data and data['profile']:
                self.log_result('profile', 'Get Profile', True, f"Retrieved profile with {len(data['profile']['skills'])} skills")
            else:
                self.log_result('profile', 'Get Profile', False, "Profile not found or empty")
        else:
            self.log_result('profile', 'Get Profile', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 3: Create profile for second user
        profile_data_2 = {
            "bio": "Creative UI/UX designer passionate about user-centered design",
            "looksToConnect": "Seeking developers for collaborative hackathon projects",
            "skills": ["Figma", "Adobe Creative Suite", "HTML/CSS", "JavaScript"],
            "interests": ["Design Systems", "User Experience", "Frontend Development"],
            "preferences": {
                "desiredRoles": ["UI/UX Designer", "Frontend Developer"],
                "techStack": ["React", "Vue.js"],
                "searchPeople": True,
                "searchProjects": True
            }
        }
        
        if len(self.test_tokens) > 1:
            headers2 = {'Authorization': f'Bearer {self.test_tokens[1]}'}
            response = self.make_request('PUT', 'profile', profile_data_2, headers2)
            
            if response and response.status_code == 200:
                self.log_result('profile', 'Create Second Profile', True, "Second user profile created")
            else:
                self.log_result('profile', 'Create Second Profile', False, f"Status: {response.status_code if response else 'No response'}")
                
        # Test 4: Create profile for third user
        profile_data_3 = {
            "bio": "Full-stack engineer with expertise in modern web technologies",
            "skills": ["Python", "Django", "React", "PostgreSQL"],
            "interests": ["Backend Development", "DevOps", "Cloud Computing"]
        }
        
        if len(self.test_tokens) > 2:
            headers3 = {'Authorization': f'Bearer {self.test_tokens[2]}'}
            response = self.make_request('PUT', 'profile', profile_data_3, headers3)
            
            if response and response.status_code == 200:
                self.log_result('profile', 'Create Third Profile', True, "Third user profile created")
            else:
                self.log_result('profile', 'Create Third Profile', False, f"Status: {response.status_code if response else 'No response'}")
                
    def test_explore_people(self):
        """Test explore people endpoint"""
        print("\n=== Testing Explore People ===")
        
        if not self.test_tokens:
            self.log_result('explore', 'Explore People', False, "No tokens available")
            return
            
        # Test 1: Get people to swipe (authenticated)
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('GET', 'explore/people', headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'people' in data:
                people_count = len(data['people'])
                self.log_result('explore', 'Get People to Swipe', True, f"Retrieved {people_count} people")
                
                # Verify people have profiles
                people_with_profiles = sum(1 for person in data['people'] if person.get('profile'))
                if people_with_profiles > 0:
                    self.log_result('explore', 'People Have Profiles', True, f"{people_with_profiles} people have profiles")
                else:
                    self.log_result('explore', 'People Have Profiles', False, "No people have profiles")
            else:
                self.log_result('explore', 'Get People to Swipe', False, "Missing people in response")
        else:
            self.log_result('explore', 'Get People to Swipe', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Unauthenticated access
        response = self.make_request('GET', 'explore/people')
        
        if response and response.status_code == 401:
            self.log_result('explore', 'Unauthenticated Access', True, "Correctly rejected unauthenticated request")
        else:
            self.log_result('explore', 'Unauthenticated Access', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_swiping_system(self):
        """Test swiping functionality"""
        print("\n=== Testing Swiping System ===")
        
        if len(self.test_tokens) < 2:
            self.log_result('swipe', 'Swiping System', False, "Need at least 2 users for swiping tests")
            return
            
        # Get target user ID for swiping
        target_user_id = self.test_users[1]['id'] if len(self.test_users) > 1 else None
        
        if not target_user_id:
            self.log_result('swipe', 'Swiping System', False, "No target user available")
            return
            
        # Test 1: Right swipe
        swipe_data = {
            "targetType": "PERSON",
            "targetId": target_user_id,
            "direction": "RIGHT"
        }
        
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('POST', 'swipe', swipe_data, headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'swipe' in data:
                self.log_result('swipe', 'Right Swipe', True, f"Swiped right on user {target_user_id[:8]}...")
            else:
                self.log_result('swipe', 'Right Swipe', False, "Missing swipe in response")
        else:
            self.log_result('swipe', 'Right Swipe', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Duplicate swipe prevention
        response = self.make_request('POST', 'swipe', swipe_data, headers)
        
        if response and response.status_code == 400:
            self.log_result('swipe', 'Duplicate Swipe Prevention', True, "Correctly prevented duplicate swipe")
        else:
            self.log_result('swipe', 'Duplicate Swipe Prevention', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 3: Left swipe on third user
        if len(self.test_users) > 2:
            left_swipe_data = {
                "targetType": "PERSON",
                "targetId": self.test_users[2]['id'],
                "direction": "LEFT"
            }
            
            response = self.make_request('POST', 'swipe', left_swipe_data, headers)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'swipe' in data and data['swipe']['direction'] == 'LEFT':
                    self.log_result('swipe', 'Left Swipe', True, "Left swipe recorded correctly")
                else:
                    self.log_result('swipe', 'Left Swipe', False, "Swipe direction not recorded correctly")
            else:
                self.log_result('swipe', 'Left Swipe', False, f"Status: {response.status_code if response else 'No response'}")
                
        # Test 4: Reciprocal swipe to create match
        reciprocal_swipe_data = {
            "targetType": "PERSON",
            "targetId": self.test_users[0]['id'],
            "direction": "RIGHT"
        }
        
        headers2 = {'Authorization': f'Bearer {self.test_tokens[1]}'}
        response = self.make_request('POST', 'swipe', reciprocal_swipe_data, headers2)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'match' in data and data['match']:
                self.log_result('swipe', 'Match Creation', True, f"Match created: {data['match']['id'][:8]}...")
            else:
                self.log_result('swipe', 'Match Creation', False, "No match created from reciprocal swipe")
        else:
            self.log_result('swipe', 'Match Creation', False, f"Status: {response.status_code if response else 'No response'}")
            
    def test_matches_retrieval(self):
        """Test matches retrieval"""
        print("\n=== Testing Matches Retrieval ===")
        
        if not self.test_tokens:
            self.log_result('matches', 'Matches Retrieval', False, "No tokens available")
            return
            
        # Test 1: Get matches for first user
        headers = {'Authorization': f'Bearer {self.test_tokens[0]}'}
        response = self.make_request('GET', 'matches', headers=headers)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'matches' in data:
                matches_count = len(data['matches'])
                self.log_result('matches', 'Get Matches - User 1', True, f"Retrieved {matches_count} matches")
                
                # Verify match details
                if matches_count > 0:
                    match = data['matches'][0]
                    if 'otherUser' in match and match['otherUser']:
                        self.log_result('matches', 'Match Details', True, f"Match includes other user: {match['otherUser']['name']}")
                    else:
                        self.log_result('matches', 'Match Details', False, "Match missing other user details")
            else:
                self.log_result('matches', 'Get Matches - User 1', False, "Missing matches in response")
        else:
            self.log_result('matches', 'Get Matches - User 1', False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test 2: Get matches for second user
        if len(self.test_tokens) > 1:
            headers2 = {'Authorization': f'Bearer {self.test_tokens[1]}'}
            response = self.make_request('GET', 'matches', headers=headers2)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'matches' in data:
                    matches_count = len(data['matches'])
                    self.log_result('matches', 'Get Matches - User 2', True, f"Retrieved {matches_count} matches")
                else:
                    self.log_result('matches', 'Get Matches - User 2', False, "Missing matches in response")
            else:
                self.log_result('matches', 'Get Matches - User 2', False, f"Status: {response.status_code if response else 'No response'}")
                
        # Test 3: Unauthenticated access
        response = self.make_request('GET', 'matches')
        
        if response and response.status_code == 401:
            self.log_result('matches', 'Unauthenticated Matches Access', True, "Correctly rejected unauthenticated request")
        else:
            self.log_result('matches', 'Unauthenticated Matches Access', False, f"Status: {response.status_code if response else 'No response'}")
            
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Hackathon Tinder Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_logout()
        self.test_profile_management()
        self.test_explore_people()
        self.test_swiping_system()
        self.test_matches_retrieval()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            status = "✅" if failed == 0 else "❌"
            print(f"{status} {category.upper()}: {passed} passed, {failed} failed")
            
            # Print details for failed tests
            if failed > 0:
                for detail in results['details']:
                    if "❌ FAIL" in detail:
                        print(f"    {detail}")
                        
        print("-" * 60)
        print(f"TOTAL: {total_passed} passed, {total_failed} failed")
        
        if total_failed == 0:
            print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
        else:
            print(f"⚠️  {total_failed} tests failed. Please review the issues above.")
            
        return total_failed == 0

if __name__ == "__main__":
    tester = HackathonTinderTester()
    success = tester.run_all_tests()
    
    if not success:
        exit(1)