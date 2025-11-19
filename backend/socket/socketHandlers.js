import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { generateCodename, generateSessionId, generateRoomId, calculateDistance } from '../utils/helpers.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';

const LOCATION_RADIUS = parseInt(process.env.LOCATION_RADIUS) || 1000; // meters

// Check if MongoDB is available
let useMongoDb = true;

export const setupSocketHandlers = (io, redisClient) => {
  
  io.on('connection', (socket) => {
    console.log(`🟩 User connected: ${socket.id}`);
    
    let userSession = null;

    // Handle user joining the grid
    socket.on('join_grid', async (data) => {
      try {
        const { latitude, longitude } = data;
        
        if (!latitude || !longitude) {
          socket.emit('error', { message: 'Location coordinates required' });
          return;
        }

        // Generate new session
        const sessionId = generateSessionId();
        const codename = generateCodename();
        
        const sessionData = {
          sessionId,
          codename,
          socketId: socket.id,
          location: { latitude, longitude },
          isActive: true
        };

        try {
          // Try MongoDB first
          if (useMongoDb) {
            userSession = new ActiveSession(sessionData);
            await userSession.save();
          }
        } catch (error) {
          // Fall back to in-memory storage
          console.log('📝 Using in-memory storage for session data');
          useMongoDb = false;
          await inMemoryStorage.saveSession(sessionData);
          userSession = sessionData;
        }
        
        // Store in Redis GEO for location queries
        await redisClient.geoAdd('user_locations', {
          longitude,
          latitude,
          member: sessionId
        });
        
        // Store session mapping in Redis
        await redisClient.hSet(`session:${sessionId}`, {
          socketId: socket.id,
          codename,
          latitude,
          longitude,
          isActive: 'true'
        });
        
        socket.emit('session_created', {
          sessionId,
          codename,
          status: 'scanning'
        });
        
        console.log(`🟩 ${codename} joined the grid at (${latitude}, ${longitude})`);
        
        // Try to find nearby users immediately
        await findNearbyUser(socket, userSession, redisClient, io);
        
      } catch (error) {
        console.error('Error joining grid:', error);
        socket.emit('error', { message: 'Failed to join grid' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        if (!userSession || !userSession.chatRoomId) {
          socket.emit('error', { message: 'Not in an active chat' });
          return;
        }

        const { message } = data;
        
        if (!message || message.trim().length === 0) {
          return;
        }

        let chatRoom;
        try {
          if (useMongoDb) {
            chatRoom = await ChatRoom.findOne({ 
              roomId: userSession.chatRoomId,
              isActive: true 
            });
          } else {
            chatRoom = await inMemoryStorage.findChatRoom({ 
              roomId: userSession.chatRoomId 
            });
            if (chatRoom && !chatRoom.isActive) {
              chatRoom = null;
            }
          }
        } catch (error) {
          useMongoDb = false;
          chatRoom = await inMemoryStorage.findChatRoom({ 
            roomId: userSession.chatRoomId 
          });
        }
        
        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        // Update last activity
        try {
          if (useMongoDb) {
            chatRoom.lastActivity = new Date();
            await chatRoom.save();
          } else {
            await inMemoryStorage.updateChatRoom(chatRoom.roomId, { 
              lastActivity: new Date() 
            });
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.updateChatRoom(chatRoom.roomId, { 
            lastActivity: new Date() 
          });
        }

        // Broadcast message to both participants
        const messageData = {
          message: message.trim(),
          from: userSession.codename,
          timestamp: new Date().toISOString()
        };

        chatRoom.participants.forEach(participant => {
          io.to(participant.socketId).emit('message_received', messageData);
        });

        console.log(`💬 ${userSession.codename}: ${message.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      await handleUserDisconnection(socket, userSession, redisClient, io);
    });

    // Handle manual leave
    socket.on('leave_grid', async () => {
      console.log(`🔴 User left grid: ${socket.id}`);
      await handleUserDisconnection(socket, userSession, redisClient, io);
    });
  });
};

// Find nearby users and create chat room
const findNearbyUser = async (socket, userSession, redisClient, io) => {
  try {
    // Search for users within radius using Redis GEO
    const nearbyUsers = await redisClient.geoRadius(
      'user_locations',
      userSession.location.longitude,
      userSession.location.latitude,
      LOCATION_RADIUS,
      'm',
      { WITHDIST: true }
    );

    // Filter out the current user and find available users
    for (const nearby of nearbyUsers) {
      const [memberSessionId, distance] = nearby;
      
      if (memberSessionId === userSession.sessionId) continue;
      
      // Check if user is still active and not in a chat
      let nearbySession;
      try {
        if (useMongoDb) {
          nearbySession = await ActiveSession.findOne({
            sessionId: memberSessionId,
            isActive: true,
            chatRoomId: null
          });
        } else {
          nearbySession = await inMemoryStorage.findSession({ sessionId: memberSessionId });
          if (nearbySession && (!nearbySession.isActive || nearbySession.chatRoomId)) {
            nearbySession = null;
          }
        }
      } catch (error) {
        useMongoDb = false;
        nearbySession = await inMemoryStorage.findSession({ sessionId: memberSessionId });
        if (nearbySession && (!nearbySession.isActive || nearbySession.chatRoomId)) {
          nearbySession = null;
        }
      }
      
      if (nearbySession) {
        // Found a match! Create chat room
        await createChatRoom(userSession, nearbySession, redisClient, io);
        return;
      }
    }
    
    // No nearby users found, stay in scanning mode
    console.log(`🔍 ${userSession.codename} scanning for nearby users...`);
    
  } catch (error) {
    console.error('Error finding nearby users:', error);
  }
};

// Create a chat room between two users
const createChatRoom = async (user1Session, user2Session, redisClient, io) => {
  try {
    const roomId = generateRoomId();
    
    const chatRoomData = {
      roomId,
      participants: [
        {
          sessionId: user1Session.sessionId,
          codename: user1Session.codename,
          socketId: user1Session.socketId
        },
        {
          sessionId: user2Session.sessionId,
          codename: user2Session.codename,
          socketId: user2Session.socketId
        }
      ],
      isActive: true
    };
    
    // Create chat room in storage
    try {
      if (useMongoDb) {
        const chatRoom = new ChatRoom(chatRoomData);
        await chatRoom.save();
      } else {
        await inMemoryStorage.saveChatRoom(chatRoomData);
      }
    } catch (error) {
      useMongoDb = false;
      await inMemoryStorage.saveChatRoom(chatRoomData);
    }
    
    // Update both sessions with chat room ID
    const updateData = { chatRoomId: roomId, connectedWith: 'matched' };
    
    try {
      if (useMongoDb) {
        await ActiveSession.updateMany(
          { sessionId: { $in: [user1Session.sessionId, user2Session.sessionId] } },
          updateData
        );
      } else {
        await inMemoryStorage.updateSession(user1Session.sessionId, updateData);
        await inMemoryStorage.updateSession(user2Session.sessionId, updateData);
      }
    } catch (error) {
      useMongoDb = false;
      await inMemoryStorage.updateSession(user1Session.sessionId, updateData);
      await inMemoryStorage.updateSession(user2Session.sessionId, updateData);
    }
    
    // Update local session objects
    user1Session.chatRoomId = roomId;
    user2Session.chatRoomId = roomId;
    
    // Join socket rooms
    const user1Socket = io.sockets.sockets.get(user1Session.socketId);
    const user2Socket = io.sockets.sockets.get(user2Session.socketId);
    
    if (user1Socket) user1Socket.join(roomId);
    if (user2Socket) user2Socket.join(roomId);
    
    // Notify both users
    const connectionData = {
      roomId,
      status: 'connected',
      partnerCodename: null // Keep it anonymous for now
    };
    
    if (user1Socket) {
      user1Socket.emit('connection_established', {
        ...connectionData,
        partnerCodename: user2Session.codename
      });
    }
    
    if (user2Socket) {
      user2Socket.emit('connection_established', {
        ...connectionData,
        partnerCodename: user1Session.codename
      });
    }
    
    console.log(`🔗 Connection established: ${user1Session.codename} ↔ ${user2Session.codename}`);
    
  } catch (error) {
    console.error('Error creating chat room:', error);
  }
};

// Handle user disconnection and cleanup
const handleUserDisconnection = async (socket, userSession, redisClient, io) => {
  if (!userSession) return;
  
  try {
    // If user was in a chat room, notify the other user
    if (userSession.chatRoomId) {
      let chatRoom;
      try {
        if (useMongoDb) {
          chatRoom = await ChatRoom.findOne({ 
            roomId: userSession.chatRoomId,
            isActive: true 
          });
        } else {
          chatRoom = await inMemoryStorage.findChatRoom({ 
            roomId: userSession.chatRoomId 
          });
        }
      } catch (error) {
        useMongoDb = false;
        chatRoom = await inMemoryStorage.findChatRoom({ 
          roomId: userSession.chatRoomId 
        });
      }
      
      if (chatRoom) {
        // Notify the other participant
        chatRoom.participants.forEach(participant => {
          if (participant.sessionId !== userSession.sessionId) {
            const otherSocket = io.sockets.sockets.get(participant.socketId);
            if (otherSocket) {
              otherSocket.emit('partner_disconnected', {
                message: 'Your chat partner has disconnected'
              });
              otherSocket.leave(userSession.chatRoomId);
            }
          }
        });
        
        // Mark chat room as inactive
        try {
          if (useMongoDb) {
            chatRoom.isActive = false;
            await chatRoom.save();
          } else {
            await inMemoryStorage.updateChatRoom(chatRoom.roomId, { isActive: false });
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.updateChatRoom(chatRoom.roomId, { isActive: false });
        }
      }
    }
    
    // Remove from Redis
    await redisClient.geoRem('user_locations', userSession.sessionId);
    await redisClient.del(`session:${userSession.sessionId}`);
    
    // Remove from storage
    try {
      if (useMongoDb) {
        await ActiveSession.deleteOne({ sessionId: userSession.sessionId });
      } else {
        await inMemoryStorage.deleteSession(userSession.sessionId);
      }
    } catch (error) {
      useMongoDb = false;
      await inMemoryStorage.deleteSession(userSession.sessionId);
    }
    
    console.log(`🧹 Cleaned up session: ${userSession.codename}`);
    
  } catch (error) {
    console.error('Error handling disconnection:', error);
  }
};