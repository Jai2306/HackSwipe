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
  Briefcase, Star, Mail, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [overviewStats, setOverviewStats] = useState({});

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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSwipe = async (direction, type = 'PERSON') => {
    let currentItem, index;
    
    if (type === 'PERSON') {
      if (currentPersonIndex >= people.length) return;
      currentItem = people[currentPersonIndex];
      index = currentPersonIndex;
    } else if (type === 'HACKATHON') {
      if (currentHackathonIndex >= hackathons.length) return;
      currentItem = hackathons[currentHackathonIndex];
      index = currentHackathonIndex;
    } else if (type === 'PROJECT') {
      if (currentProjectIndex >= projects.length) return;
      currentItem = projects[currentProjectIndex];
      index = currentProjectIndex;
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
          targetType: type,
          targetId: currentItem.id,
          direction: direction.toUpperCase()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // If it's a match, update matches
        if (data.match) {
          setMatches(prev => [...prev, data.match]);
        }

        // Move to next item
        if (type === 'PERSON') {
          setCurrentPersonIndex(prev => prev + 1);
        } else if (type === 'HACKATHON') {
          setCurrentHackathonIndex(prev => prev + 1);
        } else if (type === 'PROJECT') {
          setCurrentProjectIndex(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Swipe error:', error);
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
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
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
      }
    } catch (error) {
      console.error('Post creation error:', error);
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
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hackathon Tinder
          </h1>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        <Label>Type</Label>
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
                        <Label>Title</Label>
                        <Input
                          placeholder="Enter title..."
                          value={postData.title}
                          onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          placeholder="City or Remote"
                          value={postData.location}
                          onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
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
                <motion.div
                  key={currentPersonIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="h-64 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
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
                    
                    <div className="flex justify-center space-x-4 mt-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50"
                        onClick={() => handleSwipe('left')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleSwipe('right')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
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
                <motion.div
                  key={currentHackathonIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
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
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50"
                        onClick={() => handleSwipe('left', 'HACKATHON')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleSwipe('right', 'HACKATHON')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
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
                <motion.div
                  key={currentProjectIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
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
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-16 h-16 border-red-300 text-red-500 hover:bg-red-50"
                        onClick={() => handleSwipe('left', 'PROJECT')}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleSwipe('right', 'PROJECT')}
                      >
                        <Heart className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
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

          {/* Matches Tab */}
          <TabsContent value="matches" className="p-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">Your Matches</h2>
              
              {matches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map(match => (
                    <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
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
                        
                        <Button size="sm" className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
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
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">Overview</h2>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-500" />
                      Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{matches.length}</p>
                    <p className="text-sm text-gray-600">Total matches</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Compass className="h-5 w-5 mr-2 text-blue-500" />
                      Discovered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{currentPersonIndex}</p>
                    <p className="text-sm text-gray-600">People viewed</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-green-500" />
                      Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{profile?.skills?.length || 0} skills</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="p-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">Your Profile</h2>
              
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          <Button
            variant={activeTab === 'explore' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('explore')}
            className="flex flex-col items-center space-y-1"
          >
            <Compass className="h-5 w-5" />
            <span className="text-xs">Explore</span>
          </Button>
          
          <Button
            variant={activeTab === 'matches' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('matches')}
            className="flex flex-col items-center space-y-1"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Matches</span>
          </Button>
          
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="flex flex-col items-center space-y-1"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">Overview</span>
          </Button>
          
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}