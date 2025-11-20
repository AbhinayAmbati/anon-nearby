import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { generateCodename, generateSessionId, generateRoomId, calculateDistance } from '../utils/helpers.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';
import { socketRateLimiter } from '../middleware/socketRateLimiter.js';

const LOCATION_RADIUS = parseInt(process.env.LOCATION_RADIUS) || 1000; // meters

// Check if MongoDB is available
let useMongoDb = true;
let useRedis = true;

export const setupSocketHandlers = (io, redisClient) => {
  // Store session references by socket ID for proper cleanup
  const sessionsBySocketId = new Map();
  
  io.on('connection', (socket) => {
    console.log(`🟩 User connected: ${socket.id}`);
    
    // Rate limit connection attempts
    const clientIp = socket.handshake.address || socket.conn.remoteAddress;
    if (!socketRateLimiter.checkConnectionLimit(clientIp)) {
      socket.emit('error', { message: 'Too many connection attempts. Please wait.' });
      socket.disconnect();
      return;
    }
    
    let userSession = null;

    // Handle user joining the grid
    socket.on('join_grid', async (data) => {
      try {
        const { latitude, longitude } = data;
        
        if (!latitude || !longitude) {
          socket.emit('error', { message: 'Location coordinates required' });
          return;
        }

        // Rate limit location requests
        const clientIp = socket.handshake.address || socket.conn.remoteAddress;
        if (!socketRateLimiter.checkLocationLimit(clientIp)) {
          socket.emit('error', { message: 'Too many location requests. Please wait.' });
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
          } else {
            // Ensure we use in-memory storage
            await inMemoryStorage.saveSession(sessionData);
            userSession = sessionData;
          }
        } catch (error) {
          // Fall back to in-memory storage
          console.log('📝 Using in-memory storage for session data');
          useMongoDb = false;
          await inMemoryStorage.saveSession(sessionData);
          userSession = sessionData;
        }
        
        // Store location for proximity matching
        try {
          if (redisClient && useRedis) {
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
          } else {
            throw new Error('Redis not available');
          }
        } catch (error) {
          console.log('📍 Using in-memory storage for location data');
          useRedis = false;
          // Store location in memory
          inMemoryStorage.addUserLocation(sessionId, latitude, longitude);
        }
        
        socket.emit('session_created', {
          sessionId,
          codename,
          status: 'scanning'
        });
        
        // Store session reference for this socket
        sessionsBySocketId.set(socket.id, userSession);
        
        console.log(`🟩 ${codename} joined the grid at (${latitude}, ${longitude})`);
        
        // Try to find nearby users immediately
        await findNearbyUser(socket, userSession, redisClient, io, sessionsBySocketId);
        
        // Trigger scanning for all existing scanning users when someone new joins
        await triggerScanningForAllUsers(redisClient, io, sessionsBySocketId);
        
        // Set up periodic scanning for this user
        const scanningInterval = setInterval(async () => {
          // Only scan if user is still connected and in scanning mode
          if (sessionsBySocketId.has(socket.id) && userSession && !userSession.chatRoomId) {
            await findNearbyUser(socket, userSession, redisClient, io, sessionsBySocketId);
          } else {
            // Clear interval if user is no longer scanning
            clearInterval(scanningInterval);
          }
        }, 3000); // Scan every 3 seconds
        
        // Store interval reference for cleanup
        socket.scanningInterval = scanningInterval;
        
      } catch (error) {
        console.error('Error joining grid:', error);
        socket.emit('error', { message: 'Failed to join grid' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        console.log(`📤 Message attempt from socket ${socket.id}, userSession exists: ${!!userSession}`);
        
        if (!userSession || !userSession.chatRoomId) {
          console.log(`❌ No active chat for socket ${socket.id}`);
          socket.emit('error', { message: 'Not in an active chat' });
          return;
        }

        // Rate limit message sending
        if (!socketRateLimiter.checkMessageLimit(userSession.sessionId)) {
          socket.emit('error', { message: 'Too many messages. Please slow down.' });
          return;
        }

        const { message } = data;
        
        if (!message || message.trim().length === 0) {
          return;
        }

        console.log(`📝 ${userSession.codename} sending: "${message}" to room ${userSession.chatRoomId}`);

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

        // Broadcast message to the chat room (more reliable than socket IDs)
        const messageData = {
          message: message.trim(),
          from: userSession.codename,
          timestamp: new Date().toISOString(),
          senderId: userSession.sessionId
        };

        // Send to all sockets in the room
        io.to(userSession.chatRoomId).emit('message_received', messageData);

        console.log(`💬 ${userSession.codename}: ${message.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io);
    });

    // Handle manual leave
    socket.on('leave_grid', async () => {
      console.log(`🔴 User left grid: ${socket.id}`);
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io);
    });
  });
};

// Find nearby users and create chat room
const findNearbyUser = async (socket, userSession, redisClient, io, sessionsBySocketId) => {
  try {
    let nearbyUsers = [];
    
    try {
      if (redisClient && useRedis) {
        // Search for users within radius using Redis GEO
        nearbyUsers = await redisClient.geoRadius(
          'user_locations',
          userSession.location.longitude,
          userSession.location.latitude,
          LOCATION_RADIUS,
          'm',
          { WITHDIST: true }
        );
      } else {
        throw new Error('Redis not available');
      }
    } catch (error) {
      console.log('📍 Using in-memory location matching');
      useRedis = false;
      // Use in-memory location search
      nearbyUsers = inMemoryStorage.findNearbyUsers(
        userSession.location.latitude,
        userSession.location.longitude,
        LOCATION_RADIUS,
        userSession.sessionId
      );
    }

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
        await createChatRoom(userSession, nearbySession, redisClient, io, sessionsBySocketId);
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
const createChatRoom = async (user1Session, user2Session, redisClient, io, sessionsBySocketId) => {
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
    
    // Update the session references in socket handlers
    if (sessionsBySocketId.has(user1Session.socketId)) {
      sessionsBySocketId.get(user1Session.socketId).chatRoomId = roomId;
      sessionsBySocketId.get(user1Session.socketId).connectedWith = 'matched';
    }
    if (sessionsBySocketId.has(user2Session.socketId)) {
      sessionsBySocketId.get(user2Session.socketId).chatRoomId = roomId;
      sessionsBySocketId.get(user2Session.socketId).connectedWith = 'matched';
    }
    
    // Join socket rooms
    const user1Socket = io.sockets.sockets.get(user1Session.socketId);
    const user2Socket = io.sockets.sockets.get(user2Session.socketId);
    
    if (user1Socket) {
      user1Socket.join(roomId);
      // Clear scanning interval since user is now chatting
      if (user1Socket.scanningInterval) {
        clearInterval(user1Socket.scanningInterval);
        user1Socket.scanningInterval = null;
      }
      console.log(`🔗 ${user1Session.codename} joined room ${roomId}`);
    } else {
      console.log(`❌ Socket not found for ${user1Session.codename} (${user1Session.socketId})`);
    }
    
    if (user2Socket) {
      user2Socket.join(roomId);
      // Clear scanning interval since user is now chatting
      if (user2Socket.scanningInterval) {
        clearInterval(user2Socket.scanningInterval);
        user2Socket.scanningInterval = null;
      }
      console.log(`🔗 ${user2Session.codename} joined room ${roomId}`);
    } else {
      console.log(`❌ Socket not found for ${user2Session.codename} (${user2Session.socketId})`);
    }
    
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
    console.log(`🧹 Starting cleanup for: ${userSession.codename} (${userSession.sessionId})`);
    
    // If user was in a chat room, notify the other user and cleanup
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
        console.log(`🔗 Cleaning up chat room: ${chatRoom.roomId}`);
        
        // Notify and disconnect the other participant
        let otherParticipantSessionId = null;
        chatRoom.participants.forEach(participant => {
          if (participant.sessionId !== userSession.sessionId) {
            otherParticipantSessionId = participant.sessionId;
            const otherSocket = io.sockets.sockets.get(participant.socketId);
            if (otherSocket) {
              otherSocket.emit('partner_disconnected', {
                message: 'Your chat partner has disconnected'
              });
              otherSocket.leave(userSession.chatRoomId);
            }
          }
        });
        
        // Update other participant's session to remove chat room reference
        if (otherParticipantSessionId) {
          try {
            if (useMongoDb) {
              await ActiveSession.updateOne(
                { sessionId: otherParticipantSessionId },
                { $unset: { chatRoomId: 1 }, connectedWith: null }
              );
            } else {
              await inMemoryStorage.updateSession(otherParticipantSessionId, { 
                chatRoomId: null, 
                connectedWith: null 
              });
            }
          } catch (error) {
            useMongoDb = false;
            await inMemoryStorage.updateSession(otherParticipantSessionId, { 
              chatRoomId: null, 
              connectedWith: null 
            });
          }
        }
        
        // Completely delete the chat room (not just mark inactive)
        try {
          if (useMongoDb) {
            await ChatRoom.deleteOne({ roomId: chatRoom.roomId });
            console.log(`🗑️ Deleted chat room from MongoDB: ${chatRoom.roomId}`);
          } else {
            await inMemoryStorage.deleteChatRoom(chatRoom.roomId);
            console.log(`🗑️ Deleted chat room from memory: ${chatRoom.roomId}`);
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.deleteChatRoom(chatRoom.roomId);
          console.log(`🗑️ Deleted chat room from memory (fallback): ${chatRoom.roomId}`);
        }
      }
    }
    
    // Remove user location from Redis/in-memory storage
    try {
      if (redisClient && useRedis) {
        await redisClient.geoRem('user_locations', userSession.sessionId);
        await redisClient.del(`session:${userSession.sessionId}`);
        console.log(`🗑️ Removed location and session from Redis: ${userSession.sessionId}`);
      }
    } catch (error) {
      useRedis = false;
      console.log('📝 Redis cleanup failed, relying on in-memory cleanup');
    }
    
    // Completely delete the user session
    try {
      if (useMongoDb) {
        const result = await ActiveSession.deleteOne({ sessionId: userSession.sessionId });
        console.log(`🗑️ Deleted session from MongoDB: ${userSession.sessionId} (${result.deletedCount} deleted)`);
      } else {
        const result = await inMemoryStorage.deleteSession(userSession.sessionId);
        console.log(`🗑️ Deleted session from memory: ${userSession.sessionId} (${result.deletedCount} deleted)`);
      }
    } catch (error) {
      useMongoDb = false;
      const result = await inMemoryStorage.deleteSession(userSession.sessionId);
      console.log(`🗑️ Deleted session from memory (fallback): ${userSession.sessionId} (${result.deletedCount} deleted)`);
    }
    
    console.log(`✅ Complete cleanup finished for: ${userSession.codename}`);
    
  } catch (error) {
    console.error('❌ Error handling disconnection:', error);
  }
};

// Trigger scanning for all users currently in scanning mode
const triggerScanningForAllUsers = async (redisClient, io, sessionsBySocketId) => {
  try {
    console.log(`🔄 Triggering scan for all users...`);
    
    // Get all scanning sessions
    let scanningSessions = [];
    
    try {
      if (useMongoDb) {
        scanningSessions = await ActiveSession.find({
          isActive: true,
          chatRoomId: { $exists: false }
        });
      } else {
        // Get all sessions from in-memory storage
        const allSessions = await inMemoryStorage.findActiveSessions();
        scanningSessions = allSessions.filter(session => !session.chatRoomId);
      }
    } catch (error) {
      useMongoDb = false;
      const allSessions = await inMemoryStorage.findActiveSessions();
      scanningSessions = allSessions.filter(session => !session.chatRoomId);
    }
    
    // Trigger scan for each scanning user
    for (const session of scanningSessions) {
      const socket = io.sockets.sockets.get(session.socketId);
      if (socket && sessionsBySocketId.has(session.socketId)) {
        // Small delay to prevent overwhelming the system
        setTimeout(async () => {
          await findNearbyUser(socket, session, redisClient, io, sessionsBySocketId);
        }, Math.random() * 1000); // Random delay 0-1 second
      }
    }
    
  } catch (error) {
    console.error('Error triggering scans:', error);
  }
};