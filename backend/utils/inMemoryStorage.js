// In-memory storage fallback when MongoDB is not available
class InMemoryStorage {
  constructor() {
    this.sessions = new Map();
    this.chatRooms = new Map();
    this.userLocations = new Map(); // For location-based queries
  }

  // Location management
  addUserLocation(sessionId, latitude, longitude) {
    this.userLocations.set(sessionId, { latitude, longitude });
  }

  removeUserLocation(sessionId) {
    this.userLocations.delete(sessionId);
  }

  findNearbyUsers(latitude, longitude, radiusInMeters, excludeSessionId) {
    const nearbyUsers = [];
    
    for (const [sessionId, location] of this.userLocations) {
      if (sessionId === excludeSessionId) continue;
      
      const distance = this.calculateDistance(
        latitude, longitude, 
        location.latitude, location.longitude
      );
      
      if (distance <= radiusInMeters) {
        nearbyUsers.push([sessionId, distance]);
      }
    }
    
    return nearbyUsers.sort((a, b) => a[1] - b[1]); // Sort by distance
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Session management
  saveSession(sessionData) {
    this.sessions.set(sessionData.sessionId, {
      ...sessionData,
      createdAt: new Date()
    });
    return Promise.resolve(sessionData);
  }

  findSession(query) {
    for (const [sessionId, session] of this.sessions) {
      if (query.sessionId && query.sessionId === sessionId) {
        return Promise.resolve(session);
      }
      if (query.socketId && query.socketId === session.socketId) {
        return Promise.resolve(session);
      }
    }
    return Promise.resolve(null);
  }

  findActiveSessions(excludeSessionId) {
    const activeSessions = [];
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId && session.isActive && !session.chatRoomId) {
        activeSessions.push(session);
      }
    }
    return Promise.resolve(activeSessions);
  }

  updateSession(sessionId, updates) {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      this.sessions.set(sessionId, { ...session, ...updates });
      return Promise.resolve({ acknowledged: true });
    }
    return Promise.resolve({ acknowledged: false });
  }

  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    this.removeUserLocation(sessionId); // Also remove location
    return Promise.resolve({ deletedCount: deleted ? 1 : 0 });
  }

  // Chat room management
  saveChatRoom(roomData) {
    this.chatRooms.set(roomData.roomId, {
      ...roomData,
      createdAt: new Date(),
      lastActivity: new Date()
    });
    return Promise.resolve(roomData);
  }

  findChatRoom(query) {
    for (const [roomId, room] of this.chatRooms) {
      if (query.roomId && query.roomId === roomId) {
        return Promise.resolve(room);
      }
    }
    return Promise.resolve(null);
  }

  updateChatRoom(roomId, updates) {
    if (this.chatRooms.has(roomId)) {
      const room = this.chatRooms.get(roomId);
      this.chatRooms.set(roomId, { ...room, ...updates, lastActivity: new Date() });
      return Promise.resolve({ acknowledged: true });
    }
    return Promise.resolve({ acknowledged: false });
  }

  deleteChatRoom(roomId) {
    const deleted = this.chatRooms.delete(roomId);
    return Promise.resolve({ deletedCount: deleted ? 1 : 0 });
  }

  // Cleanup old sessions (older than 1 hour) and inactive rooms
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedSessions = 0;
    let cleanedRooms = 0;
    
    // Clean up old sessions
    for (const [sessionId, session] of this.sessions) {
      if (session.createdAt < oneHourAgo) {
        this.sessions.delete(sessionId);
        this.removeUserLocation(sessionId);
        cleanedSessions++;
      }
    }
    
    // Clean up old or inactive chat rooms
    for (const [roomId, room] of this.chatRooms) {
      if (room.createdAt < oneHourAgo || room.isActive === false) {
        this.chatRooms.delete(roomId);
        cleanedRooms++;
      }
    }
    
    if (cleanedSessions > 0 || cleanedRooms > 0) {
      console.log(`🧹 Cleaned up ${cleanedSessions} old sessions and ${cleanedRooms} inactive rooms`);
    }
  }

  getStats() {
    return {
      activeSessions: this.sessions.size,
      activeChatRooms: this.chatRooms.size
    };
  }
}

export const inMemoryStorage = new InMemoryStorage();

// Run cleanup every 10 minutes
setInterval(() => {
  inMemoryStorage.cleanup();
}, 10 * 60 * 1000);