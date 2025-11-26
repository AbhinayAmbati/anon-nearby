/**
 * Smart Proximity Matchmaking Engine
 * Advanced matchmaking system with distance ranking, wait-time scoring, 
 * compatibility scoring, and queue management using Redis Sorted Sets
 */

class SmartMatchmakingEngine {
  constructor(redisClient) {
    this.redis = redisClient;
    this.useRedis = !!redisClient;
    
    // Redis keys for different scoring systems
    this.keys = {
      waitQueue: 'matchmaking:wait_queue',
      distanceRanking: 'matchmaking:distance_ranking',
      compatibilityScores: 'matchmaking:compatibility_scores',
      sessionStats: 'matchmaking:session_stats',
      matchHistory: 'matchmaking:match_history',
      userPreferences: 'matchmaking:user_preferences'
    };
    
    // Scoring weights for matchmaking algorithm
    this.weights = {
      distance: 0.4,      // 40% weight for proximity
      waitTime: 0.3,      // 30% weight for how long they've been waiting
      compatibility: 0.2,  // 20% weight for compatibility score
      freshness: 0.1      // 10% weight for avoiding repeat matches
    };
    
    // In-memory fallback storage
    this.memoryStorage = {
      waitQueue: new Map(),
      distanceRanking: new Map(),
      compatibilityScores: new Map(),
      sessionStats: new Map(),
      matchHistory: new Map()
    };
  }

  /**
   * Add user to matchmaking queue with comprehensive scoring
   */
  async addToMatchmakingQueue(userSession) {
    const timestamp = Date.now();
    const userId = userSession.sessionId;
    
    try {
      if (this.useRedis) {
        // Add to wait queue with timestamp as score
        await this.redis.zadd(this.keys.waitQueue, timestamp, userId);
        
        // Set TTL on wait queue (2 hours = 7200 seconds)
        await this.redis.expire(this.keys.waitQueue, 7200);
        
        // Initialize user session stats if not exists
        await this.initializeSessionStats(userId, userSession);
        
        console.log(`🎯 ${userSession.codename} added to smart matchmaking queue`);
      } else {
        // Fallback to memory storage
        this.memoryStorage.waitQueue.set(userId, {
          timestamp,
          userSession,
          waitTime: 0
        });
      }
    } catch (error) {
      console.error('Error adding to matchmaking queue:', error);
      this.useRedis = false;
      this.memoryStorage.waitQueue.set(userId, {
        timestamp,
        userSession,
        waitTime: 0
      });
    }
  }

  /**
   * Initialize session statistics for new user
   */
  async initializeSessionStats(userId, userSession) {
    const stats = {
      totalSessions: 1,
      totalChatTime: 0,
      averageMessageLength: 0,
      preferredRadius: userSession.searchRadius || 1000,
      responseTime: 0,
      chatRating: 5.0, // Default neutral rating
      joinTime: Date.now()
    };

    if (this.useRedis) {
      await this.redis.hset(this.keys.sessionStats, userId, JSON.stringify(stats));
      
      // Set TTL on session stats hash (2 hours = 7200 seconds)
      await this.redis.expire(this.keys.sessionStats, 7200);
    } else {
      this.memoryStorage.sessionStats.set(userId, stats);
    }
  }

  /**
   * Find optimal matches using advanced scoring algorithm
   */
  async findOptimalMatch(userSession) {
    const userId = userSession.sessionId;
    const userLocation = userSession.location;
    const searchRadius = userSession.searchRadius || 1000;

    try {
      // Get all users in queue (excluding current user)
      const candidateUsers = await this.getCandidateUsers(userId);
      
      if (candidateUsers.length === 0) {
        return null;
      }

      // Calculate comprehensive scores for each candidate
      const scoredCandidates = await this.calculateMatchScores(
        userSession, 
        candidateUsers, 
        searchRadius
      );

      // Sort by total score (highest first)
      scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

      // Find the best match within radius
      const bestMatch = scoredCandidates.find(candidate => 
        candidate.distance <= searchRadius && candidate.totalScore > 0.3
      );

      if (bestMatch) {
        // Remove both users from queue and update match history
        await this.finalizeMatch(userId, bestMatch.userId);
        return bestMatch.userSession;
      }

      return null;

    } catch (error) {
      console.error('Error finding optimal match:', error);
      return null;
    }
  }

