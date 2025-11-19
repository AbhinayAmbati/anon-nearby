// In-memory storage fallback when MongoDB is not available
class InMemoryStorage {
  constructor() {
    this.sessions = new Map();
    this.chatRooms = new Map();
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

  // Cleanup old sessions (older than 1 hour)
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions) {
      if (session.createdAt < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
    
    for (const [roomId, room] of this.chatRooms) {
      if (room.createdAt < oneHourAgo) {
        this.chatRooms.delete(roomId);
      }
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