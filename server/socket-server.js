const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');

const prisma = new PrismaClient();
const io = new Server(3001, {
  cors: {
    origin: ["http://localhost:3000", "https://jobflow.nl"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure VAPID keys for push notifications
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@jobflow.nl',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory storage for active users and rooms
const activeUsers = new Map(); // userId -> { socketId, status, lastSeen, currentProject }
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // roomId -> Set of userIds
const roomUsers = new Map(); // roomId -> Set of userIds

console.log('🚀 JobFlow WebSocket Server starting on port 3001...');

// User authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    if (!userId) {
      return next(new Error('Authentication required'));
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = userId;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.userId;
  const user = socket.user;

  console.log(`✅ User ${user.name} (${userId}) connected`);

  // Register user as active
  activeUsers.set(userId, {
    socketId: socket.id,
    status: 'ONLINE',
    lastSeen: new Date().toISOString(),
    currentProject: null,
    user: user
  });
  userSockets.set(socket.id, userId);

  // Broadcast user status update
  socket.broadcast.emit('userStatusUpdate', {
    userId,
    status: 'ONLINE',
    lastSeen: new Date().toISOString(),
    user: user
  });

  // Join user to their personal room for notifications
  socket.join(`user:${userId}`);

  // Send current active users list
  const activeUsersList = Array.from(activeUsers.values()).map(userData => ({
    userId: userData.user.id,
    name: userData.user.name,
    status: userData.status,
    lastSeen: userData.lastSeen,
    currentProject: userData.currentProject
  }));
  socket.emit('activeUsers', activeUsersList);

  // Handle time tracking updates
  socket.on('timeUpdate', async (data) => {
    try {
      const { action, projectId, timestamp } = data;
      
      // Update user's current project status
      if (activeUsers.has(userId)) {
        const userData = activeUsers.get(userId);
        userData.currentProject = projectId;
        userData.status = action === 'START' ? 'WORKING' : 
                         action === 'BREAK_START' ? 'BREAK' : 'ONLINE';
        activeUsers.set(userId, userData);
      }

      // Broadcast to all users
      io.emit('timeUpdate', {
        userId,
        action,
        projectId,
        timestamp: timestamp || new Date().toISOString(),
        user: user
      });

      // Send push notifications to administrators
      if (action === 'START' || action === 'END') {
        await sendPushNotificationToAdmins({
          title: `Time Tracking Update`,
          body: `${user.name} has ${action === 'START' ? 'started' : 'ended'} work`,
          data: { type: 'TIME_TRACKING', userId, action, projectId }
        });
      }

      console.log(`⏱️ Time update: ${user.name} ${action} ${projectId ? `on project ${projectId}` : ''}`);
    } catch (error) {
      console.error('Error handling time update:', error);
      socket.emit('error', { message: 'Failed to process time update' });
    }
  });

  // Handle user status updates
  socket.on('userStatusUpdate', async (data) => {
    try {
      const { status, projectId } = data;
      
      if (activeUsers.has(userId)) {
        const userData = activeUsers.get(userId);
        userData.status = status;
        userData.currentProject = projectId;
        userData.lastSeen = new Date().toISOString();
        activeUsers.set(userId, userData);
      }

      // Broadcast status update
      io.emit('userStatusUpdate', {
        userId,
        status,
        projectId,
        lastSeen: new Date().toISOString(),
        user: user
      });

      console.log(`👤 Status update: ${user.name} is now ${status}`);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  });

  // Handle joining chat rooms
  socket.on('joinRoom', async (roomId) => {
    try {
      socket.join(roomId);
      
      // Add user to room tracking
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(userId);

      // Notify room members
      socket.to(roomId).emit('userJoinedRoom', {
        roomId,
        userId,
        user: user,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 ${user.name} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle leaving chat rooms
  socket.on('leaveRoom', (roomId) => {
    try {
      socket.leave(roomId);
      
      // Remove user from room tracking
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(userId);
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
      }

      // Clear typing indicator
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(userId);
      }

      // Notify room members
      socket.to(roomId).emit('userLeftRoom', {
        roomId,
        userId,
        user: user,
        timestamp: new Date().toISOString()
      });

      console.log(`💬 ${user.name} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Handle chat messages
  socket.on('chatMessage', async (data) => {
    try {
      const { roomId, message, attachments, replyTo } = data;
      
      // Save message to database
      const chatMessage = await prisma.chatMessage.create({
        data: {
          id: generateId(),
          content: message,
          senderId: userId,
          roomId: roomId,
          type: attachments && attachments.length > 0 ? 'MEDIA' : 'TEXT',
          replyToId: replyTo || null,
          attachments: attachments ? JSON.stringify(attachments) : null
        },
        include: {
          sender: {
            select: { id: true, name: true, profileImage: true }
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      // Format message for broadcast
      const formattedMessage = {
        id: chatMessage.id,
        content: chatMessage.content,
        senderId: chatMessage.senderId,
        senderName: chatMessage.sender.name,
        senderAvatar: chatMessage.sender.profileImage,
        roomId: chatMessage.roomId,
        timestamp: chatMessage.createdAt.toISOString(),
        type: chatMessage.type.toLowerCase(),
        attachments: chatMessage.attachments ? JSON.parse(chatMessage.attachments) : [],
        replyTo: chatMessage.replyTo ? {
          id: chatMessage.replyTo.id,
          content: chatMessage.replyTo.content,
          senderName: chatMessage.replyTo.sender.name
        } : null
      };

      // Broadcast to room
      io.to(roomId).emit('newChatMessage', formattedMessage);

      // Send push notifications to room members
      const roomMembers = Array.from(roomUsers.get(roomId) || []);
      await sendPushNotificationToUsers(roomMembers.filter(id => id !== userId), {
        title: `New message from ${user.name}`,
        body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        data: { type: 'CHAT_MESSAGE', roomId, messageId: chatMessage.id }
      });

      console.log(`💬 Message in ${roomId}: ${user.name}: ${message.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    try {
      const { roomId, isTyping } = data;
      
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }

      if (isTyping) {
        typingUsers.get(roomId).add(userId);
      } else {
        typingUsers.get(roomId).delete(userId);
      }

      // Broadcast typing status to room (excluding sender)
      socket.to(roomId).emit('userTyping', {
        roomId,
        userId,
        userName: user.name,
        isTyping,
        typingUsers: Array.from(typingUsers.get(roomId) || [])
      });
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  // Handle project updates
  socket.on('projectUpdate', async (data) => {
    try {
      const { projectId, type, details } = data;
      
      // Broadcast to all project members
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      if (project) {
        const memberIds = project.assignments.map(assignment => assignment.userId);
        
        // Send to all project members
        memberIds.forEach(memberId => {
          io.to(`user:${memberId}`).emit('projectUpdate', {
            projectId,
            projectName: project.name,
            type,
            details,
            updatedBy: user.name,
            timestamp: new Date().toISOString()
          });
        });

        console.log(`📋 Project update: ${type} on ${project.name} by ${user.name}`);
      }
    } catch (error) {
      console.error('Error handling project update:', error);
    }
  });

  // Handle notifications
  socket.on('notification', async (data) => {
    try {
      const { targetUserId, type, title, message, priority = 'normal' } = data;
      
      // Save notification to database
      const notification = await prisma.systemNotification.create({
        data: {
          id: generateId(),
          userId: targetUserId,
          type: type.toUpperCase(),
          title,
          message,
          priority: priority.toUpperCase(),
          read: false,
          senderId: userId
        }
      });

      // Send real-time notification
      io.to(`user:${targetUserId}`).emit('newNotification', {
        id: notification.id,
        type: notification.type.toLowerCase(),
        title: notification.title,
        message: notification.message,
        priority: notification.priority.toLowerCase(),
        read: notification.read,
        timestamp: notification.createdAt.toISOString(),
        sender: user.name
      });

      // Send push notification
      await sendPushNotificationToUsers([targetUserId], {
        title,
        body: message,
        data: { type: 'NOTIFICATION', notificationId: notification.id }
      });

      console.log(`🔔 Notification sent: ${title} to user ${targetUserId}`);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User ${user.name} (${userId}) disconnected`);
    
    // Update user status
    if (activeUsers.has(userId)) {
      const userData = activeUsers.get(userId);
      userData.status = 'OFFLINE';
      userData.lastSeen = new Date().toISOString();
      activeUsers.set(userId, userData);
    }

    // Clean up
    userSockets.delete(socket.id);
    
    // Remove from all typing indicators
    typingUsers.forEach((users, roomId) => {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(roomId).emit('userTyping', {
          roomId,
          userId,
          userName: user.name,
          isTyping: false,
          typingUsers: Array.from(users)
        });
      }
    });

    // Remove from room tracking
    roomUsers.forEach((users, roomId) => {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(roomId).emit('userLeftRoom', {
          roomId,
          userId,
          user: user,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Broadcast user offline status
    socket.broadcast.emit('userStatusUpdate', {
      userId,
      status: 'OFFLINE',
      lastSeen: new Date().toISOString(),
      user: user
    });
  });
});

// Helper functions
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function sendPushNotificationToAdmins(payload) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: { pushSubscriptions: true }
    });

    const notifications = admins.flatMap(admin => 
      admin.pushSubscriptions.map(subscription => 
        webpush.sendNotification(JSON.parse(subscription.subscription), JSON.stringify(payload))
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending push notifications to admins:', error);
  }
}

async function sendPushNotificationToUsers(userIds, payload) {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { pushSubscriptions: true }
    });

    const notifications = users.flatMap(user => 
      user.pushSubscriptions.map(subscription => 
        webpush.sendNotification(JSON.parse(subscription.subscription), JSON.stringify(payload))
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending push notifications to users:', error);
  }
}

// Cleanup function for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down WebSocket server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down WebSocket server...');
  await prisma.$disconnect();
  process.exit(0);
});

console.log('✅ JobFlow WebSocket Server running on port 3001'); 