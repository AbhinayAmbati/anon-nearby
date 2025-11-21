import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { generateCodename, generateSessionId, generateRoomId, calculateDistance } from '../utils/helpers.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';
import { socketRateLimiter } from '../middleware/socketRateLimiter.js';
import SmartMatchmakingEngine from '../services/matchmakingEngine.js';
import AbuseDetectionLayer from '../middleware/abuseDetection.js';
import crypto from 'crypto';

const LOCATION_RADIUS = parseInt(process.env.LOCATION_RADIUS) || 1000; // meters
const CHAT_TIMEOUT_MINUTES = parseInt(process.env.CHAT_TIMEOUT_MINUTES) || 10; // Default 10 minutes

// Check if MongoDB is available
let useMongoDb = true;
let useRedis = true;

export const setupSocketHandlers = (io, redisClient) => {
  // Store session references by socket ID for proper cleanup
  const sessionsBySocketId = new Map();
  
  // Store activity timeouts for chat rooms
  const chatTimeouts = new Map();
  
  // Initialize Smart Matchmaking Engine
  const matchmakingEngine = new SmartMatchmakingEngine(redisClient);
  
  // Initialize Abuse Detection Layer with Gemini AI
  const abuseDetector = new AbuseDetectionLayer(redisClient);
  
  // Make abuse detector available globally for admin routes
  global.abuseDetectorInstance = abuseDetector;
  
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
    
    // Track connection for abuse detection (will be set when user joins grid)
    let connectionTrackingEnabled = false;

    // Handle user joining the grid
    socket.on('join_grid', async (data) => {
      try {
        const { latitude, longitude, radius } = data;
        
        if (!latitude || !longitude) {
          socket.emit('error', { message: 'Location coordinates required' });
          return;
        }

        // Validate radius parameter (default to 1000m if not provided or invalid)
        const searchRadius = radius && [500, 1000, 3000, 5000].includes(radius) ? radius : 1000;

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
          searchRadius: searchRadius,
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
        
        // Track connection for abuse detection
        if (!connectionTrackingEnabled) {
          await abuseDetector.trackConnectionAbuse(
            abuseDetector.hashUserId(userSession.sessionId), 
            'connect'
          );
          connectionTrackingEnabled = true;
        }
        
        console.log(`🟩 ${codename} joined the grid at (${latitude}, ${longitude})`);
        
        // Try to find nearby users immediately
        await findNearbyUser(socket, userSession, redisClient, io, sessionsBySocketId, matchmakingEngine);
        
        // Trigger scanning for all existing scanning users when someone new joins
        await triggerScanningForAllUsers(redisClient, io, sessionsBySocketId, matchmakingEngine);
        
        // Set up periodic scanning for this user
        const scanningInterval = setInterval(async () => {
          // Only scan if user is still connected and in scanning mode
          if (sessionsBySocketId.has(socket.id) && userSession && !userSession.chatRoomId) {
            await findNearbyUser(socket, userSession, redisClient, io, sessionsBySocketId, matchmakingEngine);
          } else {
            // Clear interval if user is no longer scanning
            clearInterval(scanningInterval);
          }
        }, 1000); // Scan every 1 second for faster connections
        
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

        // 🤖 GEMINI AI ABUSE DETECTION LAYER
        const abuseResult = await abuseDetector.detectAbuse(
          userSession.sessionId,
          message.trim(),
          socket.id,
          'chat'
        );
        
        // Handle abuse detection results
        if (abuseResult.isBlocked) {
          // Different messages based on the action type
          let dialogTitle = 'Message Not Allowed';
          let dialogMessage = 'Your message cannot be sent because it contains inappropriate content. Please keep conversations respectful and friendly.';
          
          if (abuseResult.action === 'content_warning') {
            dialogTitle = 'Inappropriate Content Detected';
            dialogMessage = 'Your message contains inappropriate language or content that violates our community guidelines. Please use respectful language in your conversations.';
          }
          
          socket.emit('message_blocked', {
            type: 'inappropriate_content',
            title: dialogTitle,
            message: dialogMessage,
            action: abuseResult.action,
            reason: abuseResult.reason,
            severity: abuseResult.severity
          });
          console.log(`🚫 Message blocked for ${userSession.codename}: ${abuseResult.reason} - "${message.substring(0, 30)}..."`);
          return;
        }
        
        if (abuseResult.isMuted) {
          socket.emit('temporarily_muted', {
            type: 'temporary_mute',
            title: 'Temporarily Muted',
            message: `You have been temporarily muted for ${Math.ceil(abuseResult.duration / 60)} minutes due to inappropriate content. Please follow community guidelines.`,
            duration: abuseResult.duration,
            reason: abuseResult.reason
          });
          console.log(`🔇 User muted: ${userSession.codename} for ${abuseResult.duration}s`);
          return;
        }
        
        // Shadow ban: message appears sent to user but isn't delivered
        if (abuseResult.isShadowBanned) {
          socket.emit('message_sent', {
            message: message.trim(),
            timestamp: new Date().toISOString(),
            sender: 'you'
          });
          console.log(`👻 Shadow banned message from ${userSession.codename}`);
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

        // Reset chat timeout on activity
        resetChatTimeout(userSession.chatRoomId, io, chatTimeouts);

        console.log(`💬 ${userSession.codename}: ${message.substring(0, 50)}...`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator - user started typing
    socket.on('typing_start', async () => {
      try {
        if (!userSession || !userSession.chatRoomId) {
          return;
        }
        
        // Notify other users in the room that this user is typing
        socket.to(userSession.chatRoomId).emit('user_typing', {
          codename: userSession.codename,
          isTyping: true
        });
        
        // Reset chat timeout on typing activity
        resetChatTimeout(userSession.chatRoomId, io, chatTimeouts);
        
        console.log(`⌨️ ${userSession.codename} started typing`);
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    // Handle typing indicator - user stopped typing
    socket.on('typing_stop', async () => {
      try {
        if (!userSession || !userSession.chatRoomId) {
          return;
        }
        
        // Notify other users in the room that this user stopped typing
        socket.to(userSession.chatRoomId).emit('user_typing', {
          codename: userSession.codename,
          isTyping: false
        });
        
        console.log(`⌨️ ${userSession.codename} stopped typing`);
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    // Handle search radius update
    socket.on('update_radius', async (data) => {
      try {
        const { radius } = data;
        
        // Validate radius parameter
        const validRadius = radius && [500, 1000, 3000, 5000].includes(radius) ? radius : 1000;
        
        if (userSession) {
          // Update session radius
          userSession.searchRadius = validRadius;
          
          // Update in database/storage
          try {
            if (useMongoDb) {
              await ActiveSession.updateOne(
                { sessionId: userSession.sessionId },
                { searchRadius: validRadius }
              );
            } else {
              await inMemoryStorage.updateSession(userSession.sessionId, { searchRadius: validRadius });
            }
          } catch (error) {
            useMongoDb = false;
            await inMemoryStorage.updateSession(userSession.sessionId, { searchRadius: validRadius });
          }
          
          console.log(`🎯 ${userSession.codename} updated search radius to: ${validRadius}m`);
          
          // If user is actively scanning, trigger a new search with updated radius
          if (!userSession.chatRoomId) {
            console.log(`🔄 Triggering new search with updated radius for ${userSession.codename}`);
            await findNearbyUser(socket, userSession, redisClient, io, sessionsBySocketId, matchmakingEngine);
          }
        }
        
      } catch (error) {
        console.error('Error updating search radius:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      
      // Track disconnect for abuse detection
      if (userSession && connectionTrackingEnabled) {
        await abuseDetector.trackConnectionAbuse(
          abuseDetector.hashUserId(userSession.sessionId),
          'disconnect'
        );
      }
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io, chatTimeouts);
    });

    // Handle manual leave
    socket.on('leave_grid', async () => {
      console.log(`🔴 User left grid: ${socket.id}`);
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io, chatTimeouts);
    });
  });
};

// Helper function for matchmaking engine to get user session data
const getUserSessionForMatchmaking = (userId) => {
  // Find session by sessionId across all socket connections
  for (const [socketId, session] of sessionsBySocketId.entries()) {
    if (session.sessionId === userId) {
      return session;
    }
  }
  return null;
};

// Enhanced nearby user matching using Smart Matchmaking Engine
const findNearbyUser = async (socket, userSession, redisClient, io, sessionsBySocketId, matchmakingEngine) => {
  try {
    console.log(`🎯 ${userSession.codename} using Smart Matchmaking Engine...`);
    
    // Add current session data to matchmaking engine's session access
    matchmakingEngine.getUserSessionData = getUserSessionForMatchmaking;
    
    // Add user to smart matchmaking queue
    await matchmakingEngine.addToMatchmakingQueue(userSession);
    
    // Attempt to find optimal match
    const matchedUser = await matchmakingEngine.findOptimalMatch(userSession);
    
    if (matchedUser) {
      console.log(`✨ Smart match found: ${userSession.codename} ↔ ${matchedUser.codename}`);
      
      // Get queue status for logging
      const queueStatus = await matchmakingEngine.getQueueStatus();
      console.log(`📊 Queue status: ${queueStatus.queueSize} users waiting, avg wait: ${queueStatus.averageWaitTime}s`);
      
      // Create chat room between matched users
      await createChatRoom(userSession, matchedUser, redisClient, io, sessionsBySocketId, matchmakingEngine);
      return;
    }
    
    // No match found, user stays in queue
    const queueStatus = await matchmakingEngine.getQueueStatus();
    console.log(`🔍 ${userSession.codename} scanning with smart algorithm... (Queue: ${queueStatus.queueSize} users)`);
    
  } catch (error) {
    console.error('Error in smart matchmaking:', error);
    // Fallback to basic proximity search if matchmaking fails
    await fallbackProximitySearch(socket, userSession, redisClient, io, sessionsBySocketId);
  }
};

// Fallback proximity search when smart matchmaking fails
const fallbackProximitySearch = async (socket, userSession, redisClient, io, sessionsBySocketId) => {
  try {
    console.log(`🔄 ${userSession.codename} using fallback proximity search...`);
    
    let nearbyUsers = [];
    
    try {
      if (useMongoDb) {
        nearbyUsers = await ActiveSession.find({
          sessionId: { $ne: userSession.sessionId },
          isActive: true,
          connectedWith: null,
          location: {
            $geoWithin: {
              $centerSphere: [
                [userSession.location.longitude, userSession.location.latitude],
                userSession.searchRadius / 6371000 // Convert to radians
              ]
            }
          }
        });
      } else {
        const allSessions = await inMemoryStorage.getAllActiveSessions();
        nearbyUsers = allSessions.filter(session => 
          session.sessionId !== userSession.sessionId &&
          session.isActive &&
          !session.connectedWith &&
          session.location &&
          calculateDistance(userSession.location, session.location) <= userSession.searchRadius
        );
      }
    } catch (error) {
      console.error('Error in fallback proximity search:', error);
      return;
    }
    
    if (nearbyUsers.length === 0) {
      console.log(`🔍 ${userSession.codename} scanning (fallback mode)...`);
      return;
    }
    
    // Select random user from nearby users using Node.js crypto.randomInt() for unbiased selection
    const randomIndex = crypto.randomInt(0, nearbyUsers.length);
    const randomUser = nearbyUsers[randomIndex];
    console.log(`🎯 Fallback match found: ${userSession.codename} ↔ ${randomUser.codename}`);
    
    // Create chat room
    await createChatRoom(userSession, randomUser, redisClient, io, sessionsBySocketId);
    
  } catch (error) {
    console.error('Error in fallback proximity search:', error);
  }
};

// Create a chat room between two users
const createChatRoom = async (user1Session, user2Session, redisClient, io, sessionsBySocketId, matchmakingEngine = null) => {
  const chatStartTime = Date.now();
  
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
    
    // Update both sessions with chat room ID concurrently
    const updateData = { chatRoomId: roomId, connectedWith: 'matched' };
    
    const updatePromises = [];
    
    try {
      if (useMongoDb) {
        updatePromises.push(
          ActiveSession.updateMany(
            { sessionId: { $in: [user1Session.sessionId, user2Session.sessionId] } },
            updateData
          )
        );
      } else {
        updatePromises.push(
          inMemoryStorage.updateSession(user1Session.sessionId, updateData),
          inMemoryStorage.updateSession(user2Session.sessionId, updateData)
        );
      }
    } catch (error) {
      useMongoDb = false;
      updatePromises.length = 0; // Clear array
      updatePromises.push(
        inMemoryStorage.updateSession(user1Session.sessionId, updateData),
        inMemoryStorage.updateSession(user2Session.sessionId, updateData)
      );
    }
    
    // Execute all updates concurrently
    await Promise.all(updatePromises);
    
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
    
    // Get socket references
    const user1Socket = io.sockets.sockets.get(user1Session.socketId);
    const user2Socket = io.sockets.sockets.get(user2Session.socketId);
    
    // Prepare connection data
    const baseConnectionData = {
      roomId,
      status: 'connected',
      partnerCodename: null // Keep it anonymous for now
    };
    
    // Execute socket operations concurrently
    const socketOperations = [];
    
    if (user1Socket) {
      socketOperations.push(
        (async () => {
          user1Socket.join(roomId);
          // Clear scanning interval since user is now chatting
          if (user1Socket.scanningInterval) {
            clearInterval(user1Socket.scanningInterval);
            user1Socket.scanningInterval = null;
          }
          console.log(`🔗 ${user1Session.codename} joined room ${roomId}`);
          
          // Emit connection established
          user1Socket.emit('connection_established', {
            ...baseConnectionData,
            partnerCodename: user2Session.codename
          });
        })()
      );
    } else {
      console.log(`❌ Socket not found for ${user1Session.codename} (${user1Session.socketId})`);
    }
    
    if (user2Socket) {
      socketOperations.push(
        (async () => {
          user2Socket.join(roomId);
          // Clear scanning interval since user is now chatting
          if (user2Socket.scanningInterval) {
            clearInterval(user2Socket.scanningInterval);
            user2Socket.scanningInterval = null;
          }
          console.log(`🔗 ${user2Session.codename} joined room ${roomId}`);
          
          // Emit connection established
          user2Socket.emit('connection_established', {
            ...baseConnectionData,
            partnerCodename: user1Session.codename
          });
        })()
      );
    } else {
      console.log(`❌ Socket not found for ${user2Session.codename} (${user2Session.socketId})`);
    }
    
    // Execute all socket operations concurrently
    await Promise.all(socketOperations);
    
    console.log(`🔗 Connection established: ${user1Session.codename} ↔ ${user2Session.codename}`);
    
    // Start chat timeout for this room
    startChatTimeout(roomId, io, chatTimeouts);
    
    // Track session statistics with smart matchmaking engine
    try {
      await matchmakingEngine.updateSessionStats(user1Session.sessionId, {
        matchedWithSession: user2Session.sessionId,
        chatStartTime: new Date(),
        matchDistance: user1Session.location && user2Session.location ? 
          calculateDistance(user1Session.location, user2Session.location) : null
      });
      
      await matchmakingEngine.updateSessionStats(user2Session.sessionId, {
        matchedWithSession: user1Session.sessionId,
        chatStartTime: new Date(),
        matchDistance: user1Session.location && user2Session.location ? 
          calculateDistance(user1Session.location, user2Session.location) : null
      });
      
      console.log(`📊 Smart matchmaking stats updated for ${user1Session.codename} ↔ ${user2Session.codename}`);
    } catch (statsError) {
      console.error('Error updating smart matchmaking stats:', statsError);
    }
    
  } catch (error) {
    console.error('Error creating chat room:', error);
  }
};

// Chat timeout management functions
const startChatTimeout = (roomId, io, chatTimeouts) => {
  // Clear any existing timeout for this room
  if (chatTimeouts.has(roomId)) {
    clearTimeout(chatTimeouts.get(roomId));
  }
  
  // Set new timeout
  const timeoutId = setTimeout(async () => {
    console.log(`⏰ Chat timeout for room ${roomId}`);
    await handleChatTimeout(roomId, io, chatTimeouts);
  }, CHAT_TIMEOUT_MINUTES * 60 * 1000);
  
  chatTimeouts.set(roomId, timeoutId);
  console.log(`⏱️ Chat timeout set for room ${roomId} (${CHAT_TIMEOUT_MINUTES} minutes)`);
};

const resetChatTimeout = (roomId, io, chatTimeouts) => {
  if (chatTimeouts.has(roomId)) {
    startChatTimeout(roomId, io, chatTimeouts);
  }
};

const clearChatTimeout = (roomId, chatTimeouts) => {
  if (chatTimeouts.has(roomId)) {
    clearTimeout(chatTimeouts.get(roomId));
    chatTimeouts.delete(roomId);
    console.log(`🕐 Cleared chat timeout for room ${roomId}`);
  }
};

const handleChatTimeout = async (roomId, io, chatTimeouts) => {
  try {
    // Notify all users in the room about the timeout
    io.to(roomId).emit('chat_timeout', {
      message: `Chat automatically ended after ${CHAT_TIMEOUT_MINUTES} minutes of inactivity.`
    });
    
    // Find and disconnect all sessions in this room
    let chatRoom;
    try {
      if (useMongoDb) {
        chatRoom = await ChatRoom.findOne({ roomId });
        if (chatRoom) {
          // Update room as inactive
          chatRoom.isActive = false;
          chatRoom.endTime = new Date();
          await chatRoom.save();
          
          // Update sessions as inactive
          await ActiveSession.updateMany(
            { sessionId: { $in: chatRoom.participants } },
            { isActive: false, chatRoomId: null, endTime: new Date() }
          );
        }
      } else {
        chatRoom = await inMemoryStorage.findChatRoom({ roomId });
        if (chatRoom) {
          await inMemoryStorage.updateChatRoom(roomId, { 
            isActive: false, 
            endTime: new Date() 
          });
          
          // Update sessions
          for (const sessionId of chatRoom.participants) {
            await inMemoryStorage.updateSession(sessionId, { 
              isActive: false, 
              chatRoomId: null, 
              endTime: new Date() 
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating chat room on timeout:', error);
    }
    
    // Update smart matchmaking engine with chat duration if participants exist
    if (chatRoom && chatRoom.participants && chatRoom.participants.length >= 2) {
      try {
        const chatDuration = Date.now() - new Date(chatRoom.createdAt).getTime();
        
        for (const sessionId of chatRoom.participants) {
          await matchmakingEngine.updateSessionStats(sessionId, {
            chatDuration: chatDuration,
            chatEndTime: new Date(),
            chatEndReason: 'timeout'
          });
        }
        
        console.log(`📊 Smart matchmaking: Chat duration tracked for room ${roomId} (${Math.round(chatDuration / 60000)} minutes)`);
      } catch (statsError) {
        console.error('Error updating chat duration stats:', statsError);
      }
    }
    
    // Clear the timeout
    clearChatTimeout(roomId, chatTimeouts);
    
    console.log(`⏰ Chat room ${roomId} ended due to inactivity`);
    
  } catch (error) {
    console.error('Error handling chat timeout:', error);
  }
};

// Handle user disconnection and cleanup
const handleUserDisconnection = async (socket, userSession, redisClient, io, chatTimeouts) => {
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
        
        // Clear chat timeout for this room
        clearChatTimeout(chatRoom.roomId, chatTimeouts);
        
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
const triggerScanningForAllUsers = async (redisClient, io, sessionsBySocketId, matchmakingEngine) => {
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
        // Small delay to prevent overwhelming the system - using crypto.randomInt() for unbiased delay
        const secureDelay = crypto.randomInt(0, 1000); // Unbiased random delay 0-999ms
        setTimeout(async () => {
          await findNearbyUser(socket, session, redisClient, io, sessionsBySocketId, matchmakingEngine);
        }, secureDelay);
      }
    }
    
  } catch (error) {
    console.error('Error triggering scans:', error);
  }
};