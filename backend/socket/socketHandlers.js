import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { generateCodename, generateSessionId, generateRoomId, calculateDistance } from '../utils/helpers.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';
import { socketRateLimiter } from '../middleware/socketRateLimiter.js';
import SmartMatchmakingEngine from '../services/matchmakingEngine.js';

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
  
  // Track file drop rooms: roomId -> { creatorId: string, createdAt: Date }
  const fileDropRooms = new Map();
  
  // Initialize Smart Matchmaking Engine
  const matchmakingEngine = new SmartMatchmakingEngine(redisClient);
  
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
          searchMode: data.searchMode || 'proximity',
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
            
            // Set TTL on user_locations key (2 hours = 7200 seconds)
            await redisClient.expire('user_locations', 7200);
            
            // Store session mapping in Redis
            await redisClient.hSet(`session:${sessionId}`, {
              socketId: socket.id,
              codename,
              latitude,
              longitude,
              isActive: 'true'
            });
            
            // Set TTL on session key (2 hours = 7200 seconds)
            await redisClient.expire(`session:${sessionId}`, 7200);
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
        
        console.log(`🟩 ${codename} joined the grid at (${latitude}, ${longitude}) in ${userSession.searchMode} mode`);
        
        // Only perform proximity scanning if that's the user's intent
        if (userSession.searchMode === 'proximity') {
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
        }
        
      } catch (error) {
        console.error('Error joining grid:', error);
        socket.emit('error', { message: 'Failed to join grid' });
      }
    });

    // Handle creating a session for room-only users (no location required)
    socket.on('create_room_session', async (data) => {
      try {
        console.log('🏠 Creating room-only session for socket:', socket.id);
        
        // Generate new session without location
        const sessionId = generateSessionId();
        const codename = generateCodename();
        
        const sessionData = {
          sessionId,
          codename,
          socketId: socket.id,
          location: null, // No location for room-only users
          searchRadius: null,
          isActive: true,
          roomOnly: true // Flag to indicate this is a room-only session
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
          console.log('📝 Using in-memory storage for room session data');
          useMongoDb = false;
          await inMemoryStorage.saveSession(sessionData);
          userSession = sessionData;
        }
        
        socket.emit('session_created', {
          sessionId,
          codename,
          status: 'room_ready'
        });
        
        // Store session reference for this socket
        sessionsBySocketId.set(socket.id, userSession);
        
        console.log(`🏠 ${codename} created room-only session`);
        
      } catch (error) {
        console.error('Error creating room session:', error);
        socket.emit('error', { message: 'Failed to create session' });
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

    // Handle manual chat disconnection
    socket.on('disconnect_chat', async () => {
      console.log(`🔴 User requested chat disconnect: ${socket.id}`);
      await handleUserDisconnection(socket, userSession, redisClient, io, chatTimeouts, matchmakingEngine);
      // Reset local session since it's deleted in cleanup
      userSession = null;
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      // Handle file drop room cleanup if creator
      if (socket.createdFileDropRoom) {
        handleFileDropLeave(socket, socket.createdFileDropRoom, io, fileDropRooms);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io, chatTimeouts, matchmakingEngine);
    });

    // Handle manual leave
    socket.on('leave_grid', async () => {
      console.log(`🔴 User left grid: ${socket.id}`);
      
      // Clear scanning interval
      if (socket.scanningInterval) {
        clearInterval(socket.scanningInterval);
      }
      
      // Handle file drop room cleanup if creator
      if (socket.createdFileDropRoom) {
        handleFileDropLeave(socket, socket.createdFileDropRoom, io, fileDropRooms);
      }
      
      sessionsBySocketId.delete(socket.id);
      await handleUserDisconnection(socket, userSession, redisClient, io, chatTimeouts, matchmakingEngine);
    });

    // --- Named Chat Room Handlers ---
    
    // Create a named chat room
    socket.on('create_named_room', async (data) => {
      try {
        const { roomName } = data;
        
        if (!roomName || roomName.trim().length === 0) {
          socket.emit('error', { message: 'Room name is required' });
          return;
        }
        
        if (!userSession) {
          socket.emit('error', { message: 'Session not found. Please rejoin the grid.' });
          return;
        }
        
        // Generate a unique room ID
        const roomId = generateRoomId();
        
        const chatRoomData = {
          roomId,
          roomType: 'named',
          roomName: roomName.trim(),
          creatorSessionId: userSession.sessionId,
          participants: [{
            sessionId: userSession.sessionId,
            codename: userSession.codename,
            socketId: socket.id
          }],
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
        
        // Update user session with chat room ID
        const updateData = { chatRoomId: roomId, connectedWith: 'named_room' };
        
        try {
          if (useMongoDb) {
            await ActiveSession.updateOne(
              { sessionId: userSession.sessionId },
              updateData
            );
          } else {
            await inMemoryStorage.updateSession(userSession.sessionId, updateData);
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.updateSession(userSession.sessionId, updateData);
        }
        
        // Update local session object
        userSession.chatRoomId = roomId;
        userSession.connectedWith = 'named_room';
        
        // Update the session reference
        if (sessionsBySocketId.has(socket.id)) {
          sessionsBySocketId.get(socket.id).chatRoomId = roomId;
          sessionsBySocketId.get(socket.id).connectedWith = 'named_room';
        }
        
        // Join the socket room
        socket.join(roomId);
        
        // Clear scanning interval since user is now in a room
        if (socket.scanningInterval) {
          clearInterval(socket.scanningInterval);
          socket.scanningInterval = null;
        }
        
        // Emit success with room details
        socket.emit('named_room_created', {
          roomId,
          roomName: roomName.trim(),
          shareableLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat?room=${roomId}`,
          roomType: 'named'
        });
        
        // Start chat timeout for this room
        startChatTimeout(roomId, io, chatTimeouts);
        
        console.log(`🏠 ${userSession.codename} created named room: "${roomName.trim()}" (${roomId})`);
        
      } catch (error) {
        console.error('Error creating named room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });
    
    // Join a named chat room
    socket.on('join_named_room', async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }
        
        if (!userSession) {
          socket.emit('error', { message: 'Session not found. Please rejoin the grid.' });
          return;
        }
        
        // Find the chat room
        let chatRoom;
        try {
          if (useMongoDb) {
            chatRoom = await ChatRoom.findOne({ 
              roomId,
              roomType: 'named',
              isActive: true 
            });
          } else {
            chatRoom = await inMemoryStorage.findChatRoom({ roomId });
            if (chatRoom && (chatRoom.roomType !== 'named' || !chatRoom.isActive)) {
              chatRoom = null;
            }
          }
        } catch (error) {
          useMongoDb = false;
          chatRoom = await inMemoryStorage.findChatRoom({ roomId });
        }
        
        if (!chatRoom) {
          socket.emit('error', { message: 'Room not found or no longer active' });
          return;
        }
        
        // Check if user is already in the room
        const alreadyInRoom = chatRoom.participants.some(
          p => p.sessionId === userSession.sessionId
        );
        
        if (alreadyInRoom) {
          socket.emit('error', { message: 'You are already in this room' });
          return;
        }
        
        // Add user to the room
        const newParticipant = {
          sessionId: userSession.sessionId,
          codename: userSession.codename,
          socketId: socket.id
        };
        
        try {
          if (useMongoDb) {
            await ChatRoom.updateOne(
              { roomId },
              { 
                $push: { participants: newParticipant },
                lastActivity: new Date()
              }
            );
          } else {
            chatRoom.participants.push(newParticipant);
            await inMemoryStorage.updateChatRoom(roomId, {
              participants: chatRoom.participants,
              lastActivity: new Date()
            });
          }
        } catch (error) {
          useMongoDb = false;
          chatRoom.participants.push(newParticipant);
          await inMemoryStorage.updateChatRoom(roomId, {
            participants: chatRoom.participants,
            lastActivity: new Date()
          });
        }
        
        // Update user session
        const updateData = { chatRoomId: roomId, connectedWith: 'named_room' };
        
        try {
          if (useMongoDb) {
            await ActiveSession.updateOne(
              { sessionId: userSession.sessionId },
              updateData
            );
          } else {
            await inMemoryStorage.updateSession(userSession.sessionId, updateData);
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.updateSession(userSession.sessionId, updateData);
        }
        
        // Update local session object
        userSession.chatRoomId = roomId;
        userSession.connectedWith = 'named_room';
        
        // Update the session reference
        if (sessionsBySocketId.has(socket.id)) {
          sessionsBySocketId.get(socket.id).chatRoomId = roomId;
          sessionsBySocketId.get(socket.id).connectedWith = 'named_room';
        }
        
        // Join the socket room
        socket.join(roomId);
        
        // Clear scanning interval
        if (socket.scanningInterval) {
          clearInterval(socket.scanningInterval);
          socket.scanningInterval = null;
        }
        
        // Notify the user
        socket.emit('named_room_joined', {
          roomId,
          roomName: chatRoom.roomName,
          participantCount: chatRoom.participants.length + 1,
          roomType: 'named'
        });
        
        // Notify existing participants
        socket.to(roomId).emit('user_joined_room', {
          codename: userSession.codename,
          participantCount: chatRoom.participants.length + 1
        });
        
        // Reset chat timeout on activity
        resetChatTimeout(roomId, io, chatTimeouts);
        
        console.log(`🚪 ${userSession.codename} joined named room: "${chatRoom.roomName}" (${roomId})`);
        
      } catch (error) {
        console.error('Error joining named room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Join a public room (find nearby or create new)
    socket.on('join_public_room', async (data) => {
      try {
        console.log('🌍 User requesting to join nearby public room:', socket.id);
        
        if (!userSession) {
          socket.emit('error', { message: 'Session not found. Please rejoin the grid.' });
          return;
        }
        
        const { location, radius, action } = data;
        if (!location || !location.latitude || !location.longitude) {
          socket.emit('error', { message: 'Location required for public rooms' });
          return;
        }
        
        const MAX_ROOM_SIZE = 10; // Maximum users per public room
        const NEARBY_RADIUS = radius || 5000; // Use provided radius or default 5km
        
        // Find nearby active public rooms with space
        let publicRoom = null;
        let nearbyRooms = [];
        
        // Only search for rooms if we are not forcing creation
        if (action !== 'create') {
          try {
            if (useMongoDb) {
              // Find all active public rooms
              const allPublicRooms = await ChatRoom.find({
                roomType: 'public',
                isActive: true
              });
              
              // Filter by distance and capacity
              for (const room of allPublicRooms) {
                if (room.participants.length >= MAX_ROOM_SIZE) continue;
                
                // Get creator's location from their session
                // Or use room location if available (preferred)
                let roomLat, roomLong;
                
                if (room.location && room.location.latitude) {
                  roomLat = room.location.latitude;
                  roomLong = room.location.longitude;
                } else {
                  const creatorSession = await ActiveSession.findOne({ sessionId: room.creatorSessionId });
                  if (!creatorSession || !creatorSession.location) continue;
                  roomLat = creatorSession.location.latitude;
                  roomLong = creatorSession.location.longitude;
                }
                
                const distance = inMemoryStorage.calculateDistance(
                  location.latitude,
                  location.longitude,
                  roomLat,
                  roomLong
                );
                
                if (distance <= NEARBY_RADIUS) {
                  nearbyRooms.push({ room, distance });
                }
              }
              
              // Sort by distance and pick closest
              if (nearbyRooms.length > 0) {
                nearbyRooms.sort((a, b) => a.distance - b.distance);
                publicRoom = nearbyRooms[0].room;
              }
            } else {
              // In-memory search
              const allRooms = Array.from(inMemoryStorage.chatRooms.values());
              for (const room of allRooms) {
                if (room.roomType !== 'public' || !room.isActive || room.participants.length >= MAX_ROOM_SIZE) continue;
                
                let roomLat, roomLong;
                if (room.location) {
                  roomLat = room.location.latitude;
                  roomLong = room.location.longitude;
                } else {
                  // Fallback to finding creator session in memory
                  // This is tricky in memory if we don't have easy access, but let's assume room.location is set for public rooms
                  continue; 
                }
                
                const distance = inMemoryStorage.calculateDistance(
                  location.latitude,
                  location.longitude,
                  roomLat,
                  roomLong
                );
                
                if (distance <= NEARBY_RADIUS) {
                  nearbyRooms.push({ room, distance });
                }
              }
              
              // Sort by distance and pick closest
              if (nearbyRooms.length > 0) {
                nearbyRooms.sort((a, b) => a.distance - b.distance);
                publicRoom = nearbyRooms[0].room;
              }
            }
          } catch (error) {
            console.error('Error searching for public rooms:', error);
          }
        }
        
        // If no room found
        if (!publicRoom) {
          // If user explicitly wanted to JOIN, but no room found
          if (action === 'join') {
            socket.emit('error', { message: 'No public rooms found nearby. Try creating one!' });
            return;
          }

          console.log('📢 Creating new nearby public room...');
          const roomId = generateRoomId();
          
          const chatRoomData = {
            roomId,
            roomType: 'public',
            roomName: 'Public Chat Room',
            creatorSessionId: userSession.sessionId,
            location: {  // Store location for nearby matching
              latitude: location.latitude,
              longitude: location.longitude
            },
            participants: [{
              sessionId: userSession.sessionId,
              codename: userSession.codename,
              socketId: socket.id
            }],
            isActive: true
          };
          
          try {
            if (useMongoDb) {
              publicRoom = new ChatRoom(chatRoomData);
              await publicRoom.save();
            } else {
              await inMemoryStorage.saveChatRoom(chatRoomData);
              publicRoom = chatRoomData;
            }
          } catch (error) {
            useMongoDb = false;
            await inMemoryStorage.saveChatRoom(chatRoomData);
            publicRoom = chatRoomData;
          }
          
          console.log(`📢 Created new public room: ${roomId}`);
        } else {
          // Join existing public room
          console.log(`📢 Joining existing public room: ${publicRoom.roomId}`);
          
          const newParticipant = {
            sessionId: userSession.sessionId,
            codename: userSession.codename,
            socketId: socket.id
          };
          
          try {
            if (useMongoDb) {
              await ChatRoom.updateOne(
                { roomId: publicRoom.roomId },
                { 
                  $push: { participants: newParticipant },
                  lastActivity: new Date()
                }
              );
            } else {
              publicRoom.participants.push(newParticipant);
              await inMemoryStorage.updateChatRoom(publicRoom.roomId, {
                participants: publicRoom.participants,
                lastActivity: new Date()
              });
            }
          } catch (error) {
            useMongoDb = false;
            publicRoom.participants.push(newParticipant);
            await inMemoryStorage.updateChatRoom(publicRoom.roomId, {
              participants: publicRoom.participants,
              lastActivity: new Date()
            });
          }
        }
        
        // Update user session
        const updateData = { chatRoomId: publicRoom.roomId, connectedWith: 'public_room' };
        
        try {
          if (useMongoDb) {
            await ActiveSession.updateOne(
              { sessionId: userSession.sessionId },
              updateData
            );
          } else {
            await inMemoryStorage.updateSession(userSession.sessionId, updateData);
          }
        } catch (error) {
          useMongoDb = false;
          await inMemoryStorage.updateSession(userSession.sessionId, updateData);
        }
        
        // Update local session object
        userSession.chatRoomId = publicRoom.roomId;
        userSession.connectedWith = 'public_room';
        
        // Update the session reference
        if (sessionsBySocketId.has(socket.id)) {
          sessionsBySocketId.get(socket.id).chatRoomId = publicRoom.roomId;
          sessionsBySocketId.get(socket.id).connectedWith = 'public_room';
        }
        
        // Join the socket room
        socket.join(publicRoom.roomId);
        
        // Clear scanning interval
        if (socket.scanningInterval) {
          clearInterval(socket.scanningInterval);
          socket.scanningInterval = null;
        }
        
        // Notify the user
        const participantCount = publicRoom.participants ? publicRoom.participants.length : 1;
        socket.emit('named_room_joined', {
          roomId: publicRoom.roomId,
          roomName: 'Public Chat Room',
          participantCount: participantCount,
          roomType: 'public'
        });
        
        // Notify existing participants
        socket.to(publicRoom.roomId).emit('user_joined_room', {
          codename: userSession.codename,
          participantCount: participantCount
        });
        
        // Reset chat timeout on activity
        resetChatTimeout(publicRoom.roomId, io, chatTimeouts);
        
        console.log(`📢 ${userSession.codename} joined public room: ${publicRoom.roomId} (${participantCount} users)`);
        
      } catch (error) {
        console.error('Error joining public room:', error);
        socket.emit('error', { message: 'Failed to join public room' });
      }
    });

    // --- File Drop Handlers ---
    
    socket.on('join_file_drop_room', (data) => {
      const { roomId } = data;
      if (!roomId) return;
      
      socket.join(`file_drop_${roomId}`);
      
      // If room doesn't exist, this user is the creator
      if (!fileDropRooms.has(roomId)) {
        fileDropRooms.set(roomId, {
          creatorId: socket.id,
          createdAt: new Date()
        });
        socket.createdFileDropRoom = roomId;
        console.log(`📂 Socket ${socket.id} created file drop room ${roomId}`);
      } else {
        console.log(`📂 Socket ${socket.id} joined file drop room ${roomId}`);
      }
      
      // Notify others in the room
      socket.to(`file_drop_${roomId}`).emit('user_joined_drop_room', {
        socketId: socket.id
      });
    });

    socket.on('leave_file_drop_room', (data) => {
      const { roomId } = data;
      if (!roomId) return;
      
      handleFileDropLeave(socket, roomId, io, fileDropRooms);
    });

    // Handle leaving a chat room explicitly
    socket.on('leave_room', async () => {
      if (!userSession) return;
      
      console.log(`🚪 User requesting to leave room: ${userSession.codename}`);
      
      try {
        let chatRoom = null;
        if (userSession.chatRoomId) {
          if (useMongoDb) {
            chatRoom = await ChatRoom.findOne({ roomId: userSession.chatRoomId });
          } else {
            chatRoom = await inMemoryStorage.findChatRoom({ roomId: userSession.chatRoomId });
          }
        }
        
        if (chatRoom) {
          const isMultiUserRoom = chatRoom.roomType === 'named' || chatRoom.roomType === 'public';
          const remainingParticipants = chatRoom.participants.filter(p => p.sessionId !== userSession.sessionId);
          
          if (isMultiUserRoom && remainingParticipants.length > 0) {
            // Multi-user room: remove user but keep room active
            console.log(`👥 Removing user from multi-user room. ${remainingParticipants.length} users remaining.`);
            
            try {
              if (useMongoDb) {
                await ChatRoom.updateOne(
                  { roomId: chatRoom.roomId },
                  { 
                    $pull: { participants: { sessionId: userSession.sessionId } },
                    lastActivity: new Date()
                  }
                );
              } else {
                await inMemoryStorage.updateChatRoom(chatRoom.roomId, {
                  participants: remainingParticipants,
                  lastActivity: new Date()
                });
              }
            } catch (error) {
              console.error('Error updating room on leave:', error);
            }
            
            // Notify remaining users
            io.to(chatRoom.roomId).emit('user_left_room', {
              codename: userSession.codename,
              participantCount: remainingParticipants.length
            });
            
            // Update room info for remaining users
            remainingParticipants.forEach(participant => {
              const participantSocket = io.sockets.sockets.get(participant.socketId);
              if (participantSocket) {
                participantSocket.emit('room_updated', {
                  roomName: chatRoom.roomName || 'Public Chat Room',
                  participantCount: remainingParticipants.length
                });
              }
            });
            
          } else {
            // Proximity room or last user leaving: close/delete the room
            console.log(`🔒 Closing room (empty or proximity): ${chatRoom.roomId}`);
            
            // Clear timeout
            clearChatTimeout(chatRoom.roomId, chatTimeouts);
            
            // Notify others if any (e.g. in proximity room)
            remainingParticipants.forEach(participant => {
              const otherSocket = io.sockets.sockets.get(participant.socketId);
              if (otherSocket) {
                otherSocket.emit('partner_disconnected', {
                  message: 'Your chat partner has left the room'
                });
                otherSocket.leave(chatRoom.roomId);
              }
            });
            
            // Delete the room
            try {
              if (useMongoDb) {
                await ChatRoom.deleteOne({ roomId: chatRoom.roomId });
                console.log(`🗑️ Deleted chat room from MongoDB: ${chatRoom.roomId}`);
              } else {
                await inMemoryStorage.deleteChatRoom(chatRoom.roomId);
                console.log(`🗑️ Deleted chat room from memory: ${chatRoom.roomId}`);
              }
            } catch (error) {
              console.error('Error deleting room:', error);
            }
          }
          
          // Update user session to remove room reference
          try {
            if (useMongoDb) {
              await ActiveSession.updateOne(
                { sessionId: userSession.sessionId },
                { $unset: { chatRoomId: 1, connectedWith: 1 } }
              );
            } else {
              await inMemoryStorage.updateSession(userSession.sessionId, { 
                chatRoomId: null, 
                connectedWith: null 
              });
            }
          } catch (error) {
            console.error('Error updating session on leave:', error);
          }
          
          // Update local session object
          userSession.chatRoomId = null;
          userSession.connectedWith = null;
          
          // Leave the socket room
          socket.leave(chatRoom.roomId);
        }
      } catch (err) {
        console.error('Error in leave_room handler:', err);
      }
    });

    socket.on('file_chunk', (data) => {
      const { roomId, fileId, chunkIndex, totalChunks, encryptedBytes, fileName, fileType } = data;
      
      if (!roomId || !fileId || encryptedBytes === undefined) {
        return;
      }

      // Relay to all other users in the room
      socket.to(`file_drop_${roomId}`).emit('file_chunk_received', {
        fileId,
        chunkIndex,
        totalChunks,
        encryptedBytes,
        fileName,
        fileType,
        senderId: socket.id
      });
      
      if (chunkIndex === 0) {
        console.log(`📂 Starting file transfer: ${fileName} (${totalChunks} chunks) in room ${roomId}`);
      } else if (chunkIndex === totalChunks - 1) {
        console.log(`📂 Completed file transfer: ${fileName} in room ${roomId}`);
      }
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
          searchMode: 'proximity', // Only match with users looking for proximity chat
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
          session.searchMode === 'proximity' && // Only match with users looking for proximity chat
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
    if (matchmakingEngine) {
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
const handleUserDisconnection = async (socket, userSession, redisClient, io, chatTimeouts, matchmakingEngine) => {
  if (!userSession) return;
  
  try {
    console.log(`🧹 Starting cleanup for: ${userSession.codename} (${userSession.sessionId})`);
    
    // If user was in a chat room, handle based on room type
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
        console.log(`🔗 User leaving chat room: ${chatRoom.roomId} (type: ${chatRoom.roomType || 'proximity'})`);
        
        const isMultiUserRoom = chatRoom.roomType === 'named' || chatRoom.roomType === 'public';
        const remainingParticipants = chatRoom.participants.filter(p => p.sessionId !== userSession.sessionId);
        
        if (isMultiUserRoom && remainingParticipants.length > 0) {
          // Multi-user room (named or public) - remove user but keep room active
          console.log(`👥 Removing user from multi-user room. ${remainingParticipants.length} users remaining.`);
          
          // Remove the disconnecting user from participants
          try {
            if (useMongoDb) {
              await ChatRoom.updateOne(
                { roomId: chatRoom.roomId },
                { 
                  $pull: { participants: { sessionId: userSession.sessionId } },
                  lastActivity: new Date()
                }
              );
            } else {
              await inMemoryStorage.updateChatRoom(chatRoom.roomId, {
                participants: remainingParticipants,
                lastActivity: new Date()
              });
            }
          } catch (error) {
            useMongoDb = false;
            await inMemoryStorage.updateChatRoom(chatRoom.roomId, {
              participants: remainingParticipants,
              lastActivity: new Date()
            });
          }
          
          // Notify remaining users that someone left
          io.to(chatRoom.roomId).emit('user_left_room', {
            codename: userSession.codename,
            participantCount: remainingParticipants.length
          });
          
          // Update room name display for remaining users
          remainingParticipants.forEach(participant => {
            const participantSocket = io.sockets.sockets.get(participant.socketId);
            if (participantSocket) {
              participantSocket.emit('room_updated', {
                roomName: chatRoom.roomName || 'Public Chat Room',
                participantCount: remainingParticipants.length
              });
            }
          });
          
          // Reset chat timeout (room is still active)
          resetChatTimeout(chatRoom.roomId, io, chatTimeouts);
          
          console.log(`✅ User removed from room. Room remains active with ${remainingParticipants.length} users.`);
        } else {
          // Proximity room or last user leaving - close the room completely
          console.log(`🔒 Closing room (proximity or last user): ${chatRoom.roomId}`);
          
          // Clear chat timeout for this room
          clearChatTimeout(chatRoom.roomId, chatTimeouts);
          
          // Notify and disconnect remaining participants
          remainingParticipants.forEach(participant => {
            const otherSocket = io.sockets.sockets.get(participant.socketId);
            if (otherSocket) {
              otherSocket.emit('partner_disconnected', {
                message: 'Your chat partner has disconnected'
              });
              otherSocket.leave(userSession.chatRoomId);
            }
            
            // Update their session to remove chat room reference
            try {
              if (useMongoDb) {
                ActiveSession.updateOne(
                  { sessionId: participant.sessionId },
                  { $unset: { chatRoomId: 1 }, connectedWith: null }
                ).catch(err => console.error('Error updating participant session:', err));
              } else {
                inMemoryStorage.updateSession(participant.sessionId, { 
                  chatRoomId: null, 
                  connectedWith: null 
                }).catch(err => console.error('Error updating participant session:', err));
              }
            } catch (error) {
              useMongoDb = false;
              inMemoryStorage.updateSession(participant.sessionId, { 
                chatRoomId: null, 
                connectedWith: null 
              }).catch(err => console.error('Error updating participant session:', err));
            }
          });
          
          // Delete the chat room completely
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
          }
        }
      }
    }
    
    // Remove from Redis
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
    
    // Clean up matchmaking engine data
    if (matchmakingEngine) {
      try {
        await matchmakingEngine.cleanupUserData(userSession.sessionId);
      } catch (error) {
        console.error('Error cleaning up matchmaking data:', error);
      }
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

// Helper to handle file drop room leaving/cleanup
const handleFileDropLeave = (socket, roomId, io, fileDropRooms) => {
  const room = fileDropRooms.get(roomId);
  
  if (room && room.creatorId === socket.id) {
    // Creator is leaving, close the room
    console.log(`🛑 Creator ${socket.id} left file drop room ${roomId}. Closing room.`);
    
    // Notify all users that room is closed
    io.to(`file_drop_${roomId}`).emit('file_drop_room_closed', {
      reason: 'Creator left the room'
    });
    
    // Make everyone leave
    io.in(`file_drop_${roomId}`).socketsLeave(`file_drop_${roomId}`);
    
    // Delete room tracking
    fileDropRooms.delete(roomId);
    
    if (socket.createdFileDropRoom === roomId) {
      delete socket.createdFileDropRoom;
    }
  } else {
    // Regular user leaving
    socket.leave(`file_drop_${roomId}`);
    console.log(`📂 Socket ${socket.id} left file drop room ${roomId}`);
    
    // Notify others
    socket.to(`file_drop_${roomId}`).emit('user_left_drop_room', {
      socketId: socket.id
    });
  }
};
