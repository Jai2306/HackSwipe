'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, X, Compass, MessageCircle, BarChart3, User, Bell, Plus, 
  Github, Linkedin, ExternalLink, MapPin, Code, Award,
  Building, Send, Users, Search, Target,
  Briefcase, Star, Mail, TrendingUp, Undo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Available skills and interests
const SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript', 'C++', 'Go',
  'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'Redis', 'Firebase',
  'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science', 'DevOps'
];

const INTERESTS = [
  'AI/ML', 'FinTech', 'EdTech', 'Social Impact', 'Gaming', 'AR/VR', 'IoT',
  'Cybersecurity', 'Mobile Development', 'Web Development', 'Data Science',
  'Web3', 'Blockchain', 'Healthcare', 'E-commerce', 'Climate Tech'
];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [exploreTab, setExploreTab] = useState('people');
  const [authMode, setAuthMode] = useState('login');
  const [people, setPeople] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [matches, setMatches] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [currentHackathonIndex, setCurrentHackathonIndex] = useState(0);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  // Undo functionality state
  const [lastRejectedPerson, setLastRejectedPerson] = useState(null);
  const [lastRejectedHackathon, setLastRejectedHackathon] = useState(null);
  const [lastRejectedProject, setLastRejectedProject] = useState(null);
  const [showUndo, setShowUndo] = useState({ people: false, hackathons: false, projects: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [overviewStats, setOverviewStats] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loginStreak, setLoginStreak] = useState(0);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showGroupChatDialog, setShowGroupChatDialog] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [showEditPostDialog, setShowEditPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // Onboarding form states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [profileData, setProfileData] = useState({
    bio: '',
    looksToConnect: '',
    skills: [],
    interests: [],
    experience: [],
    projects: [],
    awards: [],
    socials: [],
    preferences: {
      desiredRoles: [],
      techStack: [],
      interestTags: [],
      locationRadiusKm: 50,
      remoteOk: true,
      availabilityHrs: 20,
      searchPeople: true,
      searchProjects: true,
      searchHackathons: true
    }
  });

  // Post form states
  const [postData, setPostData] = useState({
    type: 'HACKATHON',
    title: '',
    location: '',
    websiteUrl: '',
    skillsNeeded: [],
    notes: ''
  });

  // Check authentication on load
  useEffect(() => {
    checkAuth();
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Initialize dummy data
  useEffect(() => {
    if (user && profile) {
      initializeDummyData();
    }
  }, [user, profile]);

  const initializeDummyData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Create dummy data via API
      await fetch('/api/dummy-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error initializing dummy data:', error);
    }
  };

  // Removed auto-login to prevent duplicate demo users

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfile(data.profile);
        
        if (!data.profile) {
          setShowOnboarding(true);
        } else {
          loadAppData();
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login' 
        ? { email, password }
        : { email, password, name };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setProfile(null);
        setShowOnboarding(true);
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setActiveTab('explore');
  };

  const loadAppData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Load all data in parallel
      const [
        peopleResponse,
        hackathonsResponse,
        projectsResponse,
        matchesResponse,
        inquiriesResponse,
        conversationsResponse,
        overviewResponse
      ] = await Promise.all([
        fetch('/api/explore/people', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/explore/hackathons', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/explore/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/matches', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/inquiries', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        setPeople(peopleData.people || []);
      }

      if (hackathonsResponse.ok) {
        const hackathonData = await hackathonsResponse.json();
        setHackathons(hackathonData.posts || []);
      }

      if (projectsResponse.ok) {
        const projectData = await projectsResponse.json();
        setProjects(projectData.posts || []);
      }

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);
      }

      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        setInquiries(inquiriesData.inquiries || []);
      }

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData.conversations || []);
      }

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverviewStats(overviewData.stats || {});
      }

      // Load user's own posts
      const userPostsResponse = await fetch('/api/posts/my-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userPostsResponse.ok) {
        const userPostsData = await userPostsResponse.json();
        setUserPosts(userPostsData.posts || []);
      }

      // Load notifications and streaks
      const notificationsResponse = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
      }

      const streakResponse = await fetch('/api/streak', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        setLoginStreak(streakData.streak || 0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSwipe = async (direction, type = 'PERSON') => {
    let targetId, index, currentItem;
    
    if (type === 'PERSON') {
      targetId = people[currentPersonIndex]?.id;
      index = currentPersonIndex;
      currentItem = people[currentPersonIndex];
    } else if (type === 'HACKATHON') {
      targetId = hackathons[currentHackathonIndex]?.id;
      index = currentHackathonIndex;
      currentItem = hackathons[currentHackathonIndex];
    } else if (type === 'PROJECT') {
      targetId = projects[currentProjectIndex]?.id;
      index = currentProjectIndex;
      currentItem = projects[currentProjectIndex];
    }

    // Set swipe direction for animation
    setSwipeDirection(direction);

    // Store rejected item for undo functionality
    if (direction === 'left' && currentItem) {
      if (type === 'PERSON') {
        setLastRejectedPerson({ ...currentItem, index: currentPersonIndex });
        setShowUndo(prev => ({ ...prev, people: true }));
        // Auto-hide undo after 3 seconds
        setTimeout(() => setShowUndo(prev => ({ ...prev, people: false })), 3000);
      } else if (type === 'HACKATHON') {
        setLastRejectedHackathon({ ...currentItem, index: currentHackathonIndex });
        setShowUndo(prev => ({ ...prev, hackathons: true }));
        setTimeout(() => setShowUndo(prev => ({ ...prev, hackathons: false })), 3000);
      } else if (type === 'PROJECT') {
        setLastRejectedProject({ ...currentItem, index: currentProjectIndex });
        setShowUndo(prev => ({ ...prev, projects: true }));
        setTimeout(() => setShowUndo(prev => ({ ...prev, projects: false })), 3000);
      }
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId,
          direction,
          type
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.match) {
          setMatches(prev => [...prev, data.match]);
        }

        // Wait for animation to complete before moving to next item
        setTimeout(() => {
          // Move to next item
          if (type === 'PERSON') {
            setCurrentPersonIndex(prev => prev + 1);
          } else if (type === 'HACKATHON') {
            setCurrentHackathonIndex(prev => prev + 1);
          } else if (type === 'PROJECT') {
            setCurrentProjectIndex(prev => prev + 1);
          }
          // Reset swipe direction
          setSwipeDirection(null);
        }, 300);
      }
    } catch (error) {
      console.error('Swipe error:', error);
      setSwipeDirection(null);
    }
  };

  // Undo functionality with smooth animation
  const handleUndo = (type) => {
    if (type === 'PERSON' && lastRejectedPerson) {
      // Set swipe direction to 'undo' for left-to-right animation
      setSwipeDirection('undo');
      setCurrentPersonIndex(lastRejectedPerson.index);
      setLastRejectedPerson(null);
      setShowUndo(prev => ({ ...prev, people: false }));
      // Clear animation after it completes
      setTimeout(() => setSwipeDirection(null), 500);
    } else if (type === 'HACKATHON' && lastRejectedHackathon) {
      setSwipeDirection('undo');
      setCurrentHackathonIndex(lastRejectedHackathon.index);
      setLastRejectedHackathon(null);
      setShowUndo(prev => ({ ...prev, hackathons: false }));
      setTimeout(() => setSwipeDirection(null), 500);
    } else if (type === 'PROJECT' && lastRejectedProject) {
      setSwipeDirection('undo');
      setCurrentProjectIndex(lastRejectedProject.index);
      setLastRejectedProject(null);
      setShowUndo(prev => ({ ...prev, projects: false }));
      setTimeout(() => setSwipeDirection(null), 500);
    }
  };

  const completeOnboarding = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setShowOnboarding(false);
        loadAppData();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const createPost = async () => {
    // Validate required fields
    if (!postData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!postData.location.trim()) {
      alert('Location is required');
      return;
    }
    if (!postData.type) {
      alert('Type is required');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...postData,
          title: postData.title.trim(),
          location: postData.location.trim()
        })
      });

      if (response.ok) {
        setShowPostDialog(false);
        setPostData({
          type: 'HACKATHON',
          title: '',
          location: '',
          websiteUrl: '',
          skillsNeeded: [],
          notes: ''
        });
        // Reload data
        loadAppData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      alert('An error occurred while creating the post');
    }
  };

  const startDirectMessage = async (otherUserId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantIds: [otherUserId],
          isGroup: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setShowMessageDialog(true);
        loadMessages(data.conversation.id);
      }
    } catch (error) {
      console.error('DM creation error:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Messages load error:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageInput
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setMessageInput('');
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const acceptInquiry = async (inquiryId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });

      if (response.ok) {
        // Reload inquiries
        loadAppData();
      }
    } catch (error) {
      console.error('Accept inquiry error:', error);
    }
  };

  const editPost = async () => {
    if (!editingPost) return;
    
    // Validate required fields
    if (!editingPost.title?.trim()) {
      alert('Title is required');
      return;
    }
    if (!editingPost.location?.trim()) {
      alert('Location is required');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingPost)
      });

      if (response.ok) {
        setShowEditPostDialog(false);
        setEditingPost(null);
        loadAppData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Edit post error:', error);
      alert('An error occurred while updating the post');
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadAppData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      alert('An error occurred while deleting the post');
    }
  };

  const toggleSkill = (skill) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleInterest = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const togglePostSkill = (skill) => {
    setPostData(prev => ({
      ...prev,
      skillsNeeded: prev.skillsNeeded.includes(skill)
        ? prev.skillsNeeded.filter(s => s !== skill)
        : [...prev.skillsNeeded, skill]
    }));
  };

  const addExperience = () => {
    setProfileData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        org: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const addProject = () => {
    setProfileData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: '',
        description: '',
        tech: [],
        repoUrl: '',
        demoUrl: ''
      }]
    }));
  };

  const addAward = () => {
    setProfileData(prev => ({
      ...prev,
      awards: [...prev.awards, {
        title: '',
        issuer: '',
        year: ''
      }]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hackathon Tinder
            </CardTitle>
            <CardDescription>
              Connect with developers, find projects, join hackathons
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full">
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="w-full"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Set Your Profile</CardTitle>
              <CardDescription>
                Step {onboardingStep} of 3 - Let's get you connected with the right people!
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="looksToConnect">What are you looking for?</Label>
                    <Textarea
                      id="looksToConnect"
                      placeholder="Looking for a frontend dev for an AI app..."
                      value={profileData.looksToConnect}
                      onChange={(e) => setProfileData(prev => ({ ...prev, looksToConnect: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map(skill => (
                        <Badge
                          key={skill}
                          variant={profileData.skills.includes(skill) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Interests</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(interest => (
                        <Badge
                          key={interest}
                          variant={profileData.interests.includes(interest) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {onboardingStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setOnboardingStep(prev => prev - 1)}
                >
                  Back
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  if (onboardingStep < 3) {
                    setOnboardingStep(prev => prev + 1);
                  } else {
                    completeOnboarding();
                  }
                }}
                className="ml-auto"
              >
                {onboardingStep === 3 ? 'Complete Profile' : 'Next'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const currentPerson = people[currentPersonIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              HackSwipe
            </h1>
            <span className="ml-3 text-sm text-gray-500 font-medium">Swipe. Match. Build.</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMessageDialog(true)}
              className="relative"
            >
              <MessageCircle className="h-5 w-5" />
              {conversations.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {conversations.length}
                </span>
              )}
            </Button>
            
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
              
              {showNotifications && (
                <div className="notifications-dropdown absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <ScrollArea className="max-h-64">
                    {notifications.length > 0 ? (
                      <div className="p-2">
                        {notifications.map(notification => (
                          <div key={notification.id} className={`p-2 rounded-lg mb-2 ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium">{notification.message}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-h-screen">
          {/* Explore Tab */}
          <TabsContent value="explore" className="p-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Discover & Explore</h2>
                <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                      <DialogDescription>
                        Share a hackathon or project with the community
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={postData.type}
                          onValueChange={(value) => setPostData(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HACKATHON">Hackathon</SelectItem>
                            <SelectItem value="PROJECT">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Title <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="Enter title..."
                          value={postData.title}
                          onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                          className={!postData.title.trim() ? 'border-red-300' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Location <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="City or Remote"
                          value={postData.location}
                          onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                          className={!postData.location.trim() ? 'border-red-300' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Website/Link</Label>
                        <Input
                          placeholder="https://..."
                          value={postData.websiteUrl}
                          onChange={(e) => setPostData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Skills Needed</Label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {SKILLS.slice(0, 15).map(skill => (
                            <Badge
                              key={skill}
                              variant={postData.skillsNeeded.includes(skill) ? 'default' : 'outline'}
                              className="cursor-pointer text-xs"
                              onClick={() => togglePostSkill(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional details..."
                          value={postData.notes}
                          onChange={(e) => setPostData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createPost}>
                        Create Post
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Tabs value={exploreTab} onValueChange={setExploreTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="hackathons" className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Hackathons
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Projects
                  </TabsTrigger>
                  <TabsTrigger value="people" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    People
                  </TabsTrigger>
                </TabsList>

                {/* People Tab */}
                <TabsContent value="people">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-center mb-4">Discover People</h3>
              
              {currentPerson ? (
                <div className="relative overflow-visible">
                  {/* Subtle Multi-Card Stack - Proportional and Balanced */}
                  
                  {/* Third Card (Deepest) - Subtle presence */}
                  {people[currentPersonIndex + 2] && (
                    <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-2xl shadow-lg z-0 transform rotate-1 scale-94 opacity-50 border border-gray-200">
                      <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl"></div>
                    </div>
                  )}
                  
                  {/* Second Card - Clear but proportional with animation */}
                  <AnimatePresence>
                    {people[currentPersonIndex + 1] && (
                      <motion.div 
                        key={`second-${currentPersonIndex + 1}`}
                        initial={{ top: 6, left: 6, right: 6, bottom: 6, scale: 0.94, opacity: 0.5 }}
                        animate={{ 
                          top: 12, 
                          left: 12, 
                          right: 12, 
                          bottom: 12,
                          scale: 0.97, 
                          opacity: 0.70,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                        className="absolute bg-white rounded-2xl shadow-xl z-1 transform rotate-0.5 border-2 border-indigo-200">
                        <div className="h-48 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-t-2xl flex items-center justify-center">
                          <div className="text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
                            {people[currentPersonIndex + 1]?.name || 'Next Person'}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="h-4 bg-indigo-200 rounded mb-2"></div>
                          <div className="h-3 bg-indigo-100 rounded mb-2"></div>
                          <div className="h-3 bg-indigo-100 rounded w-3/4"></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Next Card Peek from Right Side - Proportional */}
                  {people[currentPersonIndex + 1] && (
                    <div className="absolute top-0 right-[-80px] w-full h-full bg-white rounded-2xl shadow-lg z-0 transform rotate-2 scale-92 opacity-60 border-2 border-blue-300">
                      <div className="h-48 bg-gradient-to-br from-blue-300 to-indigo-400 rounded-t-2xl flex items-center justify-center">
                        <div className="text-white font-semibold text-sm bg-black bg-opacity-40 px-3 py-1 rounded-full">
                          Next →
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-blue-200 rounded mb-2"></div>
                        <div className="h-3 bg-blue-150 rounded mb-2"></div>
                        <div className="h-3 bg-blue-150 rounded w-2/3"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Current person (foreground card) with swipe and undo animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                    key={currentPersonIndex}
                    initial={{ 
                      scale: swipeDirection === 'undo' ? 0.9 : 0.8, 
                      opacity: swipeDirection === 'undo' ? 0.8 : 0, 
                      x: swipeDirection === 'undo' ? -200 : 0,
                      rotate: swipeDirection === 'undo' ? -10 : 0
                    }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      x: 0,
                      rotate: 0,
                      transition: {
                        type: "spring",
                        stiffness: swipeDirection === 'undo' ? 150 : 100,
                        damping: swipeDirection === 'undo' ? 20 : 25,
                        duration: swipeDirection === 'undo' ? 0.6 : 0.3
                      }
                    }}
                    exit={{ 
                      x: swipeDirection === 'right' ? 400 : swipeDirection === 'left' ? -400 : 0,
                      rotate: swipeDirection === 'right' ? 20 : swipeDirection === 'left' ? -20 : 0,
                      opacity: swipeDirection === 'undo' ? 1 : 0,
                      scale: swipeDirection !== 'undo' ? 0.8 : 1,
                      transition: { 
                        duration: 0.4,
                        ease: "easeInOut"
                      }
                    }}
                    className="relative z-10 bg-white rounded-2xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing"
                  >
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{currentPerson.name}</h3>
                    <p className="text-gray-600 mb-4">{currentPerson.roleHeadline || 'Developer'}</p>
                    
                    {currentPerson.profile?.bio && (
                      <p className="text-sm text-gray-700 mb-4">{currentPerson.profile.bio}</p>
                    )}
                    
                    {currentPerson.profile?.skills && currentPerson.profile.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {currentPerson.profile.skills.slice(0, 5).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentPerson.profile?.looksToConnect && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-1">Looking for</p>
                        <p className="text-sm text-gray-600">{currentPerson.profile.looksToConnect}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center items-center gap-4 mt-6">
                      {/* Undo Button - Next to X Button */}
                      {showUndo.people && lastRejectedPerson && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, x: -20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0, opacity: 0, x: -20 }}
                          transition={{ type: "spring", duration: 0.4 }}
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full w-16 h-16 border-orange-300 text-orange-500 hover:bg-orange-50 hover:scale-110 hover:border-orange-400 transition-all duration-200"
                            onClick={() => handleUndo('PERSON')}
                          >
                            <Undo className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50 hover:scale-110 hover:border-red-400 transition-all duration-200"
                        onClick={() => handleSwipe('left')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 hover:scale-110 text-white transition-all duration-200"
                        onClick={() => handleSwipe('right')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
                  </AnimatePresence>
                  
                  {/* Undo button moved to be next to X button */}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-500">No more people to discover!</p>
                    <Button 
                      onClick={loadAppData} 
                      className="mt-4"
                    >
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Hackathons Tab */}
          <TabsContent value="hackathons">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-center mb-4">Discover Hackathons</h3>
              
              {hackathons[currentHackathonIndex] ? (
                <div className="relative overflow-visible">
                  {/* Subtle Multi-Card Stack - Proportional and Balanced */}
                  
                  {/* Third Card (Deepest) - Subtle presence */}
                  {hackathons[currentHackathonIndex + 2] && (
                    <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-2xl shadow-lg z-0 transform rotate-1 scale-94 opacity-50 border border-gray-200">
                      <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl"></div>
                    </div>
                  )}
                  
                  {/* Second Card - Clear but proportional */}
                  {hackathons[currentHackathonIndex + 1] && (
                    <div className="absolute top-3 left-3 right-3 bottom-3 bg-white rounded-2xl shadow-xl z-1 transform rotate-0.5 scale-97 opacity-70 border-2 border-orange-200">
                      <div className="h-48 bg-gradient-to-br from-orange-300 to-red-300 rounded-t-2xl flex items-center justify-center">
                        <div className="text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
                          {hackathons[currentHackathonIndex + 1]?.title || 'Next Hackathon'}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-orange-200 rounded mb-2"></div>
                        <div className="h-3 bg-orange-100 rounded mb-2"></div>
                        <div className="h-3 bg-orange-100 rounded w-3/4"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Next Card Peek from Right Side - Proportional */}
                  {hackathons[currentHackathonIndex + 1] && (
                    <div className="absolute top-0 right-[-80px] w-full h-full bg-white rounded-2xl shadow-lg z-0 transform rotate-2 scale-92 opacity-60 border-2 border-orange-300">
                      <div className="h-48 bg-gradient-to-br from-orange-300 to-red-400 rounded-t-2xl flex items-center justify-center">
                        <div className="text-white font-semibold text-sm bg-black bg-opacity-40 px-3 py-1 rounded-full">
                          Next →
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-orange-200 rounded mb-2"></div>
                        <div className="h-3 bg-orange-150 rounded mb-2"></div>
                        <div className="h-3 bg-orange-150 rounded w-2/3"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Current hackathon (foreground card) with swipe animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHackathonIndex}
                      initial={{ scale: 0.8, opacity: 0, x: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        x: 0,
                        rotate: 0
                      }}
                      exit={{ 
                        x: swipeDirection === 'right' ? 300 : -300,
                        rotate: swipeDirection === 'right' ? 15 : -15,
                        opacity: 0,
                        transition: { duration: 0.3 }
                      }}
                      className="relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
                    >
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                    <div className="text-center text-white">
                      <Target className="h-12 w-12 mx-auto mb-2" />
                      <h3 className="text-lg font-bold">Hackathon</h3>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{hackathons[currentHackathonIndex].title}</h3>
                    
                    {hackathons[currentHackathonIndex].location && (
                      <p className="text-gray-600 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {hackathons[currentHackathonIndex].location}
                      </p>
                    )}
                    
                    {hackathons[currentHackathonIndex].websiteUrl && (
                      <a 
                        href={hackathons[currentHackathonIndex].websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mb-2 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit Website
                      </a>
                    )}
                    
                    {hackathons[currentHackathonIndex].skillsNeeded && hackathons[currentHackathonIndex].skillsNeeded.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Skills Needed</p>
                        <div className="flex flex-wrap gap-1">
                          {hackathons[currentHackathonIndex].skillsNeeded.slice(0, 6).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hackathons[currentHackathonIndex].notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">{hackathons[currentHackathonIndex].notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4 mt-6">
                      {/* Undo Button - Next to X Button */}
                      {showUndo.hackathons && lastRejectedHackathon && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, x: -20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0, opacity: 0, x: -20 }}
                          transition={{ type: "spring", duration: 0.4 }}
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full w-16 h-16 border-orange-300 text-orange-500 hover:bg-orange-50 hover:scale-110 hover:border-orange-400 transition-all duration-200"
                            onClick={() => handleUndo('HACKATHON')}
                          >
                            <Undo className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      )}

                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50 hover:scale-110 hover:border-red-400 transition-all duration-200"
                        onClick={() => handleSwipe('left', 'HACKATHON')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 hover:scale-110 text-white transition-all duration-200"
                        onClick={() => handleSwipe('right', 'HACKATHON')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
                  </AnimatePresence>
                  
                  {/* Undo button moved to be next to X button */}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No more hackathons to discover!</p>
                    <Button 
                      onClick={loadAppData} 
                      className="mt-4"
                      variant="outline"
                    >
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="max-w-md mx-auto">
              <div className="mb-4 text-center">
                <Button
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    try {
                      const response = await fetch('/api/random-project', {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        if (data.project) {
                          setProjects(prev => [data.project, ...prev]);
                          setCurrentProjectIndex(0);
                        }
                      }
                    } catch (error) {
                      console.error('Random project error:', error);
                    }
                  }}
                  variant="outline"
                  className="mb-4"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Random Project Matcher
                </Button>
              </div>
              
              <h3 className="text-xl font-bold text-center mb-4">Discover Projects</h3>
              
              {projects[currentProjectIndex] ? (
                <div className="relative overflow-visible">
                  {/* Subtle Multi-Card Stack - Proportional and Balanced */}
                  
                  {/* Third Card (Deepest) - Subtle presence */}
                  {projects[currentProjectIndex + 2] && (
                    <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-2xl shadow-lg z-0 transform rotate-1 scale-94 opacity-50 border border-gray-200">
                      <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl"></div>
                    </div>
                  )}
                  
                  {/* Second Card - Clear but proportional */}
                  {projects[currentProjectIndex + 1] && (
                    <div className="absolute top-3 left-3 right-3 bottom-3 bg-white rounded-2xl shadow-xl z-1 transform rotate-0.5 scale-97 opacity-70 border-2 border-green-200">
                      <div className="h-48 bg-gradient-to-br from-green-300 to-teal-300 rounded-t-2xl flex items-center justify-center">
                        <div className="text-white text-sm font-medium bg-black bg-opacity-30 px-3 py-1 rounded-full">
                          {projects[currentProjectIndex + 1]?.title || 'Next Project'}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-green-200 rounded mb-2"></div>
                        <div className="h-3 bg-green-100 rounded mb-2"></div>
                        <div className="h-3 bg-green-100 rounded w-3/4"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Next Card Peek from Right Side - Proportional */}
                  {projects[currentProjectIndex + 1] && (
                    <div className="absolute top-0 right-[-80px] w-full h-full bg-white rounded-2xl shadow-lg z-0 transform rotate-2 scale-92 opacity-60 border-2 border-green-300">
                      <div className="h-48 bg-gradient-to-br from-green-300 to-teal-400 rounded-t-2xl flex items-center justify-center">
                        <div className="text-white font-semibold text-sm bg-black bg-opacity-40 px-3 py-1 rounded-full">
                          Next →
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-green-200 rounded mb-2"></div>
                        <div className="h-3 bg-green-150 rounded mb-2"></div>
                        <div className="h-3 bg-green-150 rounded w-2/3"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Current project (foreground card) with swipe animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProjectIndex}
                      initial={{ scale: 0.8, opacity: 0, x: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        x: 0,
                        rotate: 0
                      }}
                      exit={{ 
                        x: swipeDirection === 'right' ? 300 : -300,
                        rotate: swipeDirection === 'right' ? 15 : -15,
                        opacity: 0,
                        transition: { duration: 0.3 }
                      }}
                      className="relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
                    >
                  <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Code className="h-12 w-12 mx-auto mb-2" />
                      <h3 className="text-lg font-bold">Project</h3>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{projects[currentProjectIndex].title}</h3>
                    
                    {projects[currentProjectIndex].location && (
                      <p className="text-gray-600 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {projects[currentProjectIndex].location}
                      </p>
                    )}
                    
                    {projects[currentProjectIndex].websiteUrl && (
                      <a 
                        href={projects[currentProjectIndex].websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mb-2 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Project
                      </a>
                    )}
                    
                    {projects[currentProjectIndex].skillsNeeded && projects[currentProjectIndex].skillsNeeded.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Skills Needed</p>
                        <div className="flex flex-wrap gap-1">
                          {projects[currentProjectIndex].skillsNeeded.slice(0, 6).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {projects[currentProjectIndex].notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">{projects[currentProjectIndex].notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4 mt-6">
                      {/* Undo Button - Next to X Button */}
                      {showUndo.projects && lastRejectedProject && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, x: -20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0, opacity: 0, x: -20 }}
                          transition={{ type: "spring", duration: 0.4 }}
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full w-16 h-16 border-orange-300 text-orange-500 hover:bg-orange-50 hover:scale-110 hover:border-orange-400 transition-all duration-200"
                            onClick={() => handleUndo('PROJECT')}
                          >
                            <Undo className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      )}

                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50 hover:scale-110 hover:border-red-400 transition-all duration-200"
                        onClick={() => handleSwipe('left', 'PROJECT')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 hover:scale-110 text-white transition-all duration-200"
                        onClick={() => handleSwipe('right', 'PROJECT')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
                  </AnimatePresence>
                  
                  {/* Small Undo Button - Side of Card */}
                  {showUndo.projects && lastRejectedProject && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, x: -50 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0, opacity: 0, x: -50 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      className="absolute left-[-70px] top-1/2 transform -translate-y-1/2 z-30"
                    >
                      <div className="bg-white rounded-lg shadow-lg border-2 border-red-300 p-2 w-16 h-20 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
                           onClick={() => handleUndo('PROJECT')}>
                        <div className="h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded flex items-center justify-center mb-1">
                          <Code className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-xs text-center text-gray-600 truncate mb-1">{lastRejectedProject.title}</div>
                        <div className="flex items-center justify-center">
                          <Undo className="h-3 w-3 text-red-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Code className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No more projects to discover!</p>
                    <Button 
                      onClick={loadAppData} 
                      className="mt-4"
                      variant="outline"
                    >
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="p-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">Your Matches</h2>
              
              {matches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map(match => (
                    <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div 
                        className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          if (match.otherUser) {
                            setSelectedUserProfile(match.otherUser);
                            setShowProfileDialog(true);
                          }
                        }}
                        title="Click to view profile"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-bold mb-1">{match.otherUser?.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{match.otherUser?.roleHeadline || 'Developer'}</p>
                        
                        {match.otherUser?.profile?.skills && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {match.otherUser.profile.skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              if (match.otherUser) {
                                startDirectMessage(match.otherUser.id);
                                setShowMessageDialog(true);
                              }
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (match.otherUser) {
                                setSelectedUserProfile(match.otherUser);
                                setShowProfileDialog(true);
                              }
                            }}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No matches yet. Keep swiping!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">Your Dashboard</h2>
              
              {/* Ultra Compact Stats Row */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <Heart className="h-4 w-4 mx-auto text-red-500 mb-1" />
                  <p className="text-lg font-bold text-red-500">{matches.length}</p>
                  <p className="text-xs text-gray-600">Matches</p>
                </Card>
                
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <TrendingUp className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold text-blue-500">{userPosts.length}</p>
                  <p className="text-xs text-gray-600">Posts</p>
                </Card>
                
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <Compass className="h-4 w-4 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold text-green-500">{overviewStats.totalSwipes || 0}</p>
                  <p className="text-xs text-gray-600">Discovered</p>
                </Card>
                
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <Star className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                  <p className="text-lg font-bold text-yellow-500">{loginStreak}</p>
                  <p className="text-xs text-gray-600">Streak</p>
                </Card>
                
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <Target className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-lg font-bold text-purple-500">{overviewStats.hackathonsJoined || 0}</p>
                  <p className="text-xs text-gray-600">Hackathons</p>
                </Card>
                
                <Card className="text-center flex flex-col justify-center p-2 h-16">
                  <Code className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-lg font-bold text-orange-500">{overviewStats.projectsJoined || 0}</p>
                  <p className="text-xs text-gray-600">Projects</p>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Your Posts Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Your Posts
                      </div>
                      <Badge variant="outline">{userPosts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userPosts.length > 0 ? (
                      <div className="space-y-3">
                        {userPosts.slice(0, 3).map(post => (
                          <div key={post.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{post.title}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={post.type === 'HACKATHON' ? 'default' : 'secondary'} className="text-xs">
                                    {post.type}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {post.inquiryCount || 0} inquiries
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {post.acceptedCount || 0} accepted • {post.location}
                                </p>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                <div className="text-xs text-gray-500">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setEditingPost({...post});
                                      setShowEditPostDialog(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => deletePost(post.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {userPosts.length > 3 && (
                          <Button variant="outline" size="sm" className="w-full">
                            View All Posts ({userPosts.length})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Building className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No posts yet</p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setShowPostDialog(true)}
                        >
                          Create Your First Post
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Connects & Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Recent Connects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {matches.slice(0, 2).map(match => (
                        <div key={match.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{match.otherUser?.name}</p>
                            <p className="text-xs text-gray-600">
                              Connected {new Date(match.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startDirectMessage(match.otherUser?.id)}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </div>
                      ))}
                      
                      {inquiries.slice(0, 1).map(inquiry => (
                        <div key={inquiry.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{inquiry.user?.name}</p>
                            <p className="text-xs text-gray-600">
                              Interested in {inquiry.post?.title}
                            </p>
                          </div>
                        </div>
                      ))}

                      {matches.length === 0 && inquiries.length === 0 && (
                        <div className="text-center py-4">
                          <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No recent connects</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Your Matches Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Heart className="h-5 w-5 mr-2" />
                        Your Matches
                      </div>
                      <Badge variant="outline">{matches.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {matches.slice(0, 3).map(match => (
                        <div key={match.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{match.otherUser?.name}</p>
                              <p className="text-xs text-gray-600">
                                {match.otherUser?.roleHeadline || 'Developer'}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedUserProfile(match.otherUser);
                                setShowProfileDialog(true);
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => startDirectMessage(match.otherUser?.id)}
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {matches.length > 3 && (
                        <Button variant="outline" size="sm" className="w-full">
                          View All Matches ({matches.length})
                        </Button>
                      )}

                      {matches.length === 0 && (
                        <div className="text-center py-4">
                          <Heart className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No matches yet</p>
                          <p className="text-xs text-gray-400">Keep swiping!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Projects Ongoing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Code className="h-5 w-5 mr-2" />
                      Ongoing Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {inquiries.filter(i => i.status === 'ACCEPTED').slice(0, 3).map(project => (
                        <div key={project.id} className="border rounded-lg p-3">
                          <h4 className="font-medium">{project.post?.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Active
                            </span>
                            <span className="text-xs text-gray-500">
                              Joined {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {inquiries.filter(i => i.status === 'ACCEPTED').length === 0 && (
                        <div className="text-center py-4">
                          <Code className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No ongoing projects</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Match Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Match Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">People Matched</span>
                        <span className="font-semibold">{matches.filter(m => m.context === 'PEOPLE').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Projects Liked</span>
                        <span className="font-semibold">{projects.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hackathons Joined</span>
                        <span className="font-semibold">{hackathons.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-semibold text-green-500">
                          {matches.length > 0 ? Math.round((matches.length / Math.max(currentPersonIndex, 1)) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Profile</h2>
                <Button
                  onClick={() => {
                    setEditingProfile(profile);
                    setShowEditProfileDialog(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {profile?.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">Bio</h4>
                      <p className="text-gray-700">{profile.bio}</p>
                    </div>
                  )}
                  
                  {profile?.looksToConnect && (
                    <div>
                      <h4 className="font-semibold mb-2">Looking For</h4>
                      <p className="text-gray-700">{profile.looksToConnect}</p>
                    </div>
                  )}
                  
                  {profile?.skills && profile.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile?.interests && profile.interests.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map(interest => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile?.socials && profile.socials.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Connect</h4>
                      <div className="flex gap-3">
                        {profile.socials.map((social, index) => (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {social.type === 'GITHUB' && (
                              <>
                                <Github className="h-4 w-4 mr-1" />
                                GitHub
                              </>
                            )}
                            {social.type === 'LINKEDIN' && (
                              <>
                                <Linkedin className="h-4 w-4 mr-1" />
                                LinkedIn
                              </>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile?.experience && profile.experience.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Work Experience</h4>
                      <div className="space-y-3">
                        {profile.experience.map((exp, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">{exp.title}</h5>
                                <p className="text-sm text-gray-600">{exp.org}</p>
                                <p className="text-xs text-gray-500">
                                  {exp.startDate} - {exp.endDate || 'Present'}
                                </p>
                              </div>
                            </div>
                            {exp.description && (
                              <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile?.projects && profile.projects.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Projects</h4>
                      <div className="space-y-3">
                        {profile.projects.map((project, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{project.name}</h5>
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {project.repoUrl && (
                                <a 
                                  href={project.repoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                >
                                  <Github className="h-3 w-3 mr-1" />
                                  Code
                                </a>
                              )}
                              {project.demoUrl && (
                                <a 
                                  href={project.demoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Demo
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile View Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          
          {selectedUserProfile && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold">{selectedUserProfile.name}</h2>
                <p className="text-gray-600">{selectedUserProfile.roleHeadline || 'Developer'}</p>
                <p className="text-sm text-gray-500">{selectedUserProfile.location}</p>
              </div>

              {/* Profile Content */}
              <div className="grid gap-4 md:grid-cols-2">
                {selectedUserProfile.profile?.bio && (
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-gray-700 text-sm">{selectedUserProfile.profile.bio}</p>
                  </div>
                )}

                {selectedUserProfile.profile?.looksToConnect && (
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-2">Looking For</h4>
                    <p className="text-gray-700 text-sm">{selectedUserProfile.profile.looksToConnect}</p>
                  </div>
                )}

                {selectedUserProfile.profile?.skills && selectedUserProfile.profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedUserProfile.profile.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUserProfile.profile?.interests && selectedUserProfile.profile.interests.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedUserProfile.profile.interests.map(interest => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUserProfile.profile?.projects && selectedUserProfile.profile.projects.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-2">Projects</h4>
                    <div className="space-y-2">
                      {selectedUserProfile.profile.projects.map((project, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h5 className="font-medium">{project.name}</h5>
                          <p className="text-sm text-gray-600">{project.description}</p>
                          <div className="flex space-x-2 mt-2">
                            {project.repoUrl && (
                              <a 
                                href={project.repoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center"
                              >
                                <Github className="h-3 w-3 mr-1" />
                                Code
                              </a>
                            )}
                            {project.demoUrl && (
                              <a 
                                href={project.demoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Demo
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    startDirectMessage(selectedUserProfile.id);
                    setShowProfileDialog(false);
                  }}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowProfileDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Group Chat Creation Dialog */}
      <Dialog open={showGroupChatDialog} onOpenChange={setShowGroupChatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group Chat</DialogTitle>
            <DialogDescription>
              Create a group chat with your matches
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="Enter group name..."
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Select Participants</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {matches.map(match => (
                  <div key={match.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`match-${match.id}`}
                      checked={selectedMatches.includes(match.otherUser.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMatches(prev => [...prev, match.otherUser.id]);
                        } else {
                          setSelectedMatches(prev => prev.filter(id => id !== match.otherUser.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <label htmlFor={`match-${match.id}`} className="flex-1 cursor-pointer">
                      <p className="text-sm font-medium">{match.otherUser?.name}</p>
                      <p className="text-xs text-gray-600">{match.otherUser?.roleHeadline}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupChatDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (groupChatName && selectedMatches.length > 0) {
                  const token = localStorage.getItem('token');
                  try {
                    const response = await fetch('/api/conversations', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        participantIds: selectedMatches,
                        isGroup: true,
                        name: groupChatName
                      })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setSelectedConversation(data.conversation);
                      setShowGroupChatDialog(false);
                      setShowMessageDialog(true);
                      setGroupChatName('');
                      setSelectedMatches([]);
                      loadMessages(data.conversation.id);
                    }
                  } catch (error) {
                    console.error('Group chat creation error:', error);
                  }
                }
              }}
              disabled={!groupChatName || selectedMatches.length === 0}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditPostDialog} onOpenChange={setShowEditPostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Update your post information
            </DialogDescription>
          </DialogHeader>
          
          {editingPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type <span className="text-red-500">*</span></Label>
                <Select
                  value={editingPost.type}
                  onValueChange={(value) => setEditingPost(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HACKATHON">Hackathon</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter title..."
                  value={editingPost.title}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                  className={!editingPost.title?.trim() ? 'border-red-300' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Location <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="City or Remote"
                  value={editingPost.location}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, location: e.target.value }))}
                  className={!editingPost.location?.trim() ? 'border-red-300' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Website/Link</Label>
                <Input
                  placeholder="https://..."
                  value={editingPost.websiteUrl || ''}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, websiteUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Skills Needed</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {SKILLS.slice(0, 15).map(skill => (
                    <Badge
                      key={skill}
                      variant={editingPost.skillsNeeded?.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const skills = editingPost.skillsNeeded || [];
                        const newSkills = skills.includes(skill)
                          ? skills.filter(s => s !== skill)
                          : [...skills, skill];
                        setEditingPost(prev => ({ ...prev, skillsNeeded: newSkills }));
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={editingPost.notes || ''}
                  onChange={(e) => setEditingPost(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editPost}>
              Update Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and preferences
            </DialogDescription>
          </DialogHeader>
          
          {editingProfile && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    value={editingProfile.bio || ''}
                    onChange={(e) => setEditingProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>What are you looking for?</Label>
                  <Textarea
                    placeholder="Looking for a frontend dev for an AI app..."
                    value={editingProfile.looksToConnect || ''}
                    onChange={(e) => setEditingProfile(prev => ({ ...prev, looksToConnect: e.target.value }))}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {SKILLS.map(skill => (
                    <Badge
                      key={skill}
                      variant={(editingProfile.skills || []).includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const currentSkills = editingProfile.skills || [];
                        if (currentSkills.includes(skill)) {
                          setEditingProfile(prev => ({
                            ...prev,
                            skills: currentSkills.filter(s => s !== skill)
                          }));
                        } else {
                          setEditingProfile(prev => ({
                            ...prev,
                            skills: [...currentSkills, skill]
                          }));
                        }
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Add Custom Skill</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a custom skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const customSkill = e.target.value.trim();
                          if (customSkill && !(editingProfile.skills || []).includes(customSkill)) {
                            setEditingProfile(prev => ({
                              ...prev,
                              skills: [...(prev.skills || []), customSkill]
                            }));
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        const customSkill = input.value.trim();
                        if (customSkill && !(editingProfile.skills || []).includes(customSkill)) {
                          setEditingProfile(prev => ({
                            ...prev,
                            skills: [...(prev.skills || []), customSkill]
                          }));
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {/* Display custom skills with remove option */}
                {(editingProfile.skills || []).filter(skill => !SKILLS.includes(skill)).length > 0 && (
                  <div className="mt-2">
                    <Label className="text-sm text-gray-600">Custom Skills:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(editingProfile.skills || []).filter(skill => !SKILLS.includes(skill)).map(skill => (
                        <Badge
                          key={skill}
                          variant="default"
                          className="text-xs cursor-pointer bg-purple-100 text-purple-800"
                          onClick={() => {
                            const currentSkills = editingProfile.skills || [];
                            setEditingProfile(prev => ({
                              ...prev,
                              skills: currentSkills.filter(s => s !== skill)
                            }));
                          }}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {INTERESTS.map(interest => (
                    <Badge
                      key={interest}
                      variant={(editingProfile.interests || []).includes(interest) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const currentInterests = editingProfile.interests || [];
                        if (currentInterests.includes(interest)) {
                          setEditingProfile(prev => ({
                            ...prev,
                            interests: currentInterests.filter(i => i !== interest)
                          }));
                        } else {
                          setEditingProfile(prev => ({
                            ...prev,
                            interests: [...currentInterests, interest]
                          }));
                        }
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Add Custom Interest</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a custom interest..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const customInterest = e.target.value.trim();
                          if (customInterest && !(editingProfile.interests || []).includes(customInterest)) {
                            setEditingProfile(prev => ({
                              ...prev,
                              interests: [...(prev.interests || []), customInterest]
                            }));
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        const customInterest = input.value.trim();
                        if (customInterest && !(editingProfile.interests || []).includes(customInterest)) {
                          setEditingProfile(prev => ({
                            ...prev,
                            interests: [...(prev.interests || []), customInterest]
                          }));
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {/* Display custom interests with remove option */}
                {(editingProfile.interests || []).filter(interest => !INTERESTS.includes(interest)).length > 0 && (
                  <div className="mt-2">
                    <Label className="text-sm text-gray-600">Custom Interests:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(editingProfile.interests || []).filter(interest => !INTERESTS.includes(interest)).map(interest => (
                        <Badge
                          key={interest}
                          variant="default"
                          className="text-xs cursor-pointer bg-green-100 text-green-800"
                          onClick={() => {
                            const currentInterests = editingProfile.interests || [];
                            setEditingProfile(prev => ({
                              ...prev,
                              interests: currentInterests.filter(i => i !== interest)
                            }));
                          }}
                        >
                          {interest} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Social Links</Label>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub Profile
                  </Label>
                  <Input
                    placeholder="https://github.com/yourusername"
                    value={(() => {
                      const githubSocial = (editingProfile.socials || []).find(s => s.type === 'GITHUB');
                      return githubSocial ? githubSocial.url : '';
                    })()}
                    onChange={(e) => {
                      const currentSocials = editingProfile.socials || [];
                      const otherSocials = currentSocials.filter(s => s.type !== 'GITHUB');
                      const newSocials = e.target.value.trim() 
                        ? [...otherSocials, { type: 'GITHUB', url: e.target.value }]
                        : otherSocials;
                      setEditingProfile(prev => ({ ...prev, socials: newSocials }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn Profile
                  </Label>
                  <Input
                    placeholder="https://linkedin.com/in/yourusername"
                    value={(() => {
                      const linkedinSocial = (editingProfile.socials || []).find(s => s.type === 'LINKEDIN');
                      return linkedinSocial ? linkedinSocial.url : '';
                    })()}
                    onChange={(e) => {
                      const currentSocials = editingProfile.socials || [];
                      const otherSocials = currentSocials.filter(s => s.type !== 'LINKEDIN');
                      const newSocials = e.target.value.trim() 
                        ? [...otherSocials, { type: 'LINKEDIN', url: e.target.value }]
                        : otherSocials;
                      setEditingProfile(prev => ({ ...prev, socials: newSocials }));
                    }}
                  />
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Work Experience</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentExp = editingProfile.experience || [];
                      setEditingProfile(prev => ({
                        ...prev,
                        experience: [...currentExp, {
                          title: '',
                          org: '',
                          startDate: '',
                          endDate: '',
                          description: ''
                        }]
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                </div>
                
                {(editingProfile.experience || []).map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Experience #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const currentExp = editingProfile.experience || [];
                          setEditingProfile(prev => ({
                            ...prev,
                            experience: currentExp.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Job Title</Label>
                        <Input
                          placeholder="Software Engineer"
                          value={exp.title || ''}
                          onChange={(e) => {
                            const currentExp = [...(editingProfile.experience || [])];
                            currentExp[index] = { ...currentExp[index], title: e.target.value };
                            setEditingProfile(prev => ({ ...prev, experience: currentExp }));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Company</Label>
                        <Input
                          placeholder="Tech Company Inc"
                          value={exp.org || ''}
                          onChange={(e) => {
                            const currentExp = [...(editingProfile.experience || [])];
                            currentExp[index] = { ...currentExp[index], org: e.target.value };
                            setEditingProfile(prev => ({ ...prev, experience: currentExp }));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Start Date</Label>
                        <Input
                          type="date"
                          value={exp.startDate || ''}
                          onChange={(e) => {
                            const currentExp = [...(editingProfile.experience || [])];
                            currentExp[index] = { ...currentExp[index], startDate: e.target.value };
                            setEditingProfile(prev => ({ ...prev, experience: currentExp }));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">End Date</Label>
                        <Input
                          type="date"
                          value={exp.endDate || ''}
                          onChange={(e) => {
                            const currentExp = [...(editingProfile.experience || [])];
                            currentExp[index] = { ...currentExp[index], endDate: e.target.value };
                            setEditingProfile(prev => ({ ...prev, experience: currentExp }));
                          }}
                          placeholder="Leave empty if current"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        placeholder="Brief description of your role and achievements..."
                        value={exp.description || ''}
                        onChange={(e) => {
                          const currentExp = [...(editingProfile.experience || [])];
                          currentExp[index] = { ...currentExp[index], description: e.target.value };
                          setEditingProfile(prev => ({ ...prev, experience: currentExp }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Projects</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentProjects = editingProfile.projects || [];
                      setEditingProfile(prev => ({
                        ...prev,
                        projects: [...currentProjects, {
                          name: '',
                          description: '',
                          tech: [],
                          repoUrl: '',
                          demoUrl: ''
                        }]
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                </div>
                
                {(editingProfile.projects || []).map((project, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Project #{index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const currentProjects = editingProfile.projects || [];
                          setEditingProfile(prev => ({
                            ...prev,
                            projects: currentProjects.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">Project Name</Label>
                      <Input
                        placeholder="My Awesome Project"
                        value={project.name || ''}
                        onChange={(e) => {
                          const currentProjects = [...(editingProfile.projects || [])];
                          currentProjects[index] = { ...currentProjects[index], name: e.target.value };
                          setEditingProfile(prev => ({ ...prev, projects: currentProjects }));
                        }}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        placeholder="Brief description of the project and your role..."
                        value={project.description || ''}
                        onChange={(e) => {
                          const currentProjects = [...(editingProfile.projects || [])];
                          currentProjects[index] = { ...currentProjects[index], description: e.target.value };
                          setEditingProfile(prev => ({ ...prev, projects: currentProjects }));
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">GitHub Repository</Label>
                        <Input
                          placeholder="https://github.com/..."
                          value={project.repoUrl || ''}
                          onChange={(e) => {
                            const currentProjects = [...(editingProfile.projects || [])];
                            currentProjects[index] = { ...currentProjects[index], repoUrl: e.target.value };
                            setEditingProfile(prev => ({ ...prev, projects: currentProjects }));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Live Demo</Label>
                        <Input
                          placeholder="https://myproject.com"
                          value={project.demoUrl || ''}
                          onChange={(e) => {
                            const currentProjects = [...(editingProfile.projects || [])];
                            currentProjects[index] = { ...currentProjects[index], demoUrl: e.target.value };
                            setEditingProfile(prev => ({ ...prev, projects: currentProjects }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!editingProfile) return;
                
                const token = localStorage.getItem('token');
                try {
                  const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(editingProfile)
                  });

                  if (response.ok) {
                    const data = await response.json();
                    setProfile(data.profile);
                    setShowEditProfileDialog(false);
                    setEditingProfile(null);
                  } else {
                    console.error('Failed to update profile');
                  }
                } catch (error) {
                  console.error('Error updating profile:', error);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around max-w-lg mx-auto">
          <Button
            variant={activeTab === 'explore' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('explore')}
            className="flex flex-col items-center space-y-1 h-auto py-2 px-3 relative"
          >
            <Compass className="h-5 w-5" />
            <span className="text-xs">Explore</span>
          </Button>
          
          <Button
            variant={activeTab === 'matches' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('matches')}
            className="flex flex-col items-center space-y-1 h-auto py-2 px-3 relative"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Matches</span>
            {(matches.length > 0 || inquiries.length > 0) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {matches.length + inquiries.length}
              </span>
            )}
          </Button>
          
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Overview</span>
          </Button>
          
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Messages Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Messages
              </div>
              <Badge variant="outline">{conversations.length} conversations</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex h-[600px]">
            {/* Enhanced Conversations List */}
            <div className="w-1/3 border-r pr-4">
              <div className="mb-4">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Create a new conversation with available users
                    if (people.length > 0) {
                      startDirectMessage(people[0].id);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setShowMessageDialog(false);
                    setShowGroupChatDialog(true);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Group Chat
                </Button>
              </div>
              
              <ScrollArea className="h-[520px]">
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedConversation?.id === conv.id 
                          ? 'bg-blue-100 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv);
                        loadMessages(conv.id);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent conversation selection
                            if (!conv.isGroup && conv.participants[0]) {
                              setSelectedUserProfile(conv.participants[0]);
                              setShowProfileDialog(true);
                            }
                          }}
                          title={conv.isGroup ? 'Group Chat' : 'Click to view profile'}
                        >
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {conv.isGroup ? conv.name : conv.participants[0]?.name || 'Unknown'}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {conv.latestMessage?.content || 'Start a conversation...'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {conv.latestMessage ? new Date(conv.latestMessage.createdAt).toLocaleDateString() : 'New'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No conversations yet</p>
                      <p className="text-sm text-gray-400">Start chatting with your matches!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Enhanced Messages Panel */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {selectedConversation.isGroup 
                              ? selectedConversation.name 
                              : selectedConversation.participants[0]?.name || 'Unknown'
                            }
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedConversation.isGroup ? 'Group chat' : 'Direct message'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <MessageCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500">No messages yet</p>
                          <p className="text-sm text-gray-400">Start the conversation!</p>
                        </div>
                      )}
                      
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs`}>
                            {message.senderId !== user.id && (
                              <div 
                                className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  if (message.sender) {
                                    setSelectedUserProfile(message.sender);
                                    setShowProfileDialog(true);
                                  }
                                }}
                                title="Click to view profile"
                              >
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  message.senderId === user.id
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                }`}
                              >
                                {message.senderId !== user.id && selectedConversation.isGroup && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {message.sender?.name}
                                  </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                              </div>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user.id ? 'text-right' : 'text-left'
                              } text-gray-400`}>
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {message.senderId === user.id && (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex space-x-3">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!messageInput.trim()}
                        className="px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messages</h3>
                    <p className="text-gray-500 mb-4">Select a conversation or start a new chat</p>
                    <Button onClick={() => {
                      if (people.length > 0) {
                        startDirectMessage(people[0].id);
                      }
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}