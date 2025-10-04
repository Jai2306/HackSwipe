#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://hackmate-4.preview.emergentagent.com/api"
TEST_USER_EMAIL = "api.test.user@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "API Test User"

class APIEndpointsTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
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
    
    def setup_test_user(self):
        """Register and login test user"""
        try:
            # Try to register
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("User Setup", True, "Test user registered successfully")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                # User exists, try login
                login_response = self.session.post(f"{BASE_URL}/auth/login", json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                })
                
                if login_response.status_code == 200:
                    data = login_response.json()
                    self.auth_token = data.get('token')
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_result("User Setup", True, "Test user logged in successfully")
                    return True
                else:
                    self.log_result("User Setup", False, f"Login failed: {login_response.status_code}")
                    return False
            else:
                self.log_result("User Setup", False, f"Registration failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("User Setup", False, f"Setup error: {str(e)}")
            return False
    
    def test_put_profile_endpoint(self):
        """Test PUT /api/profile endpoint with enhanced fields"""
        try:
            print("\n🔄 Testing PUT /api/profile endpoint...")
            
            # Test data with all enhanced fields from review request
            profile_data = {
                "bio": "Experienced software architect with expertise in distributed systems and cloud technologies. Passionate about building scalable solutions and leading high-performing engineering teams.",
                "looksToConnect": "Seeking talented engineers and product managers to build revolutionary fintech solutions",
                "skills": [
                    "JavaScript", "TypeScript", "Python", "Go", "React", "Node.js", 
                    "PostgreSQL", "MongoDB", "Redis", "AWS", "Docker", "Kubernetes",
                    "Microservices", "System Design", "GraphQL", "REST APIs"
                ],
                "interests": [
                    "Fintech", "Distributed Systems", "Cloud Architecture", "Team Leadership",
                    "Open Source", "Developer Experience", "System Performance"
                ],
                # Work experience with all required fields
                "experience": [
                    {
                        "title": "Principal Software Architect",
                        "org": "FinTech Innovations Inc",
                        "startDate": "2021-03-01",
                        "endDate": None,
                        "description": "Leading architecture design for payment processing systems handling $1B+ transactions. Managing team of 15 engineers across 3 time zones."
                    },
                    {
                        "title": "Senior Backend Engineer",
                        "org": "CloudScale Technologies",
                        "startDate": "2018-07-01",
                        "endDate": "2021-02-28",
                        "description": "Built microservices architecture serving 10M+ users. Implemented event-driven systems with 99.99% uptime."
                    },
                    {
                        "title": "Software Engineer",
                        "org": "StartupHub",
                        "startDate": "2016-01-01",
                        "endDate": "2018-06-30",
                        "description": "Full-stack development using React and Node.js. Contributed to product growth from 0 to 1M users."
                    }
                ],
                # Projects with name, description, repoUrl, demoUrl
                "projects": [
                    {
                        "name": "PaymentFlow Engine",
                        "description": "High-performance payment processing engine with real-time fraud detection, multi-currency support, and comprehensive analytics dashboard",
                        "repoUrl": "https://github.com/apitest/paymentflow-engine",
                        "demoUrl": "https://paymentflow.demo.com"
                    },
                    {
                        "name": "CloudOps Monitoring",
                        "description": "Comprehensive cloud infrastructure monitoring solution with automated scaling, cost optimization, and predictive analytics",
                        "repoUrl": "https://github.com/apitest/cloudops-monitoring",
                        "demoUrl": "https://cloudops-monitor.demo.com"
                    },
                    {
                        "name": "DevTools Suite",
                        "description": "Developer productivity toolkit with code analysis, performance profiling, and team collaboration features",
                        "repoUrl": "https://github.com/apitest/devtools-suite",
                        "demoUrl": "https://devtools.demo.com"
                    }
                ],
                # Social links (LinkedIn, GitHub)
                "socials": [
                    {
                        "type": "LINKEDIN",
                        "url": "https://linkedin.com/in/apitestuser"
                    },
                    {
                        "type": "GITHUB",
                        "url": "https://github.com/apitestuser"
                    },
                    {
                        "type": "TWITTER",
                        "url": "https://twitter.com/apitestuser"
                    },
                    {
                        "type": "WEBSITE",
                        "url": "https://apitestuser.dev"
                    }
                ],
                "awards": [
                    "Best Architecture Design Award 2023",
                    "Top Open Source Contributor 2022",
                    "Innovation Excellence Award 2021"
                ],
                "preferences": {
                    "desiredRoles": ["Principal Engineer", "Engineering Manager", "CTO"],
                    "techStack": ["Python", "Go", "React", "AWS", "Kubernetes"],
                    "interestTags": ["Fintech", "Cloud Architecture", "Team Leadership"],
                    "locationRadiusKm": 200,
                    "remoteOk": True,
                    "availabilityHrs": 35,
                    "searchPeople": True,
                    "searchProjects": True,
                    "searchHackathons": True
                }
            }
            
            # Make PUT request
            response = self.session.put(f"{BASE_URL}/profile", json=profile_data)
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('profile')
                
                if profile:
                    # Validate all enhanced fields are properly saved
                    validations = []
                    
                    # Basic fields
                    validations.append(("Bio Field", profile.get('bio') == profile_data['bio']))
                    validations.append(("LooksToConnect Field", profile.get('looksToConnect') == profile_data['looksToConnect']))
                    
                    # Arrays
                    validations.append(("Skills Array", len(profile.get('skills', [])) == len(profile_data['skills'])))
                    validations.append(("Interests Array", len(profile.get('interests', [])) == len(profile_data['interests'])))
                    validations.append(("Awards Array", len(profile.get('awards', [])) == len(profile_data['awards'])))
                    
                    # Work experience validation
                    experience = profile.get('experience', [])
                    validations.append(("Experience Count", len(experience) == 3))
                    if experience:
                        exp_fields_valid = all(
                            exp.get('title') and exp.get('org') and 
                            exp.get('startDate') and exp.get('description')
                            for exp in experience
                        )
                        validations.append(("Experience Fields", exp_fields_valid))
                        
                        # Check specific experience data
                        principal_exp = next((e for e in experience if e.get('title') == 'Principal Software Architect'), None)
                        validations.append(("Principal Role Saved", bool(principal_exp)))
                    
                    # Projects validation
                    projects = profile.get('projects', [])
                    validations.append(("Projects Count", len(projects) == 3))
                    if projects:
                        proj_fields_valid = all(
                            proj.get('name') and proj.get('description') and
                            proj.get('repoUrl') and proj.get('demoUrl')
                            for proj in projects
                        )
                        validations.append(("Projects Fields", proj_fields_valid))
                        
                        # Check specific project
                        payment_proj = next((p for p in projects if p.get('name') == 'PaymentFlow Engine'), None)
                        validations.append(("PaymentFlow Project Saved", bool(payment_proj)))
                    
                    # Social links validation
                    socials = profile.get('socials', [])
                    validations.append(("Socials Count", len(socials) == 4))
                    if socials:
                        social_types = [s.get('type') for s in socials]
                        validations.append(("LinkedIn Social", 'LINKEDIN' in social_types))
                        validations.append(("GitHub Social", 'GITHUB' in social_types))
                        
                        # Check URLs
                        linkedin_social = next((s for s in socials if s.get('type') == 'LINKEDIN'), None)
                        validations.append(("LinkedIn URL", linkedin_social and linkedin_social.get('url') == 'https://linkedin.com/in/apitestuser'))
                    
                    # Preferences validation
                    preferences = profile.get('preferences', {})
                    validations.append(("Preferences Exist", bool(preferences)))
                    if preferences:
                        validations.append(("Desired Roles", len(preferences.get('desiredRoles', [])) == 3))
                        validations.append(("Tech Stack", len(preferences.get('techStack', [])) == 5))
                    
                    # Count passed validations
                    passed = sum(1 for _, valid in validations if valid)
                    total = len(validations)
                    
                    self.log_result("PUT /api/profile Endpoint", True,
                                  f"Profile saved successfully. Validations: {passed}/{total}")
                    
                    # Log failed validations
                    for field, valid in validations:
                        if not valid:
                            self.log_result(f"Validation Failed - {field}", False, f"{field} validation failed")
                    
                    return True
                else:
                    self.log_result("PUT /api/profile Endpoint", False, "No profile returned in response")
                    return False
            else:
                self.log_result("PUT /api/profile Endpoint", False,
                              f"PUT request failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("PUT /api/profile Endpoint", False, f"PUT profile error: {str(e)}")
            return False
    
    def test_get_auth_me_endpoint(self):
        """Test GET /api/auth/me endpoint returns enhanced profile data"""
        try:
            print("\n🔄 Testing GET /api/auth/me endpoint...")
            
            response = self.session.get(f"{BASE_URL}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user')
                profile = data.get('profile')
                
                if user and profile:
                    # Validate user information
                    user_validations = [
                        ("User ID Present", bool(user.get('id'))),
                        ("User Email", user.get('email') == TEST_USER_EMAIL),
                        ("User Name", user.get('name') == TEST_USER_NAME),
                        ("No Password Hash", 'passwordHash' not in user)
                    ]
                    
                    # Validate enhanced profile data is returned
                    profile_validations = [
                        ("Profile Bio", bool(profile.get('bio'))),
                        ("Profile Skills", len(profile.get('skills', [])) > 10),
                        ("Profile Interests", len(profile.get('interests', [])) > 5),
                        ("Profile Experience", len(profile.get('experience', [])) >= 3),
                        ("Profile Projects", len(profile.get('projects', [])) >= 3),
                        ("Profile Socials", len(profile.get('socials', [])) >= 4),
                        ("Profile Awards", len(profile.get('awards', [])) >= 3),
                        ("Profile Preferences", bool(profile.get('preferences')))
                    ]
                    
                    # Validate enhanced structure
                    structure_validations = []
                    
                    # Work experience structure
                    experience = profile.get('experience', [])
                    if experience:
                        exp_structure = all(
                            exp.get('title') and exp.get('org') and 
                            exp.get('startDate') and exp.get('description')
                            for exp in experience
                        )
                        structure_validations.append(("Experience Structure", exp_structure))
                    
                    # Projects structure
                    projects = profile.get('projects', [])
                    if projects:
                        proj_structure = all(
                            proj.get('name') and proj.get('description') and
                            proj.get('repoUrl') and proj.get('demoUrl')
                            for proj in projects
                        )
                        structure_validations.append(("Projects Structure", proj_structure))
                    
                    # Social links structure
                    socials = profile.get('socials', [])
                    if socials:
                        social_structure = all(
                            social.get('type') and social.get('url')
                            for social in socials
                        )
                        structure_validations.append(("Socials Structure", social_structure))
                    
                    all_validations = user_validations + profile_validations + structure_validations
                    passed = sum(1 for _, valid in all_validations if valid)
                    total = len(all_validations)
                    
                    self.log_result("GET /api/auth/me Endpoint", True,
                                  f"Enhanced profile data retrieved. Validations: {passed}/{total}")
                    
                    # Log specific enhanced data
                    self.log_result("Enhanced Data Details", True,
                                  f"Experience: {len(experience)} entries, Projects: {len(projects)} entries, "
                                  f"Socials: {len(socials)} links, Skills: {len(profile.get('skills', []))} items")
                    
                    return True
                else:
                    self.log_result("GET /api/auth/me Endpoint", False,
                                  f"Missing data - User: {bool(user)}, Profile: {bool(profile)}")
                    return False
            else:
                self.log_result("GET /api/auth/me Endpoint", False,
                              f"GET request failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/auth/me Endpoint", False, f"GET auth/me error: {str(e)}")
            return False
    
    def test_enhanced_profile_structure_handling(self):
        """Test that enhanced profile structure handles multiple entries correctly"""
        try:
            print("\n🔄 Testing Enhanced Profile Structure Handling...")
            
            # Get current profile
            response = self.session.get(f"{BASE_URL}/profile")
            
            if response.status_code == 200:
                profile = response.json().get('profile', {})
                
                if not profile:
                    self.log_result("Enhanced Profile Structure", False, "No profile found")
                    return False
                
                # Test multiple work experience entries
                experience = profile.get('experience', [])
                experience_tests = [
                    ("Multiple Experience Entries", len(experience) >= 3),
                    ("Experience Title Fields", all(exp.get('title') for exp in experience)),
                    ("Experience Org Fields", all(exp.get('org') for exp in experience)),
                    ("Experience Start Dates", all(exp.get('startDate') for exp in experience)),
                    ("Experience Descriptions", all(exp.get('description') for exp in experience))
                ]
                
                # Test multiple projects
                projects = profile.get('projects', [])
                project_tests = [
                    ("Multiple Project Entries", len(projects) >= 3),
                    ("Project Names", all(proj.get('name') for proj in projects)),
                    ("Project Descriptions", all(len(proj.get('description', '')) > 50 for proj in projects)),
                    ("Project Repo URLs", all(proj.get('repoUrl', '').startswith('http') for proj in projects)),
                    ("Project Demo URLs", all(proj.get('demoUrl', '').startswith('http') for proj in projects))
                ]
                
                # Test social media links array
                socials = profile.get('socials', [])
                social_tests = [
                    ("Multiple Social Links", len(socials) >= 4),
                    ("LinkedIn Present", any(s.get('type') == 'LINKEDIN' for s in socials)),
                    ("GitHub Present", any(s.get('type') == 'GITHUB' for s in socials)),
                    ("Social URLs Valid", all(s.get('url', '').startswith('http') for s in socials))
                ]
                
                # Test extended skills/interests arrays
                skills = profile.get('skills', [])
                interests = profile.get('interests', [])
                array_tests = [
                    ("Extended Skills Array", len(skills) >= 15),
                    ("Extended Interests Array", len(interests) >= 7),
                    ("Skills Are Strings", all(isinstance(skill, str) for skill in skills)),
                    ("Interests Are Strings", all(isinstance(interest, str) for interest in interests))
                ]
                
                all_tests = experience_tests + project_tests + social_tests + array_tests
                passed = sum(1 for _, valid in all_tests if valid)
                total = len(all_tests)
                
                self.log_result("Enhanced Profile Structure Handling", True,
                              f"Structure handling validated. Passed: {passed}/{total}")
                
                # Log specific structure details
                if experience:
                    sample_exp = experience[0]
                    self.log_result("Sample Experience Entry", True,
                                  f"{sample_exp.get('title')} at {sample_exp.get('org')} ({sample_exp.get('startDate')})")
                
                if projects:
                    sample_proj = projects[0]
                    self.log_result("Sample Project Entry", True,
                                  f"{sample_proj.get('name')} - {sample_proj.get('repoUrl')}")
                
                if socials:
                    social_types = [s.get('type') for s in socials]
                    self.log_result("Social Platforms", True, f"Available: {', '.join(social_types)}")
                
                return True
            else:
                self.log_result("Enhanced Profile Structure Handling", False,
                              f"Failed to get profile: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Enhanced Profile Structure Handling", False, f"Structure handling error: {str(e)}")
            return False
    
    def test_api_response_validation(self):
        """Test that API responses properly include all new fields"""
        try:
            print("\n🔄 Testing API Response Validation...")
            
            # Test both profile endpoints return consistent data
            profile_response = self.session.get(f"{BASE_URL}/profile")
            auth_me_response = self.session.get(f"{BASE_URL}/auth/me")
            
            if profile_response.status_code == 200 and auth_me_response.status_code == 200:
                profile_data = profile_response.json().get('profile', {})
                auth_me_profile = auth_me_response.json().get('profile', {})
                
                # Validate both responses have the same profile data
                consistency_tests = [
                    ("Bio Consistency", profile_data.get('bio') == auth_me_profile.get('bio')),
                    ("Skills Consistency", profile_data.get('skills') == auth_me_profile.get('skills')),
                    ("Experience Consistency", profile_data.get('experience') == auth_me_profile.get('experience')),
                    ("Projects Consistency", profile_data.get('projects') == auth_me_profile.get('projects')),
                    ("Socials Consistency", profile_data.get('socials') == auth_me_profile.get('socials')),
                    ("Awards Consistency", profile_data.get('awards') == auth_me_profile.get('awards')),
                    ("Preferences Consistency", profile_data.get('preferences') == auth_me_profile.get('preferences'))
                ]
                
                # Validate all enhanced fields are present in responses
                required_fields = ['bio', 'looksToConnect', 'skills', 'interests', 'experience', 
                                 'projects', 'socials', 'awards', 'preferences']
                
                field_presence_tests = []
                for field in required_fields:
                    field_presence_tests.append((f"{field} in Profile Response", field in profile_data))
                    field_presence_tests.append((f"{field} in Auth/Me Response", field in auth_me_profile))
                
                all_tests = consistency_tests + field_presence_tests
                passed = sum(1 for _, valid in all_tests if valid)
                total = len(all_tests)
                
                self.log_result("API Response Validation", True,
                              f"Response validation completed. Passed: {passed}/{total}")
                
                # Validate response structure
                if profile_data:
                    self.log_result("Response Structure", True,
                                  f"Profile response contains {len(profile_data.keys())} fields")
                
                return True
            else:
                self.log_result("API Response Validation", False,
                              f"Failed to get responses - Profile: {profile_response.status_code}, "
                              f"Auth/Me: {auth_me_response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("API Response Validation", False, f"Response validation error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API endpoint tests"""
        print("🚀 Starting Enhanced Profile API Endpoints Testing...")
        print("=" * 70)
        
        # Setup authentication
        if not self.setup_test_user():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run API endpoint tests
        tests = [
            self.test_put_profile_endpoint,
            self.test_get_auth_me_endpoint,
            self.test_enhanced_profile_structure_handling,
            self.test_api_response_validation
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
        print(f"📊 ENHANCED PROFILE API ENDPOINTS TEST SUMMARY")
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All enhanced profile API endpoint tests passed!")
            return True
        else:
            print(f"⚠️  {total_tests - passed_tests} test(s) failed")
            return False

if __name__ == "__main__":
    tester = APIEndpointsTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)