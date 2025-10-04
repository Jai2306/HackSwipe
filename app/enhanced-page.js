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
  'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science', 'DevOps', 'Flutter',
  'Swift', 'Kotlin', 'Vue.js', 'Angular', 'Next.js', 'GraphQL', 'Rust', 'PHP'
];

const INTERESTS = [
  'AI/ML', 'FinTech', 'EdTech', 'Social Impact', 'Gaming', 'AR/VR', 'IoT',
  'Cybersecurity', 'Mobile Development', 'Web Development', 'Data Science',
  'Web3', 'Blockchain', 'Healthcare', 'E-commerce', 'Climate Tech', 'SaaS',
  'DevTools', 'API Development', 'Cloud Computing', 'Microservices'
];

// Hero images from vision expert
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxoYWNrYXRob258ZW58MHx8fHwxNzU5NjA4OTcxfDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXJzfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1563461660947-507ef49e9c47?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxoYWNrYXRob258ZW58MHx8fHwxNzU5NjA4OTcxfDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZ3xlbnwwfHx8fDE3NTk2MDg5ODF8MA&ixlib=rb-4.1.0&q=85'
];

export default function EnhancedApp() {
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

  // More methods will be added in the next part...
  
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
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 69, 19, 0.1), rgba(139, 69, 19, 0.1)), url('${HERO_IMAGES[0]}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hackathon Tinder
            </CardTitle>
            <CardDescription className="text-lg">
              Connect with developers, find projects, join hackathons
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
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
                  placeholder="john@example.com"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {authError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{authError}</p>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-purple-600 mb-4">Enhanced Hackathon Tinder Loading...</h1>
        <p className="text-gray-600">The full enhanced version is being created with all features!</p>
        
        {/* Quick stats display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-md mx-auto">
          <div className="bg-white p-4 rounded-lg">
            <Heart className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-sm font-medium">Matches</p>
            <p className="text-lg font-bold">{matches.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-medium">People</p>
            <p className="text-lg font-bold">{people.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <Code className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-sm font-medium">Projects</p>
            <p className="text-lg font-bold">{projects.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <MessageCircle className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-sm font-medium">Messages</p>
            <p className="text-lg font-bold">{conversations.length}</p>
          </div>
        </div>

        <Button 
          onClick={handleLogout} 
          className="mt-6"
          variant="outline"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}