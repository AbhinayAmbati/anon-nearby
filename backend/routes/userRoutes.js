import express from 'express';
import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';
import { locationLimiter, statsLimiter } from '../middleware/rateLimiter.js';
import { socketRateLimiter } from '../middleware/socketRateLimiter.js';

const router = express.Router();

// Get active users count
router.get('/stats', statsLimiter, async (req, res) => {
  try {
    let activeUsers = 0;
    let activeChatRooms = 0;
    
    try {
      // Try MongoDB first
      activeUsers = await ActiveSession.countDocuments({ isActive: true });
      activeChatRooms = await ChatRoom.countDocuments({ isActive: true });
    } catch (error) {
      // Fall back to in-memory storage
      const stats = inMemoryStorage.getStats();
      activeUsers = stats.activeSessions;
      activeChatRooms = stats.activeChatRooms;
    }
    
    res.json({
      activeUsers,
      activeChatRooms,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get nearby users count for a specific location
router.post('/nearby-count', locationLimiter, async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }
    
    // Validate radius
    const searchRadius = [500, 1000, 3000, 5000].includes(radius) ? radius : 1000;
    
    let nearbyCount = 0;
    
    try {
      // Try Redis GEO first
      const redisClient = req.app.locals.redisClient;
      if (redisClient) {
        const nearbyUsers = await redisClient.geoRadius(
          'user_locations',
          longitude,
          latitude,
          searchRadius,
          'm'
        );
        nearbyCount = nearbyUsers.length;
      } else {
        throw new Error('Redis not available');
      }
    } catch (error) {
      // Fall back to in-memory storage
      const nearbyUsers = inMemoryStorage.findNearbyUsers(
        latitude,
        longitude,
        searchRadius,
        null // Don't exclude any user for counting
      );
      nearbyCount = nearbyUsers.length;
    }
    
    res.json({
      nearbyCount,
      radius: searchRadius,
      location: { latitude, longitude },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting nearby count:', error);
    res.status(500).json({ error: 'Failed to get nearby user count' });
  }
});

// Health check for user service
router.get('/health', async (req, res) => {
  try {
    let databaseStatus = 'in-memory';
    
    try {
      // Test database connection
      await ActiveSession.findOne().limit(1);
      databaseStatus = 'connected';
    } catch (error) {
      // Database not available, but we can continue with in-memory storage
    }
    
    res.json({ 
      status: 'healthy',
      database: databaseStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// Rate limiting status (admin/monitoring endpoint)
router.get('/rate-limit-stats', statsLimiter, async (req, res) => {
  try {
    const socketStats = socketRateLimiter.getStats();
    res.json({
      socketRateLimiting: socketStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rate limiting stats' });
  }
});

export default router;