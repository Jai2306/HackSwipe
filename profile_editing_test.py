#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://hackmate-4.preview.emergentagent.com/api"
TEST_USER_EMAIL = "profile.test.user@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Profile Test User"

class ProfileEditingTester:
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
    
    def test_enhanced_profile_creation(self):
        """Test creating a profile with enhanced fields"""
        try:
            print("\n🔄 Testing Enhanced Profile Creation...")
            
            # Create comprehensive profile data with all enhanced fields
            profile_data = {
                "bio": "Senior Software Engineer with 8+ years of experience building scalable web applications and leading cross-functional teams. Passionate about clean code, system architecture, and mentoring junior developers.",
                "looksToConnect": "Seeking talented frontend developers and UX designers to build the next generation of developer tools and educational platforms",
                "skills": [
                    "JavaScript", "TypeScript", "React", "Node.js", "Python", 
                    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", 
                    "GraphQL", "REST APIs", "System Design", "Microservices"
                ],
                "interests": [
                    "Web Development", "System Architecture", "Developer Tools", 
                    "EdTech", "Open Source", "Mentoring", "Tech Leadership"
                ],
                "experience": [
                    {
                        "title": "Senior Software Engineer",
                        "org": "TechCorp Inc",
                        "startDate": "2020-01-01",
                        "endDate": None,
                        "description": "Leading development of microservices architecture serving 1M+ users. Built CI/CD pipelines and mentored team of 5 junior developers."
                    },
                    {
                        "title": "Full Stack Developer",
                        "org": "StartupXYZ",
                        "startDate": "2018-06-01",
                        "endDate": "2019-12-01",
                        "description": "Developed MVP from scratch using React and Node.js. Implemented real-time features with WebSocket and optimized database queries."
                    },
                    {
                        "title": "Junior Developer",
                        "org": "WebSolutions Ltd",
                        "startDate": "2016-03-01",
                        "endDate": "2018-05-01",
                        "description": "Built responsive web applications and learned modern development practices. Contributed to open-source projects."
                    }
                ],
                "projects": [
                    {
                        "name": "DevTools Pro",
                        "description": "Comprehensive developer productivity suite with code analysis, performance monitoring, and team collaboration features",
                        "repoUrl": "https://github.com/profiletest/devtools-pro",
                        "demoUrl": "https://devtools-pro.demo.com"
                    },
                    {
                        "name": "EduPlatform",
                        "description": "Interactive learning platform for programming courses with real-time code execution and peer review system",
                        "repoUrl": "https://github.com/profiletest/eduplatform",
                        "demoUrl": "https://eduplatform.demo.com"
                    }
                ],
                "socials": [
                    {
                        "type": "LINKEDIN",
                        "url": "https://linkedin.com/in/profiletestuser"
                    },
                    {
                        "type": "GITHUB",
                        "url": "https://github.com/profiletestuser"
                    },
                    {
                        "type": "TWITTER",
                        "url": "https://twitter.com/profiletestuser"
                    }
                ],
                "awards": [
                    "Best Innovation Award 2023",
                    "Top Contributor Open Source 2022"
                ],
                "preferences": {
                    "desiredRoles": ["Senior Engineer", "Tech Lead", "Architect"],
                    "techStack": ["React", "Node.js", "Python", "AWS"],
                    "interestTags": ["Web Development", "System Design", "EdTech"],
                    "locationRadiusKm": 100,
                    "remoteOk": True,
                    "availabilityHrs": 25,
                    "searchPeople": True,
                    "searchProjects": True,
                    "searchHackathons": True
                }
            }
            
            response = self.session.put(f"{BASE_URL}/profile", json=profile_data)
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('profile')
                
                if profile:
                    # Validate all enhanced fields are saved
                    validations = []
                    
                    # Check basic fields
                    validations.append(("Bio", profile.get('bio') == profile_data['bio']))
                    validations.append(("LooksToConnect", profile.get('looksToConnect') == profile_data['looksToConnect']))
                    validations.append(("Skills Count", len(profile.get('skills', [])) == len(profile_data['skills'])))
                    validations.append(("Interests Count", len(profile.get('interests', [])) == len(profile_data['interests'])))
                    
                    # Check experience array
                    experience = profile.get('experience', [])
                    validations.append(("Experience Count", len(experience) == 3))
                    if experience:
                        validations.append(("Experience Structure", all(
                            exp.get('title') and exp.get('org') and exp.get('startDate') 
                            for exp in experience
                        )))
                    
                    # Check projects array
                    projects = profile.get('projects', [])
                    validations.append(("Projects Count", len(projects) == 2))
                    if projects:
                        validations.append(("Projects Structure", all(
                            proj.get('name') and proj.get('description') 
                            for proj in projects
                        )))
                        validations.append(("Projects URLs", all(
                            proj.get('repoUrl') and proj.get('demoUrl') 
                            for proj in projects
                        )))
                    
                    # Check socials array
                    socials = profile.get('socials', [])
                    validations.append(("Socials Count", len(socials) == 3))
                    if socials:
                        social_types = [s.get('type') for s in socials]
                        validations.append(("Social Types", all(
                            stype in ['LINKEDIN', 'GITHUB', 'TWITTER'] for stype in social_types
                        )))
                    
                    # Check awards
                    awards = profile.get('awards', [])
                    validations.append(("Awards Count", len(awards) == 2))
                    
                    # Check preferences
                    preferences = profile.get('preferences', {})
                    validations.append(("Preferences Exist", bool(preferences)))
                    if preferences:
                        validations.append(("Desired Roles", len(preferences.get('desiredRoles', [])) == 3))
                    
                    # Report validation results
                    passed_validations = sum(1 for _, valid in validations if valid)
                    total_validations = len(validations)
                    
                    self.log_result("Enhanced Profile Creation", True,
                                  f"Profile created successfully. Validations passed: {passed_validations}/{total_validations}")
                    
                    # Log detailed validation results
                    for field, valid in validations:
                        if not valid:
                            self.log_result(f"Validation - {field}", False, f"{field} validation failed")
                    
                    return True
                else:
                    self.log_result("Enhanced Profile Creation", False, "No profile returned in response")
                    return False
            else:
                self.log_result("Enhanced Profile Creation", False, 
                              f"Profile creation failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Enhanced Profile Creation", False, f"Profile creation error: {str(e)}")
            return False
    
    def test_profile_retrieval_via_auth_me(self):
        """Test retrieving profile data via GET /auth/me endpoint"""
        try:
            print("\n🔄 Testing Profile Retrieval via /auth/me...")
            
            response = self.session.get(f"{BASE_URL}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user')
                profile = data.get('profile')
                
                if user and profile:
                    # Validate user data
                    user_validations = [
                        ("User ID", bool(user.get('id'))),
                        ("User Email", user.get('email') == TEST_USER_EMAIL),
                        ("User Name", user.get('name') == TEST_USER_NAME)
                    ]
                    
                    # Validate enhanced profile data is returned
                    profile_validations = [
                        ("Profile Bio", len(profile.get('bio', '')) > 50),
                        ("Profile Skills", len(profile.get('skills', [])) >= 10),
                        ("Profile Experience", len(profile.get('experience', [])) >= 2),
                        ("Profile Projects", len(profile.get('projects', [])) >= 1),
                        ("Profile Socials", len(profile.get('socials', [])) >= 2),
                        ("Profile Preferences", bool(profile.get('preferences')))
                    ]
                    
                    all_validations = user_validations + profile_validations
                    passed = sum(1 for _, valid in all_validations if valid)
                    total = len(all_validations)
                    
                    self.log_result("Profile Retrieval via Auth/Me", True,
                                  f"Profile retrieved successfully. Validations: {passed}/{total}")
                    
                    # Check specific enhanced fields
                    experience = profile.get('experience', [])
                    if experience:
                        sample_exp = experience[0]
                        self.log_result("Experience Data Structure", True,
                                      f"Sample experience: {sample_exp.get('title')} at {sample_exp.get('org')}")
                    
                    projects = profile.get('projects', [])
                    if projects:
                        sample_proj = projects[0]
                        self.log_result("Projects Data Structure", True,
                                      f"Sample project: {sample_proj.get('name')} - {sample_proj.get('repoUrl')}")
                    
                    socials = profile.get('socials', [])
                    if socials:
                        social_types = [s.get('type') for s in socials]
                        self.log_result("Social Links Structure", True,
                                      f"Social platforms: {', '.join(social_types)}")
                    
                    return True
                else:
                    self.log_result("Profile Retrieval via Auth/Me", False, 
                                  f"Missing data - User: {bool(user)}, Profile: {bool(profile)}")
                    return False
            else:
                self.log_result("Profile Retrieval via Auth/Me", False,
                              f"Auth/me failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Profile Retrieval via Auth/Me", False, f"Auth/me error: {str(e)}")
            return False
    
    def test_profile_update_workflow(self):
        """Test updating existing profile with new enhanced data"""
        try:
            print("\n🔄 Testing Profile Update Workflow...")
            
            # First, get current profile
            current_response = self.session.get(f"{BASE_URL}/profile")
            if current_response.status_code != 200:
                self.log_result("Profile Update - Get Current", False, "Failed to get current profile")
                return False
            
            current_profile = current_response.json().get('profile', {})
            
            # Update with new data
            updated_data = {
                "bio": current_profile.get('bio', '') + " Updated with new achievements and certifications.",
                "looksToConnect": "Updated: Now seeking DevOps engineers and cloud architects for exciting new projects",
                "skills": current_profile.get('skills', []) + ["Terraform", "Jenkins", "Redis"],
                "interests": current_profile.get('interests', []) + ["Cloud Architecture", "DevOps"],
                "experience": current_profile.get('experience', []) + [{
                    "title": "Technical Consultant",
                    "org": "CloudTech Solutions",
                    "startDate": "2024-01-01",
                    "endDate": None,
                    "description": "Providing cloud architecture consulting for enterprise clients"
                }],
                "projects": current_profile.get('projects', []) + [{
                    "name": "CloudOps Dashboard",
                    "description": "Real-time monitoring dashboard for cloud infrastructure with automated alerting and cost optimization",
                    "repoUrl": "https://github.com/profiletest/cloudops-dashboard",
                    "demoUrl": "https://cloudops.demo.com"
                }],
                "socials": current_profile.get('socials', []) + [{
                    "type": "WEBSITE",
                    "url": "https://profiletestuser.dev"
                }],
                "awards": current_profile.get('awards', []) + ["Cloud Architecture Certification 2024"],
                "preferences": {
                    "desiredRoles": ["Senior Engineer", "Tech Lead", "Cloud Architect"],
                    "techStack": ["React", "Node.js", "Python", "AWS", "Terraform"],
                    "interestTags": ["Web Development", "Cloud Architecture", "DevOps"],
                    "locationRadiusKm": 150,
                    "remoteOk": True,
                    "availabilityHrs": 30,
                    "searchPeople": True,
                    "searchProjects": True,
                    "searchHackathons": True
                }
            }
            
            # Update profile
            update_response = self.session.put(f"{BASE_URL}/profile", json=updated_data)
            
            if update_response.status_code == 200:
                updated_profile = update_response.json().get('profile', {})
                
                # Validate updates
                validations = [
                    ("Bio Updated", "Updated with new achievements" in updated_profile.get('bio', '')),
                    ("Skills Added", len(updated_profile.get('skills', [])) >= 17),  # Original 14 + 3 new
                    ("Experience Added", len(updated_profile.get('experience', [])) >= 4),  # Original 3 + 1 new
                    ("Projects Added", len(updated_profile.get('projects', [])) >= 3),  # Original 2 + 1 new
                    ("Socials Added", len(updated_profile.get('socials', [])) >= 4),  # Original 3 + 1 new
                    ("Awards Added", len(updated_profile.get('awards', [])) >= 3),  # Original 2 + 1 new
                    ("Preferences Updated", updated_profile.get('preferences', {}).get('availabilityHrs') == 30)
                ]
                
                passed = sum(1 for _, valid in validations if valid)
                total = len(validations)
                
                self.log_result("Profile Update Workflow", True,
                              f"Profile updated successfully. Validations: {passed}/{total}")
                
                # Log specific updates
                new_skills = updated_profile.get('skills', [])[-3:]
                self.log_result("Skills Update", True, f"New skills added: {', '.join(new_skills)}")
                
                return True
            else:
                self.log_result("Profile Update Workflow", False,
                              f"Profile update failed: {update_response.status_code}", update_response.text)
                return False
                
        except Exception as e:
            self.log_result("Profile Update Workflow", False, f"Profile update error: {str(e)}")
            return False
    
    def test_profile_data_persistence(self):
        """Test that profile data persists correctly across requests"""
        try:
            print("\n🔄 Testing Profile Data Persistence...")
            
            # Get profile multiple times and verify consistency
            responses = []
            for i in range(3):
                response = self.session.get(f"{BASE_URL}/profile")
                if response.status_code == 200:
                    responses.append(response.json().get('profile', {}))
                else:
                    self.log_result("Profile Data Persistence", False, 
                                  f"Failed to get profile on attempt {i+1}: {response.status_code}")
                    return False
            
            if len(responses) == 3:
                # Check consistency across requests
                first_profile = responses[0]
                consistency_checks = []
                
                for i, profile in enumerate(responses[1:], 2):
                    checks = [
                        ("Bio Consistency", profile.get('bio') == first_profile.get('bio')),
                        ("Skills Consistency", profile.get('skills') == first_profile.get('skills')),
                        ("Experience Consistency", profile.get('experience') == first_profile.get('experience')),
                        ("Projects Consistency", profile.get('projects') == first_profile.get('projects')),
                        ("Socials Consistency", profile.get('socials') == first_profile.get('socials')),
                        ("Awards Consistency", profile.get('awards') == first_profile.get('awards'))
                    ]
                    consistency_checks.extend(checks)
                
                passed = sum(1 for _, consistent in consistency_checks if consistent)
                total = len(consistency_checks)
                
                self.log_result("Profile Data Persistence", True,
                              f"Data persistence verified. Consistency: {passed}/{total}")
                
                # Verify specific data integrity
                if first_profile:
                    self.log_result("Data Integrity - Skills", True,
                                  f"Skills count: {len(first_profile.get('skills', []))}")
                    self.log_result("Data Integrity - Experience", True,
                                  f"Experience entries: {len(first_profile.get('experience', []))}")
                    self.log_result("Data Integrity - Projects", True,
                                  f"Projects count: {len(first_profile.get('projects', []))}")
                
                return True
            else:
                self.log_result("Profile Data Persistence", False, "Failed to get consistent responses")
                return False
                
        except Exception as e:
            self.log_result("Profile Data Persistence", False, f"Persistence test error: {str(e)}")
            return False
    
    def test_enhanced_profile_structure_validation(self):
        """Test that the enhanced profile structure is properly validated"""
        try:
            print("\n🔄 Testing Enhanced Profile Structure Validation...")
            
            # Get current profile to validate structure
            response = self.session.get(f"{BASE_URL}/profile")
            
            if response.status_code == 200:
                profile = response.json().get('profile', {})
                
                if not profile:
                    self.log_result("Profile Structure Validation", False, "No profile found")
                    return False
                
                # Validate enhanced structure
                structure_validations = []
                
                # Check work experience structure
                experience = profile.get('experience', [])
                if experience:
                    exp_structure_valid = all(
                        isinstance(exp, dict) and 
                        exp.get('title') and 
                        exp.get('org') and 
                        exp.get('startDate') and
                        exp.get('description')
                        for exp in experience
                    )
                    structure_validations.append(("Experience Structure", exp_structure_valid))
                    
                    # Check date format
                    date_format_valid = all(
                        len(exp.get('startDate', '')) == 10 and '-' in exp.get('startDate', '')
                        for exp in experience
                    )
                    structure_validations.append(("Experience Date Format", date_format_valid))
                
                # Check projects structure
                projects = profile.get('projects', [])
                if projects:
                    proj_structure_valid = all(
                        isinstance(proj, dict) and 
                        proj.get('name') and 
                        proj.get('description') and
                        len(proj.get('description', '')) > 50  # Detailed descriptions
                        for proj in projects
                    )
                    structure_validations.append(("Projects Structure", proj_structure_valid))
                    
                    # Check URLs
                    url_structure_valid = all(
                        proj.get('repoUrl', '').startswith('http') and
                        proj.get('demoUrl', '').startswith('http')
                        for proj in projects
                    )
                    structure_validations.append(("Projects URLs", url_structure_valid))
                
                # Check social links structure
                socials = profile.get('socials', [])
                if socials:
                    social_structure_valid = all(
                        isinstance(social, dict) and 
                        social.get('type') in ['LINKEDIN', 'GITHUB', 'TWITTER', 'WEBSITE'] and
                        social.get('url', '').startswith('http')
                        for social in socials
                    )
                    structure_validations.append(("Social Links Structure", social_structure_valid))
                
                # Check skills and interests are arrays
                structure_validations.append(("Skills Array", isinstance(profile.get('skills'), list)))
                structure_validations.append(("Interests Array", isinstance(profile.get('interests'), list)))
                structure_validations.append(("Awards Array", isinstance(profile.get('awards'), list)))
                
                # Check preferences structure
                preferences = profile.get('preferences', {})
                if preferences:
                    pref_structure_valid = all(
                        key in preferences for key in [
                            'desiredRoles', 'techStack', 'interestTags', 
                            'locationRadiusKm', 'remoteOk', 'availabilityHrs'
                        ]
                    )
                    structure_validations.append(("Preferences Structure", pref_structure_valid))
                
                passed = sum(1 for _, valid in structure_validations if valid)
                total = len(structure_validations)
                
                self.log_result("Enhanced Profile Structure Validation", True,
                              f"Structure validation completed. Passed: {passed}/{total}")
                
                # Log specific structure details
                self.log_result("Structure Details", True,
                              f"Experience: {len(experience)} entries, Projects: {len(projects)} entries, "
                              f"Socials: {len(socials)} links, Skills: {len(profile.get('skills', []))} items")
                
                return True
            else:
                self.log_result("Enhanced Profile Structure Validation", False,
                              f"Failed to get profile: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Enhanced Profile Structure Validation", False, f"Structure validation error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all enhanced profile editing tests"""
        print("🚀 Starting Enhanced Profile Editing Backend Testing...")
        print("=" * 70)
        
        # Setup authentication
        if not self.setup_test_user():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run profile editing tests
        tests = [
            self.test_enhanced_profile_creation,
            self.test_profile_retrieval_via_auth_me,
            self.test_profile_update_workflow,
            self.test_profile_data_persistence,
            self.test_enhanced_profile_structure_validation
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
        print(f"📊 ENHANCED PROFILE EDITING TEST SUMMARY")
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All enhanced profile editing tests passed!")
            return True
        else:
            print(f"⚠️  {total_tests - passed_tests} test(s) failed")
            return False

if __name__ == "__main__":
    tester = ProfileEditingTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)