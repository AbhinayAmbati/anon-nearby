// Socket.IO rate limiting middleware
class SocketRateLimiter {
  constructor() {
    this.connections = new Map(); // Track connection attempts per IP
    this.messages = new Map();    // Track message sending per session
    this.locations = new Map();   // Track location requests per IP
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    
    // Cleanup connection tracking (1 minute window)
    for (const [key, data] of this.connections.entries()) {
      if (now - data.lastReset > 60000) {
        this.connections.delete(key);
      }
    }
    
    // Cleanup message tracking (1 minute window)
    for (const [key, data] of this.messages.entries()) {
      if (now - data.lastReset > 60000) {
        this.messages.delete(key);
      }
    }
    
    // Cleanup location tracking (5 minute window)
    for (const [key, data] of this.locations.entries()) {
      if (now - data.lastReset > 300000) {
        this.locations.delete(key);
      }
    }
  }

  // Check connection rate limit
  checkConnectionLimit(ip) {
    const now = Date.now();
    const key = `conn_${ip}`;
    
    if (!this.connections.has(key)) {
      this.connections.set(key, { count: 1, lastReset: now });
      return true;
    }
    
    const data = this.connections.get(key);
    
    // Reset if window expired (1 minute)
    if (now - data.lastReset > 60000) {
      data.count = 1;
      data.lastReset = now;
      return true;
    }
    
    // Check limit (10 connections per minute)
    if (data.count >= 10) {
      return false;
    }
    
    data.count++;
    return true;
  }

  // Check message rate limit
  checkMessageLimit(sessionId) {
    const now = Date.now();
    const key = `msg_${sessionId}`;
    
    if (!this.messages.has(key)) {
      this.messages.set(key, { count: 1, lastReset: now });
      return true;
    }
    
    const data = this.messages.get(key);
    
    // Reset if window expired (1 minute)
    if (now - data.lastReset > 60000) {
      data.count = 1;
      data.lastReset = now;
      return true;
    }
    
    // Check limit (30 messages per minute)
    if (data.count >= 30) {
      return false;
    }
    
    data.count++;
    return true;
  }

  // Check location request rate limit
  checkLocationLimit(ip) {
    const now = Date.now();
    const key = `loc_${ip}`;
    
    if (!this.locations.has(key)) {
      this.locations.set(key, { count: 1, lastReset: now });
      return true;
    }
    
    const data = this.locations.get(key);
    
    // Reset if window expired (5 minutes)
    if (now - data.lastReset > 300000) {
      data.count = 1;
      data.lastReset = now;
      return true;
    }
    
    // Check limit (5 location requests per 5 minutes)
    if (data.count >= 5) {
      return false;
    }
    
    data.count++;
    return true;
  }

  // Get current stats for monitoring
  getStats() {
    return {
      activeConnections: this.connections.size,
      activeMessages: this.messages.size,
      activeLocations: this.locations.size
    };
  }
}

const socketRateLimiter = new SocketRateLimiter();

// Clean up every 30 seconds
setInterval(() => {
  socketRateLimiter.cleanup();
}, 30000);

export { socketRateLimiter };