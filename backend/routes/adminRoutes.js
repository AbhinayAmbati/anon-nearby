import express from 'express';

const router = express.Router();
let abuseDetector = null;

// Set the abuse detector instance (called from server.js)
export const setAbuseDetector = (detector) => {
  abuseDetector = detector;
};

/**
 * Get abuse detection statistics
 * GET /api/admin/abuse-stats
 */
router.get('/abuse-stats', async (req, res) => {
  try {
    if (!abuseDetector) {
      return res.status(503).json({ 
        error: 'Abuse detection system not initialized' 
      });
    }

    const stats = await abuseDetector.getAbuseStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        systemStatus: {
          geminiEnabled: stats.geminiEnabled,
          redisConnected: !!abuseDetector.useRedis,
          detectionActive: true
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting abuse stats:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve abuse statistics',
      details: error.message 
    });
  }
});

/**
 * Trigger cleanup of expired abuse data
 * POST /api/admin/cleanup-abuse-data
 */
router.post('/cleanup-abuse-data', async (req, res) => {
  try {
    if (!abuseDetector) {
      return res.status(503).json({ 
        error: 'Abuse detection system not initialized' 
      });
    }

    await abuseDetector.cleanupExpiredData();
    
    res.json({
      success: true,
      message: 'Abuse data cleanup completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup abuse data',
      details: error.message 
    });
  }
});

/**
 * Health check for abuse detection system
 * GET /api/admin/abuse-health
 */
router.get('/abuse-health', (req, res) => {
  try {
    const health = {
      abuseDetectionSystem: !!abuseDetector,
      geminiAI: abuseDetector ? !!abuseDetector.gemini : false,
      redisConnection: abuseDetector ? abuseDetector.useRedis : false,
      timestamp: new Date().toISOString()
    };

    const allHealthy = health.abuseDetectionSystem && health.redisConnection;
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      health
    });
    
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

export default router;