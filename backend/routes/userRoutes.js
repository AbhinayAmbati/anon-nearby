import express from 'express';
import ActiveSession from '../models/ActiveSession.js';
import ChatRoom from '../models/ChatRoom.js';
import { inMemoryStorage } from '../utils/inMemoryStorage.js';

const router = express.Router();

// Get active users count
router.get('/stats', async (req, res) => {
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

export default router;