  /**
   * Get candidate users from matchmaking queue
   */
  async getCandidateUsers(excludeUserId) {
    try {
      if (this.useRedis) {
        // Get all users from wait queue
        const queueMembers = await this.redis.zrange(this.keys.waitQueue, 0, -1, 'WITHSCORES');
        const candidates = [];

        for (let i = 0; i < queueMembers.length; i += 2) {
          const candidateId = queueMembers[i];
          const joinTime = queueMembers[i + 1];

          if (candidateId !== excludeUserId) {
            // Get user session data (you'll need to store this in Redis or retrieve from active sessions)
            const sessionData = await this.getUserSessionData(candidateId);
            if (sessionData) {
              candidates.push({
                userId: candidateId,
                joinTime: parseFloat(joinTime),
                userSession: sessionData
              });
            }
          }
        }

        return candidates;
      } else {
        // Fallback to memory storage
        const candidates = [];
        for (const [candidateId, data] of this.memoryStorage.waitQueue.entries()) {
          if (candidateId !== excludeUserId) {
            candidates.push({
              userId: candidateId,
              joinTime: data.timestamp,
              userSession: data.userSession
            });
          }
        }
        return candidates;
      }
    } catch (error) {
      console.error('Error getting candidate users:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive match scores
   */
  async calculateMatchScores(userSession, candidateUsers, searchRadius) {
    const scoredCandidates = [];
    const currentTime = Date.now();

    for (const candidate of candidateUsers) {
      try {
        // Calculate distance score (inverse relationship - closer is better)
        const distance = this.calculateDistance(
          userSession.location.latitude,
          userSession.location.longitude,
          candidate.userSession.location.latitude,
          candidate.userSession.location.longitude
        );

        const distanceScore = Math.max(0, 1 - (distance / searchRadius));

        // Calculate wait time score (longer wait = higher priority)
        const waitTime = currentTime - candidate.joinTime;
        const waitTimeScore = Math.min(1, waitTime / (5 * 60 * 1000)); // Max score after 5 minutes

        // Calculate compatibility score
        const compatibilityScore = await this.calculateCompatibilityScore(
          userSession.sessionId, 
          candidate.userId
        );

        // Calculate freshness score (avoid recent matches)
        const freshnessScore = await this.calculateFreshnessScore(
          userSession.sessionId,
          candidate.userId
        );

        // Calculate weighted total score
        const totalScore = (
          (distanceScore * this.weights.distance) +
          (waitTimeScore * this.weights.waitTime) +
          (compatibilityScore * this.weights.compatibility) +
          (freshnessScore * this.weights.freshness)
        );

        scoredCandidates.push({
          userId: candidate.userId,
          userSession: candidate.userSession,
          distance: distance,
          distanceScore,
          waitTimeScore,
          compatibilityScore,
          freshnessScore,
          totalScore,
          breakdown: {
            distance: `${Math.round(distance)}m`,
            waitTime: `${Math.round(waitTime / 1000)}s`,
            compatibility: compatibilityScore.toFixed(2),
            freshness: freshnessScore.toFixed(2)
          }
        });

      } catch (error) {
        console.error('Error calculating score for candidate:', candidate.userId, error);
      }
    }

    return scoredCandidates;
  }

  /**
   * Calculate compatibility score based on session statistics
   */
  async calculateCompatibilityScore(userId1, userId2) {
    try {
      const stats1 = await this.getSessionStats(userId1);
      const stats2 = await this.getSessionStats(userId2);

      if (!stats1 || !stats2) {
        return 0.5; // Default neutral score
      }

      // Calculate compatibility factors
      const radiusCompatibility = 1 - Math.abs(stats1.preferredRadius - stats2.preferredRadius) / 5000;
      const ratingCompatibility = 1 - Math.abs(stats1.chatRating - stats2.chatRating) / 5;
      const responseTimeCompatibility = stats1.responseTime && stats2.responseTime ? 
        1 - Math.abs(stats1.responseTime - stats2.responseTime) / 10000 : 0.5;

      // Weighted average of compatibility factors
      return Math.max(0, Math.min(1, 
        (radiusCompatibility * 0.4) + 
        (ratingCompatibility * 0.4) + 
        (responseTimeCompatibility * 0.2)
      ));

    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return 0.5;
    }
  }

  /**
   * Calculate freshness score to avoid repeat matches
   */
  async calculateFreshnessScore(userId1, userId2) {
    try {
      const matchKey = `${Math.min(userId1, userId2)}:${Math.max(userId1, userId2)}`;
      
      if (this.useRedis) {
        const lastMatch = await this.redis.zscore(this.keys.matchHistory, matchKey);
        if (!lastMatch) {
          return 1.0; // Never matched before - perfect freshness
        }
        
        const timeSinceLastMatch = Date.now() - lastMatch;
        const hoursAgo = timeSinceLastMatch / (1000 * 60 * 60);
        
        // Full freshness after 24 hours, linear decay
        return Math.min(1, hoursAgo / 24);
      } else {
        const lastMatch = this.memoryStorage.matchHistory.get(matchKey);
        if (!lastMatch) {
          return 1.0;
        }
        
        const timeSinceLastMatch = Date.now() - lastMatch;
        const hoursAgo = timeSinceLastMatch / (1000 * 60 * 60);
        return Math.min(1, hoursAgo / 24);
      }

    } catch (error) {
      console.error('Error calculating freshness score:', error);
      return 1.0; // Default to fresh match on error
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId) {
    try {
      if (this.useRedis) {
        const statsJson = await this.redis.hget(this.keys.sessionStats, userId);
        return statsJson ? JSON.parse(statsJson) : null;
      } else {
        return this.memoryStorage.sessionStats.get(userId) || null;
      }
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }

  /**
   * Finalize match and update history
   */
  async finalizeMatch(userId1, userId2) {
    const matchKey = `${Math.min(userId1, userId2)}:${Math.max(userId1, userId2)}`;
    const timestamp = Date.now();

    try {
      if (this.useRedis) {
        // Remove both users from wait queue
        await this.redis.zrem(this.keys.waitQueue, userId1, userId2);
        
        // Record match in history
        await this.redis.zadd(this.keys.matchHistory, timestamp, matchKey);
        
        // Clean old match history (older than 30 days)
        const thirtyDaysAgo = timestamp - (30 * 24 * 60 * 60 * 1000);
        await this.redis.zremrangebyscore(this.keys.matchHistory, '-inf', thirtyDaysAgo);
        
        console.log(`✨ Smart match finalized: ${userId1} ↔ ${userId2}`);
      } else {
        // Fallback to memory storage
        this.memoryStorage.waitQueue.delete(userId1);
        this.memoryStorage.waitQueue.delete(userId2);
        this.memoryStorage.matchHistory.set(matchKey, timestamp);
      }
    } catch (error) {
      console.error('Error finalizing match:', error);
    }
  }

  /**
   * Remove user from matchmaking queue
   */
  async removeFromQueue(userId) {
    try {
      if (this.useRedis) {
        await this.redis.zrem(this.keys.waitQueue, userId);
      } else {
        this.memoryStorage.waitQueue.delete(userId);
      }
      console.log(`🚪 ${userId} removed from matchmaking queue`);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  /**
   * Update user session statistics after chat
   */
  async updateSessionStats(userId, chatDuration, messageCount, averageResponseTime) {
    try {
      const stats = await this.getSessionStats(userId) || {
        totalSessions: 0,
        totalChatTime: 0,
        averageMessageLength: 0,
        preferredRadius: 1000,
        responseTime: 0,
        chatRating: 5.0
      };

      // Update statistics
      stats.totalSessions += 1;
      stats.totalChatTime += chatDuration;
      stats.responseTime = averageResponseTime || stats.responseTime;
      
      if (this.useRedis) {
        await this.redis.hset(this.keys.sessionStats, userId, JSON.stringify(stats));
      
      // Set TTL on session stats hash (2 hours = 7200 seconds)
      await this.redis.expire(this.keys.sessionStats, 7200);
      } else {
        this.memoryStorage.sessionStats.set(userId, stats);
      }

      console.log(`📊 Updated session stats for ${userId}`);
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  /**
   * Get matchmaking queue status
   */
  async getQueueStatus() {
    try {
      if (this.useRedis) {
        const queueSize = await this.redis.zcard(this.keys.waitQueue);
        const oldestWait = await this.redis.zrange(this.keys.waitQueue, 0, 0, 'WITHSCORES');
        
        let averageWaitTime = 0;
        if (oldestWait.length > 0) {
          averageWaitTime = Date.now() - parseFloat(oldestWait[1]);
        }

        return {
          queueSize,
          averageWaitTime: Math.round(averageWaitTime / 1000), // in seconds
          totalMatches: await this.redis.zcard(this.keys.matchHistory)
        };
      } else {
        return {
          queueSize: this.memoryStorage.waitQueue.size,
          averageWaitTime: 0,
          totalMatches: this.memoryStorage.matchHistory.size
        };
      }
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { queueSize: 0, averageWaitTime: 0, totalMatches: 0 };
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  /**
   * Get user session data (to be implemented with your session management)
   */
  async getUserSessionData(userId) {
    // This needs to be connected to your existing session management
    // For now, return null - you'll need to integrate this with your sessionsBySocketId
    return null;
  }

  /**
   * Clean up all user data from Redis when they disconnect
   */
  async cleanupUserData(userId) {
    try {
      if (this.useRedis) {
        // Remove from wait queue
        await this.redis.zrem(this.keys.waitQueue, userId);
        
        // Remove session stats
        await this.redis.hdel(this.keys.sessionStats, userId);
        
        console.log(`🧹 Cleaned up matchmaking data for user: ${userId}`);
      } else {
        // Fallback to memory storage cleanup
        this.memoryStorage.waitQueue.delete(userId);
        this.memoryStorage.sessionStats.delete(userId);
      }
    } catch (error) {
      console.error('Error cleaning up user data from matchmaking:', error);
      // Fallback to memory cleanup on error
      this.memoryStorage.waitQueue.delete(userId);
      this.memoryStorage.sessionStats.delete(userId);
    }
  }
}

export default SmartMatchmakingEngine;
