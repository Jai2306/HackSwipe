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

    // Get inquiries for user's posts
    if (path === 'inquiries' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get user's posts
      const userPosts = await db.collection('posts').find({ leaderId: user.id }).toArray();
      const postIds = userPosts.map(p => p.id);

      // Get inquiries for these posts
      const inquiries = await db.collection('inquiries').find({
        postId: { $in: postIds }
      }).toArray();

      // Get user details for inquiries
      const inquiriesWithUsers = await Promise.all(
        inquiries.map(async (inquiry) => {
          const inquiryUser = await db.collection('users').findOne({ id: inquiry.userId });
          const inquiryProfile = await db.collection('profiles').findOne({ userId: inquiry.userId });
          const post = userPosts.find(p => p.id === inquiry.postId);
          
          if (inquiryUser) {
            const { passwordHash, ...userWithoutPassword } = inquiryUser;
            return {
              ...inquiry,
              user: {
                ...userWithoutPassword,
                profile: inquiryProfile || null
              },
              post: post || null
            };
          }
          return inquiry;
        })
      );

      return NextResponse.json({ inquiries: inquiriesWithUsers });
    }

    // Accept/Decline inquiry
    if (path.startsWith('inquiries/') && method === 'PATCH') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const inquiryId = path.split('/')[1];
      const { status } = await request.json();

      // Verify user owns the post
      const inquiry = await db.collection('inquiries').findOne({ id: inquiryId });
      if (!inquiry) {
        return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
      }

      const post = await db.collection('posts').findOne({ id: inquiry.postId });
      if (!post || post.leaderId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Update inquiry status
      await db.collection('inquiries').updateOne(
        { id: inquiryId },
        { $set: { status } }
      );

      // If accepted, create a match
      if (status === 'ACCEPTED') {
        const match = {
          id: uuidv4(),
          aId: user.id,
          bId: inquiry.userId,
          context: 'POST',
          postId: inquiry.postId,
          createdAt: new Date()
        };

        await db.collection('matches').insertOne(match);
      }

      return NextResponse.json({ success: true });
    }

    // Messages endpoints
    if (path === 'conversations' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get conversations where user is a participant
      const participants = await db.collection('conversationParticipants').find({
        userId: user.id
      }).toArray();

      const conversationIds = participants.map(p => p.conversationId);
      
      const conversations = await db.collection('conversations').find({
        id: { $in: conversationIds }
      }).toArray();

      // Get latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const latestMessage = await db.collection('messages').findOne(
            { conversationId: conv.id },
            { sort: { createdAt: -1 } }
          );

          // Get other participants
          const allParticipants = await db.collection('conversationParticipants').find({
            conversationId: conv.id
          }).toArray();

          const otherParticipants = await Promise.all(
            allParticipants
              .filter(p => p.userId !== user.id)
              .map(async (p) => {
                const participant = await db.collection('users').findOne({ id: p.userId });
                if (participant) {
                  const { passwordHash, ...userWithoutPassword } = participant;
                  return userWithoutPassword;
                }
                return null;
              })
          );

          return {
            ...conv,
            latestMessage: latestMessage || null,
            participants: otherParticipants.filter(p => p !== null)
          };
        })
      );

      return NextResponse.json({ conversations: conversationsWithMessages });
    }

    if (path === 'conversations' && method === 'POST') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const { participantIds, isGroup, name, postId } = await request.json();

      const conversationId = uuidv4();
      const conversation = {
        id: conversationId,
        isGroup: isGroup || false,
        name: name || null,
        postId: postId || null,
        createdAt: new Date()
      };

      await db.collection('conversations').insertOne(conversation);

      // Add participants
      const allParticipants = [user.id, ...participantIds];
      const participantDocs = allParticipants.map((userId, index) => ({
        id: uuidv4(),
        conversationId: conversationId,
        userId: userId,
        role: index === 0 ? 'OWNER' : 'MEMBER'
      }));

      await db.collection('conversationParticipants').insertMany(participantDocs);

      return NextResponse.json({ conversation });
    }

    // Get messages for a conversation
    if (path.startsWith('conversations/') && path.includes('/messages') && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const conversationId = path.split('/')[1];

      // Verify user is participant
      const participant = await db.collection('conversationParticipants').findOne({
        conversationId: conversationId,
        userId: user.id
      });

      if (!participant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const messages = await db.collection('messages').find({
        conversationId: conversationId
      }).sort({ createdAt: 1 }).toArray();

      // Get sender details for messages
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await db.collection('users').findOne({ id: message.senderId });
          if (sender) {
            const { passwordHash, ...senderWithoutPassword } = sender;
            return {
              ...message,
              sender: senderWithoutPassword
            };
          }
          return message;
        })
      );

      return NextResponse.json({ messages: messagesWithSenders });
    }

    // Send message
    if (path === 'messages' && method === 'POST') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const { conversationId, content, attachmentUrl } = await request.json();

      // Verify user is participant
      const participant = await db.collection('conversationParticipants').findOne({
        conversationId: conversationId,
        userId: user.id
      });

      if (!participant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const message = {
        id: uuidv4(),
        conversationId: conversationId,
        senderId: user.id,
        content: content || null,
        attachmentUrl: attachmentUrl || null,
        createdAt: new Date()
      };

      await db.collection('messages').insertOne(message);

      // Get sender details
      const { passwordHash, ...userWithoutPassword } = user;
      const messageWithSender = {
        ...message,
        sender: userWithoutPassword
      };

      return NextResponse.json({ message: messageWithSender });
    }

    // Get user's own posts
    if (path === 'posts/my-posts' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const posts = await db.collection('posts').find({ leaderId: user.id }).toArray();
      
      // Get inquiry counts for each post
      const postsWithStats = await Promise.all(
        posts.map(async (post) => {
          const inquiryCount = await db.collection('inquiries').countDocuments({ postId: post.id });
          const acceptedInquiries = await db.collection('inquiries').countDocuments({ 
            postId: post.id, 
            status: 'ACCEPTED' 
          });
          
          return {
            ...post,
            inquiryCount,
            acceptedCount: acceptedInquiries
          };
        })
      );

      return NextResponse.json({ posts: postsWithStats });
    }

    // Update user's post
    if (path.startsWith('posts/') && method === 'PUT') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const postId = path.split('/')[1];
      const postData = await request.json();

      // Verify user owns the post
      const post = await db.collection('posts').findOne({ id: postId, leaderId: user.id });
      if (!post) {
        return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
      }

      // Validate required fields
      if (!postData.title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      if (!postData.location?.trim()) {
        return NextResponse.json({ error: 'Location is required' }, { status: 400 });
      }

      await db.collection('posts').updateOne(
        { id: postId },
        { 
          $set: {
            title: postData.title.trim(),
            location: postData.location.trim(),
            websiteUrl: postData.websiteUrl || null,
            skillsNeeded: postData.skillsNeeded || [],
            notes: postData.notes || null,
            updatedAt: new Date()
          }
        }
      );

      const updatedPost = await db.collection('posts').findOne({ id: postId });
      return NextResponse.json({ post: updatedPost });
    }

    // Delete user's post
    if (path.startsWith('posts/') && method === 'DELETE') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const postId = path.split('/')[1];

      // Verify user owns the post
      const post = await db.collection('posts').findOne({ id: postId, leaderId: user.id });
      if (!post) {
        return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
      }

      // Delete related inquiries
      await db.collection('inquiries').deleteMany({ postId: postId });
      
      // Delete the post
      await db.collection('posts').deleteOne({ id: postId });

      return NextResponse.json({ success: true });
    }

    // Get notifications
    if (path === 'notifications' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const notifications = [];

      // Get real matches for notifications
      const userMatches = await db.collection('matches').find({
        $or: [{ aId: user.id }, { bId: user.id }]
      }).sort({ createdAt: -1 }).limit(3).toArray();

      for (const match of userMatches) {
        const otherUserId = match.aId === user.id ? match.bId : match.aId;
        const otherUser = await db.collection('users').findOne({ id: otherUserId });
        
        if (otherUser) {
          notifications.push({
            id: uuidv4(),
            type: 'MATCH',
            message: `You matched with ${otherUser.name}!`,
            createdAt: match.createdAt,
            read: false,
            userId: otherUser.id,
            userName: otherUser.name
          });
        }
      }

      // Get real inquiries for notifications
      const userPosts = await db.collection('posts').find({ leaderId: user.id }).toArray();
      const postIds = userPosts.map(p => p.id);

      const recentInquiries = await db.collection('inquiries').find({
        postId: { $in: postIds },
        status: 'PENDING'
      }).sort({ createdAt: -1 }).limit(2).toArray();

      for (const inquiry of recentInquiries) {
        const inquiryUser = await db.collection('users').findOne({ id: inquiry.userId });
        const post = userPosts.find(p => p.id === inquiry.postId);
        
        if (inquiryUser && post) {
          notifications.push({
            id: uuidv4(),
            type: 'INQUIRY',
            message: `${inquiryUser.name} is interested in your ${post.type.toLowerCase()}: ${post.title}`,
            createdAt: inquiry.createdAt,
            read: false,
            userId: inquiryUser.id,
            userName: inquiryUser.name,
            postId: post.id,
            postTitle: post.title
          });
        }
      }

      // Get recent conversations for message notifications
      const participants = await db.collection('conversationParticipants').find({
        userId: user.id
      }).limit(2).toArray();

      for (const participant of participants) {
        const recentMessage = await db.collection('messages').findOne(
          { 
            conversationId: participant.conversationId,
            senderId: { $ne: user.id }
          },
          { sort: { createdAt: -1 } }
        );

        if (recentMessage && new Date() - new Date(recentMessage.createdAt) < 24 * 60 * 60 * 1000) {
          const sender = await db.collection('users').findOne({ id: recentMessage.senderId });
          if (sender) {
            notifications.push({
              id: uuidv4(),
              type: 'MESSAGE',
              message: `New message from ${sender.name}`,
              createdAt: recentMessage.createdAt,
              read: false,
              userId: sender.id,
              userName: sender.name,
              conversationId: participant.conversationId
            });
          }
        }
      }

      // Sort notifications by date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return NextResponse.json({ notifications: notifications.slice(0, 5) });
    }

    // Create dummy data for demo
    if (path === 'dummy-data' && method === 'POST') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      try {
        // Create comprehensive dummy users with profiles
        const dummyUsers = [
          {
            id: uuidv4(),
            email: "aisha.kandhari@gmail.com",
            name: "Aisha Kandhari",
            username: "aisha_kandhari",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw1fHx3b21hbiUyMGRldmVsb3BlcnxlbnwwfHx8fDE3NTk2MDg5NzZ8MA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Senior AI/ML Engineer & TensorFlow Specialist",
            location: "San Francisco, CA",
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "alejandro.rivera@outlook.com",
            name: "Alejandro Rivera",
            username: "alejandro_rivera", 
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHw3fHxtYW4lMjBkZXZlbG9wZXJ8ZW58MHx8fHwxNzU5NjA4OTc2fDA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "React Native Expert & Mobile Architecture Lead",
            location: "Austin, TX",
            timezone: "CST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "maya.patel.dev@proton.me",
            name: "Maya Patel",
            username: "maya_patel",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHw5fHx3b21hbiUyMGRldmVsb3BlcnxlbnwwfHx8fDE3NTk2MDg5NzZ8MA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Cloud DevOps Engineer & Kubernetes Guru",
            location: "Seattle, WA", 
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "james.kim.blockchain@yahoo.com",
            name: "James Kim",
            username: "james_kim",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxMXx8bWFuJTIwZGV2ZWxvcGVyfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Senior Solidity Developer & DeFi Protocol Architect",
            location: "New York, NY",
            timezone: "EST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "emily.johnson.ai@stanford.edu",
            name: "Dr. Emily Johnson",
            username: "emily_johnson",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxM3x8d29tYW4lMjBkZXZlbG9wZXJ8ZW58MHx8fHwxNzU5NjA4OTc2fDA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Principal Data Scientist & Computer Vision Researcher",
            location: "Palo Alto, CA",
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "carlos.mendoza.security@gmail.com",
            name: "Carlos Mendoza",
            username: "carlos_mendoza",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxNXx8bWFuJTIwZGV2ZWxvcGVyfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Cybersecurity Lead & Red Team Specialist",
            location: "Miami, FL",
            timezone: "EST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "lisa.wong.design@adobe.com",
            name: "Lisa Wong",
            username: "lisa_wong",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxN3x8d29tYW4lMjBkZXZlbG9wZXJ8ZW58MHx8fHwxNzU5NjA4OTc2fDA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Senior Product Designer & Design Systems Lead",
            location: "Los Angeles, CA",
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "fatima.al.zahra@mit.edu",
            name: "Fatima Al-Zahra",
            username: "fatima_alzahra",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw5fHx3b21hbiUyMHRlY2h8ZW58MHx8fHwxNzU5NjA4OTc2fDA&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Full-Stack Engineer & Open Source Contributor",
            location: "Cambridge, MA",
            timezone: "EST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "raj.sharma.backend@google.com",
            name: "Rajesh Sharma",
            username: "raj_sharma",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxMXx8bWFuJTIwZGV2ZWxvcGVyfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Backend Systems Architect & Microservices Expert",
            location: "Mountain View, CA",
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            email: "zoe.nakamura.game@unity3d.com",
            name: "Zoe Nakamura",
            username: "zoe_nakamura",
            passwordHash: await bcrypt.hash("dummy123", 10),
            imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxM3x8d29tYW4lMjBnYW1lJTIwZGV2ZWxvcGVyfGVufDB8fHx8MTc1OTYwODk3Nnww&ixlib=rb-4.1.0&q=85',
            roleHeadline: "Game Developer & AR/VR Enthusiast",
            location: "San Jose, CA",
            timezone: "PST",
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Insert dummy users
        for (const dummyUser of dummyUsers) {
          const existingUser = await db.collection('users').findOne({ email: dummyUser.email });
          if (!existingUser) {
            await db.collection('users').insertOne(dummyUser);

            // Create comprehensive profiles for dummy users
            const profilesData = {
              "aisha.kandhari@gmail.com": {
                bio: "Senior AI/ML Engineer with 8+ years of experience at top tech companies. Passionate about building ethical AI systems that make a real-world impact. Previously led ML infrastructure at Meta and currently consulting for healthcare startups.",
                looksToConnect: "Seeking passionate backend engineers and data scientists to revolutionize healthcare AI diagnostics",
                skills: ["Python", "TensorFlow", "PyTorch", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes", "MLOps", "Computer Vision", "NLP"],
                interests: ["AI/ML", "Healthcare Tech", "Social Impact", "Computer Vision", "Ethics in AI", "MLOps"],
                experience: [{
                  title: "Senior AI/ML Engineer",
                  org: "Meta (Facebook)",
                  startDate: "2019-03-01",
                  endDate: "2023-12-01",
                  description: "Led computer vision team for Instagram content moderation, scaled ML models to billions of users"
                }, {
                  title: "ML Engineering Consultant",
                  org: "HealthTech Ventures",
                  startDate: "2024-01-01",
                  endDate: null,
                  description: "Building AI diagnostic tools for early disease detection"
                }],
                projects: [{
                  name: "MediScan AI",
                  description: "Deep learning platform for medical image analysis and early disease detection",
                  tech: ["PyTorch", "FastAPI", "React", "Docker"],
                  repoUrl: "https://github.com/aisha/mediscan",
                  demoUrl: "https://mediscan.health"
                }]
              },
              "alejandro.rivera@outlook.com": {
                bio: "Mobile developer creating intuitive user experiences. Love React Native and Flutter! 6 years of cross-platform development.",
                looksToConnect: "Seeking UI/UX designers and frontend developers for a mobile gaming startup",
                skills: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "JavaScript", "TypeScript", "Unity"],
                interests: ["Mobile Development", "Gaming", "AR/VR", "UI/UX Design", "EdTech"],
                experience: [{
                  title: "Lead Mobile Developer",
                  org: "AppCraft Studios",
                  startDate: "2021-03-01",
                  endDate: null,
                  description: "Leading mobile development for consumer apps"
                }],
                projects: [{
                  name: "GameHub Mobile",
                  description: "Cross-platform gaming social network",
                  tech: ["React Native", "Firebase", "Redux"],
                  repoUrl: "https://github.com/alex/gamehub",
                  demoUrl: "https://gamehub.app"
                }]
              },
              "maya.patel@example.com": {
                bio: "DevOps engineer focused on sustainable technology. Building green infrastructure for the future with 4+ years experience.",
                looksToConnect: "Need full-stack developers for climate action platform",
                skills: ["Docker", "Kubernetes", "AWS", "Python", "Vue.js", "PostgreSQL", "Terraform", "Jenkins"],
                interests: ["DevOps", "Climate Tech", "Web Development", "Cloud Computing", "Sustainability"],
                experience: [{
                  title: "Senior DevOps Engineer",
                  org: "GreenTech Solutions",
                  startDate: "2020-06-01",
                  endDate: null,
                  description: "Building sustainable cloud infrastructure"
                }],
                projects: [{
                  name: "Carbon Tracker",
                  description: "Platform for tracking and reducing carbon footprints",
                  tech: ["Vue.js", "Docker", "AWS"],
                  repoUrl: "https://github.com/maya/carbontracker",
                  demoUrl: "https://carbontrack.green"
                }]
              },
              "james.kim@example.com": {
                bio: "Blockchain developer passionate about Web3 and decentralized applications. 3+ years in DeFi and smart contracts.",
                looksToConnect: "Looking for frontend developers and designers for a DeFi protocol",
                skills: ["Solidity", "Web3", "React", "Node.js", "Ethereum", "JavaScript", "TypeScript", "Hardhat"],
                interests: ["Web3", "Blockchain", "FinTech", "Cryptocurrency", "DeFi"],
                experience: [{
                  title: "Blockchain Developer",
                  org: "CryptoVentures LLC",
                  startDate: "2021-09-01",
                  endDate: null,
                  description: "Developing smart contracts and DeFi protocols"
                }],
                projects: [{
                  name: "DeFiSwap Protocol",
                  description: "Decentralized exchange with automated market making",
                  tech: ["Solidity", "React", "Web3"],
                  repoUrl: "https://github.com/james/defiswap",
                  demoUrl: "https://defiswap.finance"
                }]
              },
              "emily.johnson@example.com": {
                bio: "Data scientist and ML researcher with expertise in NLP and computer vision. PhD in Computer Science, 7+ years experience.",
                looksToConnect: "Seeking software engineers for an AI research project in healthcare",
                skills: ["Python", "PyTorch", "TensorFlow", "R", "SQL", "Pandas", "Jupyter", "Scikit-learn"],
                interests: ["AI/ML", "Data Science", "Healthcare", "Research", "NLP"],
                experience: [{
                  title: "Senior Data Scientist",
                  org: "BioAI Research Lab",
                  startDate: "2019-01-01",
                  endDate: null,
                  description: "Leading AI research in healthcare applications"
                }],
                projects: [{
                  name: "MedAssist AI",
                  description: "AI-powered diagnostic assistance tool",
                  tech: ["Python", "PyTorch", "Flask"],
                  repoUrl: "https://github.com/emily/medassist",
                  demoUrl: "https://medassist.ai"
                }]
              },
              "david.martinez@example.com": {
                bio: "Cybersecurity expert and ethical hacker with 8+ years protecting digital assets. Certified ethical hacker and security consultant.",
                looksToConnect: "Looking for developers to build secure applications and security tools",
                skills: ["Python", "JavaScript", "Go", "Kali Linux", "Wireshark", "Metasploit", "AWS Security", "Penetration Testing"],
                interests: ["Cybersecurity", "Ethical Hacking", "Privacy", "Security Tools", "Penetration Testing"],
                experience: [{
                  title: "Senior Security Engineer",
                  org: "SecureNet Inc",
                  startDate: "2018-04-01",
                  endDate: null,
                  description: "Leading security assessments and penetration testing"
                }],
                projects: [{
                  name: "SecureScan",
                  description: "Automated vulnerability scanner for web applications",
                  tech: ["Python", "Go", "Docker"],
                  repoUrl: "https://github.com/david/securescan",
                  demoUrl: "https://securescan.tools"
                }]
              },
              "lisa.wong@example.com": {
                bio: "Product manager and UX designer bridging the gap between user needs and technical solutions. 5+ years in product strategy.",
                looksToConnect: "Seeking developers and designers for a user-centric productivity app",
                skills: ["Figma", "Sketch", "JavaScript", "React", "Product Strategy", "User Research", "Prototyping", "A/B Testing"],
                interests: ["UI/UX Design", "Product Management", "User Research", "Design Systems", "EdTech"],
                experience: [{
                  title: "Senior Product Manager",
                  org: "ProductCorp",
                  startDate: "2020-02-01",
                  endDate: null,
                  description: "Leading product strategy for consumer applications"
                }],
                projects: [{
                  name: "FlowState",
                  description: "Productivity app with focus-enhancing features",
                  tech: ["React", "Node.js", "Figma"],
                  repoUrl: "https://github.com/lisa/flowstate",
                  demoUrl: "https://flowstate.app"
                }]
              }
            };

            const profiles = {
              [dummyUser.email]: {
                id: uuidv4(),
                userId: dummyUser.id,
                bio: profilesData[dummyUser.email].bio,
                looksToConnect: profilesData[dummyUser.email].looksToConnect,
                skills: profilesData[dummyUser.email].skills,
                interests: profilesData[dummyUser.email].interests,
                experience: profilesData[dummyUser.email].experience,
                projects: profilesData[dummyUser.email].projects,
                awards: [],
                socials: [{
                  type: "GITHUB",
                  url: `https://github.com/${dummyUser.username}`
                }],
                preferences: {
                  desiredRoles: ["Developer", "Engineer"],
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
              }
            };

            await db.collection('profiles').insertOne(profiles[dummyUser.email]);

            // Clear existing posts from dummy users to prevent duplicates
            await db.collection('posts').deleteMany({ leaderId: dummyUser.id });

            // Create posts for some users
            if (dummyUser.email === "sarah.chen@example.com") {
              const post1 = {
                id: uuidv4(),
                type: "HACKATHON",
                leaderId: dummyUser.id,
                title: "AI for Climate Change Hackathon",
                location: "San Francisco, CA",
                websiteUrl: "https://ai4climate.org",
                skillsNeeded: ["Python", "Machine Learning", "Data Science", "TensorFlow"],
                notes: "48-hour hackathon focusing on using AI to combat climate change. $75K in prizes and mentorship from leading AI researchers!",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post1);
            }

            if (dummyUser.email === "alex.rodriguez@example.com") {
              const post2 = {
                id: uuidv4(),
                type: "PROJECT",
                leaderId: dummyUser.id,
                title: "MindfulGaming - Wellness Gaming Platform",
                location: "Remote",
                websiteUrl: "https://mindful-gaming.dev",
                skillsNeeded: ["React Native", "Unity", "UI/UX Design", "Psychology"],
                notes: "Building a gaming platform that promotes mental wellness and mindfulness. Looking for passionate developers who want to make gaming healthier!",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post2);
            }

            if (dummyUser.email === "james.kim@example.com") {
              const post3 = {
                id: uuidv4(),
                type: "HACKATHON",
                leaderId: dummyUser.id,
                title: "Web3 Social Impact Hackathon",
                location: "New York, NY",
                websiteUrl: "https://web3impact.org",
                skillsNeeded: ["Solidity", "React", "Web3", "Smart Contracts"],
                notes: "Revolutionary 3-day hackathon building decentralized applications for social good. Connect with Web3 pioneers and create the future!",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post3);
            }

            if (dummyUser.email === "emily.johnson@example.com") {
              const post4 = {
                id: uuidv4(),
                type: "PROJECT",
                leaderId: dummyUser.id,
                title: "HealthAI - Medical Diagnosis Assistant",
                location: "Boston, MA (Hybrid)",
                websiteUrl: "https://health-ai.research.edu",
                skillsNeeded: ["Python", "PyTorch", "Medical Data", "React", "API Development"],
                notes: "Open-source AI project for medical diagnosis assistance. Collaborating with hospitals and research institutions. Join us in revolutionizing healthcare!",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post4);
            }

            if (dummyUser.email === "david.martinez@example.com") {
              const post5 = {
                id: uuidv4(),
                type: "HACKATHON",
                leaderId: dummyUser.id,
                title: "CyberSec Challenge 2024",
                location: "Denver, CO",
                websiteUrl: "https://cybersec-challenge.com",
                skillsNeeded: ["Cybersecurity", "Python", "Penetration Testing", "Network Security"],
                notes: "Elite cybersecurity competition with real-world scenarios. Test your skills against the best hackers and security researchers. Prizes worth $100K!",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post5);
            }

            if (dummyUser.email === "lisa.wong@example.com") {
              const post6 = {
                id: uuidv4(),
                type: "PROJECT",
                leaderId: dummyUser.id,
                title: "EduTech Innovation Platform",
                location: "Los Angeles, CA (Remote)",
                websiteUrl: "https://edutech-innovation.org",
                skillsNeeded: ["React", "Node.js", "UI/UX Design", "Education Technology"],
                notes: "Building the next generation of educational tools. Looking for developers and designers passionate about transforming education through technology.",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post6);

              // Additional diverse hackathon
              const post7 = {
                id: uuidv4(),
                type: "HACKATHON",
                leaderId: dummyUser.id,
                title: "Design Thinking Hackathon",
                location: "Los Angeles, CA",
                websiteUrl: "https://designthinking-hack.com",
                skillsNeeded: ["UI/UX Design", "Figma", "User Research", "Prototyping"],
                notes: "24-hour design-focused hackathon. Create user-centered solutions for real-world problems with design thinking methodology.",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post7);
            }

            if (dummyUser.email === "maya.patel@example.com") {
              const post8 = {
                id: uuidv4(),
                type: "HACKATHON",
                leaderId: dummyUser.id,
                title: "Green Tech Innovation Challenge",
                location: "Seattle, WA",
                websiteUrl: "https://greentech-hack.org",
                skillsNeeded: ["Python", "IoT", "Renewable Energy", "Data Analytics"],
                notes: "3-day sustainability hackathon focusing on renewable energy solutions and environmental monitoring systems.",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post8);

              const post9 = {
                id: uuidv4(),
                type: "PROJECT",
                leaderId: dummyUser.id,
                title: "Smart City Infrastructure",
                location: "Remote",
                websiteUrl: "https://smart-city.dev",
                skillsNeeded: ["IoT", "Docker", "Kubernetes", "Microservices"],
                notes: "Building next-generation smart city infrastructure with IoT sensors and edge computing for sustainable urban living.",
                status: "OPEN",
                visibility: "PUBLIC",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await db.collection('posts').insertOne(post9);
            }
          }

          // Additional standalone posts for variety
          const additionalPosts = [
            {
              id: uuidv4(),
              type: "HACKATHON",
              leaderId: dummyUsers[0].id, // Sarah Chen
              title: "Healthcare AI Hackathon",
              location: "Boston, MA",
              websiteUrl: "https://healthcare-ai-hack.org",
              skillsNeeded: ["Python", "Healthcare", "Machine Learning", "HIPAA"],
              notes: "48-hour medical AI hackathon with real healthcare datasets. Build solutions for patient care and medical diagnosis.",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              type: "PROJECT",
              leaderId: dummyUsers[3].id, // James Kim
              title: "DeFi Insurance Protocol",
              location: "New York, NY (Hybrid)",
              websiteUrl: "https://defi-insurance.finance",
              skillsNeeded: ["Solidity", "Smart Contracts", "React", "Insurance"],
              notes: "Revolutionary decentralized insurance protocol. Join us in building the future of risk management on blockchain.",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              type: "HACKATHON",
              leaderId: dummyUsers[4].id, // Emily Johnson
              title: "EdTech Innovation Summit",
              location: "Austin, TX",
              websiteUrl: "https://edtech-summit.edu",
              skillsNeeded: ["Education", "React", "Learning Analytics", "Gamification"],
              notes: "Education technology hackathon focusing on personalized learning and student engagement. Transform education through tech!",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              type: "PROJECT",
              leaderId: dummyUsers[5].id, // David Martinez
              title: "CyberGuard Security Suite",
              location: "Denver, CO",
              websiteUrl: "https://cyberguard.security",
              skillsNeeded: ["Cybersecurity", "Python", "Network Security", "Incident Response"],
              notes: "Open-source enterprise security suite with automated threat detection and response capabilities.",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              type: "HACKATHON",
              leaderId: dummyUsers[1].id, // Alex Rodriguez
              title: "Mobile Gaming Revolution",
              location: "San Francisco, CA",
              websiteUrl: "https://mobile-gaming-hack.com",
              skillsNeeded: ["Unity", "React Native", "Game Design", "AR/VR"],
              notes: "Mobile gaming hackathon with focus on AR/VR integration. Create the next breakthrough in mobile entertainment!",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: uuidv4(),
              type: "PROJECT",
              leaderId: dummyUsers[6].id, // Lisa Wong
              title: "Accessibility Web Platform",
              location: "Remote",
              websiteUrl: "https://accessible-web.org",
              skillsNeeded: ["React", "Accessibility", "WCAG", "Screen Readers"],
              notes: "Building inclusive web experiences for users with disabilities. Help us make the internet accessible for everyone.",
              status: "OPEN",
              visibility: "PUBLIC",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];

          for (const post of additionalPosts) {
            await db.collection('posts').insertOne(post);
          }
        }

        return NextResponse.json({ success: true, message: 'Comprehensive dummy data created' });
      } catch (error) {
        console.error('Dummy data creation error:', error);
        return NextResponse.json({ error: 'Failed to create dummy data' }, { status: 500 });
      }
    }

    // Get login streak
    if (path === 'streak' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // For demo purposes, generate a streak based on user creation date
      const daysSinceJoin = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
      const streak = Math.min(daysSinceJoin + 1, 30); // Cap at 30 days

      return NextResponse.json({ streak });
    }

    // Overview statistics
    if (path === 'overview' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get user's posts
      const userPosts = await db.collection('posts').countDocuments({ leaderId: user.id });
      
      // Get user's matches
      const matches = await db.collection('matches').countDocuments({
        $or: [{ aId: user.id }, { bId: user.id }]
      });

      // Get user's swipes
      const swipes = await db.collection('swipes').countDocuments({ swiperId: user.id });

      // Get accepted inquiries (ongoing projects)
      const acceptedInquiries = await db.collection('inquiries').countDocuments({
        userId: user.id,
        status: 'ACCEPTED'
      });

      return NextResponse.json({
        stats: {
          totalPosts: userPosts,
          totalMatches: matches,
          totalSwipes: swipes,
          ongoingProjects: acceptedInquiries
        }
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export { handleAuth as GET, handleAuth as POST, handleAuth as PUT, handleAuth as DELETE };