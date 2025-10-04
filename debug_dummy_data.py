#!/usr/bin/env python3

import requests
import json

BASE_URL = "https://hackmate-4.preview.emergentagent.com/api"

def debug_dummy_data():
    # Register a new user
    import time
    timestamp = int(time.time())
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": f"debug.user.{timestamp}@example.com",
        "password": "debugpass123",
        "name": f"Debug User {timestamp}"
    })
    
    if response.status_code == 200:
        token = response.json().get('token')
        headers = {'Authorization': f'Bearer {token}'}
        
        print("🔍 Debugging Dummy Data Creation...")
        
        # Create dummy data
        print("\n1. Creating dummy data...")
        dummy_response = requests.post(f"{BASE_URL}/dummy-data", headers=headers)
        print(f"Dummy data response: {dummy_response.status_code} - {dummy_response.text}")
        
        # Check people
        print("\n2. Checking people...")
        people_response = requests.get(f"{BASE_URL}/explore/people", headers=headers)
        if people_response.status_code == 200:
            people = people_response.json().get('people', [])
            print(f"Found {len(people)} people:")
            
            expected_names = ["Aisha Kandhari", "Alejandro Rivera", "Maya Patel", "James Kim", "Dr. Emily Johnson"]
            
            for person in people:
                name = person.get('name', 'Unknown')
                email = person.get('email', 'No email')
                profile = person.get('profile')
                
                bio_length = len(profile.get('bio', '')) if profile else 0
                skills_count = len(profile.get('skills', [])) if profile else 0
                exp_count = len(profile.get('experience', [])) if profile else 0
                
                is_enhanced = name in expected_names
                marker = "🌟" if is_enhanced else "  "
                
                print(f"{marker} {name} ({email}) - Bio: {bio_length} chars, Skills: {skills_count}, Experience: {exp_count}")
        
        # Check projects
        print("\n3. Checking projects...")
        projects_response = requests.get(f"{BASE_URL}/explore/projects", headers=headers)
        if projects_response.status_code == 200:
            projects = projects_response.json().get('posts', [])
            print(f"Found {len(projects)} projects:")
            
            expected_projects = ["SocialVR", "HealthAI", "EduTech"]
            
            for project in projects:
                title = project.get('title', 'Unknown')
                notes_length = len(project.get('notes', ''))
                skills_count = len(project.get('skillsNeeded', []))
                leader = project.get('leader', {})
                leader_name = leader.get('name', 'No leader') if leader else 'No leader'
                
                is_enhanced = any(exp in title for exp in expected_projects)
                marker = "🌟" if is_enhanced else "  "
                
                print(f"{marker} {title} - Notes: {notes_length} chars, Skills: {skills_count}, Leader: {leader_name}")
        
        # Check hackathons
        print("\n4. Checking hackathons...")
        hackathons_response = requests.get(f"{BASE_URL}/explore/hackathons", headers=headers)
        if hackathons_response.status_code == 200:
            hackathons = hackathons_response.json().get('posts', [])
            print(f"Found {len(hackathons)} hackathons:")
            
            expected_hackathons = ["AI4Earth", "Web3 Social Impact", "CyberSec Challenge"]
            
            for hackathon in hackathons:
                title = hackathon.get('title', 'Unknown')
                notes_length = len(hackathon.get('notes', ''))
                skills_count = len(hackathon.get('skillsNeeded', []))
                website = hackathon.get('websiteUrl', '')
                leader = hackathon.get('leader', {})
                leader_name = leader.get('name', 'No leader') if leader else 'No leader'
                
                is_enhanced = any(exp in title for exp in expected_hackathons)
                marker = "🌟" if is_enhanced else "  "
                
                print(f"{marker} {title} - Notes: {notes_length} chars, Skills: {skills_count}, Website: {bool(website)}, Leader: {leader_name}")
    
    else:
        print(f"Failed to register debug user: {response.status_code}")

if __name__ == "__main__":
    debug_dummy_data()