import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

const client = new MongoClient(process.env.MONGO_URL);
const dbName = process.env.DB_NAME || 'hackathon_tinder';

// Database connection helper
async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db(dbName);
}

// Helper to get current user from session
async function getCurrentUser(request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;
  
  const token = authorization.replace('Bearer ', '');
  const db = await connectDB();
  const session = await db.collection('sessions').findOne({ token });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  const user = await db.collection('users').findOne({ id: session.userId });
  return user;
}

// Authentication endpoints
async function handleAuth(request, { params }) {
  const path = params.path?.join('/') || '';
  const method = request.method;

  try {
    const db = await connectDB();

    // Register endpoint
    if (path === 'auth/register' && method === 'POST') {
      const { email, password, name } = await request.json();
      
      // Validate input
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const user = {
        id: userId,
        email,
        name,
        username: email.split('@')[0] + '_' + userId.slice(0, 8),
        passwordHash: hashedPassword,
        imageUrl: 'https://images.unsplash.com/photo-1623479322729-28b25c16b011?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxkZXZlbG9wZXJzfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
        roleHeadline: null,
        location: null,
        timezone: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').insertOne(user);

      // Create session
      const sessionToken = uuidv4();
      const session = {
        id: uuidv4(),
        token: sessionToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      };

      await db.collection('sessions').insertOne(session);

      const { passwordHash, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        user: userWithoutPassword, 
        token: sessionToken 
      });
    }

    // Login endpoint
    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Create session
      const sessionToken = uuidv4();
      const session = {
        id: uuidv4(),
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      };

      await db.collection('sessions').insertOne(session);

      const { passwordHash, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        user: userWithoutPassword, 
        token: sessionToken 
      });
    }

    // Logout endpoint
    if (path === 'auth/logout' && method === 'POST') {
      const authorization = request.headers.get('authorization');
      if (authorization) {
        const token = authorization.replace('Bearer ', '');
        await db.collection('sessions').deleteOne({ token });
      }
      return NextResponse.json({ success: true });
    }

    // Get current user
    if (path === 'auth/me' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      // Get user profile
      const profile = await db.collection('profiles').findOne({ userId: user.id });
      
      const { passwordHash, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        user: userWithoutPassword,
        profile: profile || null
      });
    }

    // Profile endpoints
    if (path === 'profile' && method === 'PUT') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const profileData = await request.json();
      const profileId = uuidv4();
      
      const profile = {
        id: profileId,
        userId: user.id,
        bio: profileData.bio || null,
        looksToConnect: profileData.looksToConnect || null,
        skills: profileData.skills || [],
        interests: profileData.interests || [],
        experience: profileData.experience || [],
        projects: profileData.projects || [],
        awards: profileData.awards || [],
        socials: profileData.socials || [],
        preferences: profileData.preferences || {
          desiredRoles: [],
          techStack: [],
          interestTags: [],
          locationRadiusKm: 50,
          remoteOk: true,
          availabilityHrs: 20,
          searchPeople: true,
          searchProjects: true,
          searchHackathons: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('profiles').replaceOne(
        { userId: user.id },
        profile,
        { upsert: true }
      );

      return NextResponse.json({ profile });
    }

    // Get profile
    if (path === 'profile' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const profile = await db.collection('profiles').findOne({ userId: user.id });
      return NextResponse.json({ profile });
    }

    // Explore people endpoint
    if (path === 'explore/people' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get users who haven't been swiped by current user
      const swipes = await db.collection('swipes').find({ 
        swiperId: user.id,
        targetType: 'PERSON'
      }).toArray();
      
      const swipedUserIds = swipes.map(s => s.targetId);
      
      const people = await db.collection('users').find({
        id: { $nin: [...swipedUserIds, user.id] }
      }).limit(10).toArray();

      // Get profiles for these users
      const peopleWithProfiles = await Promise.all(
        people.map(async (person) => {
          const profile = await db.collection('profiles').findOne({ userId: person.id });
          const { passwordHash, ...personWithoutPassword } = person;
          return {
            ...personWithoutPassword,
            profile: profile || null
          };
        })
      );

      return NextResponse.json({ people: peopleWithProfiles });
    }

    // Swipe endpoint
    if (path === 'swipe' && method === 'POST') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const { targetType, targetId, direction } = await request.json();

      // Prevent duplicate swipes
      const existingSwipe = await db.collection('swipes').findOne({
        swiperId: user.id,
        targetType,
        targetId
      });

      if (existingSwipe) {
        return NextResponse.json({ error: 'Already swiped' }, { status: 400 });
      }

      // Create swipe
      const swipe = {
        id: uuidv4(),
        swiperId: user.id,
        targetType,
        targetId,
        direction,
        createdAt: new Date()
      };

      await db.collection('swipes').insertOne(swipe);

      // Check for match if it's a right swipe on a person
      let match = null;
      if (direction === 'RIGHT' && targetType === 'PERSON') {
        // Check if the target user has also swiped right on current user
        const reciprocalSwipe = await db.collection('swipes').findOne({
          swiperId: targetId,
          targetType: 'PERSON',
          targetId: user.id,
          direction: 'RIGHT'
        });

        if (reciprocalSwipe) {
          // Create match
          match = {
            id: uuidv4(),
            aId: user.id,
            bId: targetId,
            context: 'PEOPLE',
            postId: null,
            createdAt: new Date()
          };

          await db.collection('matches').insertOne(match);
        }
      }

      // If it's a right swipe on a post, create an inquiry
      if (direction === 'RIGHT' && (targetType === 'HACKATHON' || targetType === 'PROJECT')) {
        const inquiry = {
          id: uuidv4(),
          postId: targetId,
          userId: user.id,
          message: null,
          status: 'PENDING',
          createdAt: new Date()
        };

        await db.collection('inquiries').insertOne(inquiry);
      }

      return NextResponse.json({ 
        swipe,
        match: match ? { ...match, isNew: true } : null
      });
    }

    // Posts endpoints
    if (path === 'posts' && method === 'POST') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const postData = await request.json();
      const post = {
        id: uuidv4(),
        type: postData.type, // HACKATHON or PROJECT
        leaderId: user.id,
        title: postData.title,
        location: postData.location || null,
        websiteUrl: postData.websiteUrl || null,
        skillsNeeded: postData.skillsNeeded || [],
        notes: postData.notes || null,
        status: 'OPEN',
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('posts').insertOne(post);
      return NextResponse.json({ post });
    }

    // Get posts
    if (path.startsWith('explore/') && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const type = path.split('/')[1]; // hackathons, projects, people

      if (type === 'hackathons' || type === 'projects') {
        // Get posts (hackathons or projects)
        const postType = type === 'hackathons' ? 'HACKATHON' : 'PROJECT';
        
        const swipes = await db.collection('swipes').find({ 
          swiperId: user.id,
          targetType: postType.toUpperCase()
        }).toArray();
        
        const swipedPostIds = swipes.map(s => s.targetId);
        
        const posts = await db.collection('posts').find({
          type: postType,
          id: { $nin: swipedPostIds },
          leaderId: { $ne: user.id }
        }).limit(10).toArray();

        // Get leader info for posts
        const postsWithLeaders = await Promise.all(
          posts.map(async (post) => {
            const leader = await db.collection('users').findOne({ id: post.leaderId });
            const leaderProfile = await db.collection('profiles').findOne({ userId: post.leaderId });
            
            if (leader) {
              const { passwordHash, ...leaderWithoutPassword } = leader;
              return {
                ...post,
                leader: {
                  ...leaderWithoutPassword,
                  profile: leaderProfile || null
                }
              };
            }
            return post;
          })
        );

        return NextResponse.json({ posts: postsWithLeaders });
      }
    }

    // Random project matcher
    if (path === 'random-project' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const swipes = await db.collection('swipes').find({ 
        swiperId: user.id,
        targetType: 'PROJECT'
      }).toArray();
      
      const swipedPostIds = swipes.map(s => s.targetId);
      
      const projects = await db.collection('posts').find({
        type: 'PROJECT',
        id: { $nin: swipedPostIds },
        leaderId: { $ne: user.id }
      }).toArray();

      if (projects.length === 0) {
        return NextResponse.json({ project: null });
      }

      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      
      // Get leader info
      const leader = await db.collection('users').findOne({ id: randomProject.leaderId });
      const leaderProfile = await db.collection('profiles').findOne({ userId: randomProject.leaderId });
      
      if (leader) {
        const { passwordHash, ...leaderWithoutPassword } = leader;
        randomProject.leader = {
          ...leaderWithoutPassword,
          profile: leaderProfile || null
        };
      }

      return NextResponse.json({ project: randomProject });
    }

    // Get matches endpoint
    if (path === 'matches' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const matches = await db.collection('matches').find({
        $or: [
          { aId: user.id },
          { bId: user.id }
        ],
        context: 'PEOPLE'
      }).toArray();

      // Get user details for matches
      const matchesWithUsers = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.aId === user.id ? match.bId : match.aId;
          const otherUser = await db.collection('users').findOne({ id: otherUserId });
          const otherProfile = await db.collection('profiles').findOne({ userId: otherUserId });
          
          if (otherUser) {
            const { passwordHash, ...userWithoutPassword } = otherUser;
            return {
              ...match,
              otherUser: {
                ...userWithoutPassword,
                profile: otherProfile || null
              }
            };
          }
          return match;
        })
      );

      return NextResponse.json({ matches: matchesWithUsers });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { handleAuth as GET, handleAuth as POST, handleAuth as PUT, handleAuth as DELETE };