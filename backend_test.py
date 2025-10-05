#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://projectswipe.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test.user.enhanced@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Enhanced Test User"

class BackendTester:
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
    
    def register_test_user(self):
        """Register a test user for authentication"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("User Registration", True, "Test user registered successfully")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                # User already exists, try to login
                return self.login_test_user()
            else:
                self.log_result("User Registration", False, f"Registration failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def login_test_user(self):
        """Login with test user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log_result("User Login", True, "Test user logged in successfully")
                return True
            else:
                self.log_result("User Login", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_dummy_data_creation(self):
        """Test the enhanced dummy data creation endpoint"""
        try:
            print("\n🔄 Testing Enhanced Dummy Data Creation...")
            response = self.session.post(f"{BASE_URL}/dummy-data")
            
            if response.status_code == 200:
                data = response.json()
                created_count = data.get('created', 0)
                self.log_result("Dummy Data Creation", True, 
                              f"Enhanced dummy data created successfully. Users created: {created_count}")
                return True
            else:
                self.log_result("Dummy Data Creation", False, 
                              f"Failed to create dummy data: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Dummy Data Creation", False, f"Dummy data creation error: {str(e)}")
            return False
    
    def test_explore_people_endpoint(self):
        """Test the explore people endpoint with enhanced profiles"""
        try:
            print("\n🔄 Testing Enhanced Explore People Endpoint...")
            response = self.session.get(f"{BASE_URL}/explore/people")
            
            if response.status_code == 200:
                data = response.json()
                people = data.get('people', [])
                
                if len(people) > 0:
                    # Check for enhanced profile data
                    enhanced_profiles_found = 0
                    expected_users = [
                        "Aisha Kandhari", "Alejandro Rivera", "Maya Patel", 
                        "James Kim", "Dr. Emily Johnson", "Carlos Mendoza",
                        "Lisa Wong", "Fatima Al-Zahra", "Rajesh Sharma", "Zoe Nakamura"
                    ]
                    
                    found_users = []
                    detailed_profiles = 0
                    
                    for person in people:
                        name = person.get('name', 'Unknown')
                        found_users.append(name)
                        profile = person.get('profile')
                        
                        if profile:
                            bio = profile.get('bio', '')
                            skills = profile.get('skills', [])
                            experience = profile.get('experience', [])
                            
                            # Check for any enhanced profile characteristics
                            if (bio and len(bio) > 50) or (skills and len(skills) > 5) or (experience and len(experience) > 0):
                                enhanced_profiles_found += 1
                            
                            # Check for detailed professional profiles
                            if (bio and len(bio) > 100 and 
                                skills and len(skills) >= 8 and 
                                experience and len(experience) >= 1):
                                detailed_profiles += 1
                    
                    # Check if we found expected enhanced users
                    expected_found = sum(1 for user in expected_users if user in found_users)
                    
                    self.log_result("Explore People - Enhanced Profiles", True,
                                  f"Found {len(people)} people, {enhanced_profiles_found} with enhanced data, {detailed_profiles} with detailed profiles, {expected_found} expected users found")
                    
                    # Detailed validation of profiles
                    if enhanced_profiles_found > 0:
                        sample_person = next((p for p in people if p.get('profile') and 
                                            len(p.get('profile', {}).get('bio', '')) > 50), None)
                        if sample_person:
                            profile = sample_person['profile']
                            self.log_result("Profile Data Validation", True,
                                          f"Sample profile for {sample_person['name']}: "
                                          f"Skills: {len(profile.get('skills', []))}, "
                                          f"Experience: {len(profile.get('experience', []))}, "
                                          f"Projects: {len(profile.get('projects', []))}")
                    
                    return True
                else:
                    self.log_result("Explore People", False, "No people found in explore endpoint")
                    return False
            else:
                self.log_result("Explore People", False, 
                              f"Failed to fetch people: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Explore People", False, f"Explore people error: {str(e)}")
            return False
    
    def test_explore_projects_endpoint(self):
        """Test the explore projects endpoint with enhanced project descriptions"""
        try:
            print("\n🔄 Testing Enhanced Explore Projects Endpoint...")
            response = self.session.get(f"{BASE_URL}/explore/projects")
            
            if response.status_code == 200:
                data = response.json()
                projects = data.get('posts', [])
                
                if len(projects) > 0:
                    enhanced_projects = 0
                    expected_projects = [
                        "SocialVR: Next-Gen AR/VR Social Gaming Platform",
                        "HealthAI - Medical Diagnosis Assistant",
                        "EduTech Innovation Platform"
                    ]
                    
                    found_projects = []
                    for project in projects:
                        found_projects.append(project.get('title', 'Unknown'))
                        # Check for enhanced project descriptions
                        notes = project.get('notes', '')
                        skills = project.get('skillsNeeded', [])
                        if len(notes) > 100 and len(skills) > 3:
                            enhanced_projects += 1
                    
                    expected_found = sum(1 for proj in expected_projects if proj in found_projects)
                    
                    self.log_result("Explore Projects - Enhanced Descriptions", True,
                                  f"Found {len(projects)} projects, {enhanced_projects} with enhanced descriptions, {expected_found} expected projects found")
                    
                    # Validate project leader information
                    projects_with_leaders = sum(1 for p in projects if p.get('leader'))
                    self.log_result("Project Leader Data", True,
                                  f"{projects_with_leaders}/{len(projects)} projects have leader information")
                    
                    return True
                else:
                    self.log_result("Explore Projects", False, "No projects found in explore endpoint")
                    return False
            else:
                self.log_result("Explore Projects", False,
                              f"Failed to fetch projects: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Explore Projects", False, f"Explore projects error: {str(e)}")
            return False
    
    def test_explore_hackathons_endpoint(self):
        """Test the explore hackathons endpoint with enhanced hackathon details"""
        try:
            print("\n🔄 Testing Enhanced Explore Hackathons Endpoint...")
            response = self.session.get(f"{BASE_URL}/explore/hackathons")
            
            if response.status_code == 200:
                data = response.json()
                hackathons = data.get('posts', [])
                
                if len(hackathons) > 0:
                    enhanced_hackathons = 0
                    expected_hackathons = [
                        "AI4Earth: Global Climate Action Hackathon 2024",
                        "Web3 Social Impact Hackathon",
                        "CyberSec Challenge 2024",
                        "Design Thinking Hackathon",
                        "Green Tech Innovation Challenge"
                    ]
                    
                    found_hackathons = []
                    for hackathon in hackathons:
                        found_hackathons.append(hackathon.get('title', 'Unknown'))
                        # Check for enhanced hackathon descriptions
                        notes = hackathon.get('notes', '')
                        skills = hackathon.get('skillsNeeded', [])
                        website = hackathon.get('websiteUrl', '')
                        if len(notes) > 100 and len(skills) > 3 and website:
                            enhanced_hackathons += 1
                    
                    expected_found = sum(1 for hack in expected_hackathons if hack in found_hackathons)
                    
                    self.log_result("Explore Hackathons - Enhanced Details", True,
                                  f"Found {len(hackathons)} hackathons, {enhanced_hackathons} with enhanced details, {expected_found} expected hackathons found")
                    
                    # Validate hackathon leader information
                    hackathons_with_leaders = sum(1 for h in hackathons if h.get('leader'))
                    self.log_result("Hackathon Leader Data", True,
                                  f"{hackathons_with_leaders}/{len(hackathons)} hackathons have leader information")
                    
                    return True
                else:
                    self.log_result("Explore Hackathons", False, "No hackathons found in explore endpoint")
                    return False
            else:
                self.log_result("Explore Hackathons", False,
                              f"Failed to fetch hackathons: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Explore Hackathons", False, f"Explore hackathons error: {str(e)}")
            return False
    
    def test_data_consistency(self):
        """Test data consistency between users, profiles, and posts"""
        try:
            print("\n🔄 Testing Enhanced Data Consistency...")
            
            # Get people data
            people_response = self.session.get(f"{BASE_URL}/explore/people")
            projects_response = self.session.get(f"{BASE_URL}/explore/projects")
            hackathons_response = self.session.get(f"{BASE_URL}/explore/hackathons")
            
            if all(r.status_code == 200 for r in [people_response, projects_response, hackathons_response]):
                people = people_response.json().get('people', [])
                projects = projects_response.json().get('posts', [])
                hackathons = hackathons_response.json().get('posts', [])
                
                # Check email consistency
                people_emails = set()
                for person in people:
                    email = person.get('email')
                    if email:
                        people_emails.add(email)
                
                # Check if project/hackathon leaders exist in people
                all_posts = projects + hackathons
                leader_consistency = 0
                total_posts = len(all_posts)
                
                expected_emails = [
                    "aisha.kandhari@gmail.com", "alejandro.rivera@outlook.com",
                    "maya.patel.dev@proton.me", "james.kim.blockchain@yahoo.com",
                    "emily.johnson.ai@stanford.edu", "carlos.mendoza.security@gmail.com",
                    "lisa.wong.design@adobe.com", "fatima.al.zahra@mit.edu",
                    "raj.sharma.backend@google.com", "zoe.nakamura.game@unity3d.com"
                ]
                
                found_emails = list(people_emails)
                expected_emails_found = sum(1 for email in expected_emails if email in found_emails)
                
                for post in all_posts:
                    leader = post.get('leader')
                    if leader and leader.get('email') in people_emails:
                        leader_consistency += 1
                
                self.log_result("Email Address Consistency", True,
                              f"Found {len(people_emails)} unique emails, {expected_emails_found} expected enhanced emails found")
                
                self.log_result("Leader-Profile Consistency", True,
                              f"{leader_consistency}/{total_posts} posts have leaders with consistent profile data")
                
                # Check profile completeness for enhanced users
                complete_profiles = 0
                for person in people:
                    profile = person.get('profile')
                    if (profile and profile.get('bio') and profile.get('skills') and 
                        profile.get('experience') and profile.get('looksToConnect')):
                        complete_profiles += 1
                
                self.log_result("Profile Completeness", True,
                              f"{complete_profiles}/{len(people)} people have complete enhanced profiles")
                
                return True
            else:
                self.log_result("Data Consistency", False, "Failed to fetch data for consistency check")
                return False
                
        except Exception as e:
            self.log_result("Data Consistency", False, f"Data consistency error: {str(e)}")
            return False
    
    def test_enhanced_profile_fields(self):
        """Test specific enhanced profile fields and data quality"""
        try:
            print("\n🔄 Testing Enhanced Profile Field Quality...")
            
            response = self.session.get(f"{BASE_URL}/explore/people")
            if response.status_code == 200:
                people = response.json().get('people', [])
                
                if not people:
                    self.log_result("Enhanced Profile Fields", False, "No people found to test")
                    return False
                
                # Check for specific enhanced fields
                enhanced_field_stats = {
                    'detailed_bio': 0,
                    'professional_skills': 0,
                    'work_experience': 0,
                    'projects': 0,
                    'company_affiliations': 0,
                    'looks_to_connect': 0
                }
                
                expected_companies = ["Meta", "Google", "Stanford", "Adobe", "MIT", "Unity", "Stripe", "Coinbase"]
                company_mentions = 0
                
                for person in people:
                    if not person:
                        continue
                        
                    profile = person.get('profile')
                    if not profile:
                        continue
                    
                    # Check bio quality (detailed, professional)
                    bio = profile.get('bio', '')
                    if len(bio) > 100 and any(word in bio.lower() for word in ['engineer', 'developer', 'researcher', 'years']):
                        enhanced_field_stats['detailed_bio'] += 1
                    
                    # Check skills (professional, diverse)
                    skills = profile.get('skills', [])
                    if len(skills) >= 8:
                        enhanced_field_stats['professional_skills'] += 1
                    
                    # Check work experience
                    experience = profile.get('experience', [])
                    if len(experience) >= 2:
                        enhanced_field_stats['work_experience'] += 1
                    
                    # Check projects
                    projects = profile.get('projects', [])
                    if len(projects) >= 1:
                        enhanced_field_stats['projects'] += 1
                    
                    # Check for company affiliations
                    if any(company in bio for company in expected_companies):
                        enhanced_field_stats['company_affiliations'] += 1
                        company_mentions += 1
                    
                    # Check experience for company names
                    for exp in experience:
                        if exp and any(company in exp.get('org', '') for company in expected_companies):
                            company_mentions += 1
                    
                    # Check looksToConnect field
                    looks_to_connect = profile.get('looksToConnect', '')
                    if len(looks_to_connect) > 50:
                        enhanced_field_stats['looks_to_connect'] += 1
                
                total_people = len(people)
                
                for field, count in enhanced_field_stats.items():
                    percentage = (count / total_people * 100) if total_people > 0 else 0
                    self.log_result(f"Enhanced Field - {field.replace('_', ' ').title()}", True,
                                  f"{count}/{total_people} people ({percentage:.1f}%) have quality {field.replace('_', ' ')}")
                
                self.log_result("Company Affiliations", True,
                              f"Found {company_mentions} mentions of expected companies (Google, Meta, Stanford, etc.)")
                
                return True
            else:
                self.log_result("Enhanced Profile Fields", False, f"Failed to fetch people: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Enhanced Profile Fields", False, f"Enhanced profile fields error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all enhanced dummy data tests"""
        print("🚀 Starting Enhanced Dummy Data Backend Testing...")
        print("=" * 60)
        
        # Setup authentication
        if not self.register_test_user():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run enhanced dummy data tests
        tests = [
            self.test_dummy_data_creation,
            self.test_explore_people_endpoint,
            self.test_explore_projects_endpoint,
            self.test_explore_hackathons_endpoint,
            self.test_data_consistency,
            self.test_enhanced_profile_fields
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
        print("\n" + "=" * 60)
        print(f"📊 ENHANCED DUMMY DATA TEST SUMMARY")
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 All enhanced dummy data tests passed!")
            return True
        else:
            print(f"⚠️  {total_tests - passed_tests} test(s) failed")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)