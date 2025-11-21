import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

/**
 * Anonymous Abuse Detection Layer
 * 
 * Detects abuse patterns without logging personal data:
 * - Spam patterns & burst messaging
 * - Abusive content via Gemini AI
 * - Rapid reconnect/disconnect abuse
 * - Behavioral anomalies
 * 
 * Actions: soft-mute, shadow ban, temporary blocks
 * Uses Redis TTL counters for ephemeral tracking
 */
class AbuseDetectionLayer {
  constructor(redisClient) {
    this.redis = redisClient;
    this.useRedis = !!redisClient;
    
    // Validate Redis client methods
    if (this.useRedis && this.redis) {
      const requiredMethods = ['zAdd', 'zCount', 'setEx', 'hIncrBy', 'incr', 'expire', 'exists'];
      const missingMethods = requiredMethods.filter(method => typeof this.redis[method] !== 'function');
      
      if (missingMethods.length > 0) {
        console.warn('⚠️ Redis client missing methods:', missingMethods, '- falling back to memory store');
        this.useRedis = false;
      } else {
        console.log('✅ Redis client validated for abuse detection');
      }
    }
    
    this.memoryStore = new Map(); // Fallback when Redis unavailable
    
    // Initialize Gemini AI
    this.initializeGemini();
    
    // Detection thresholds
    this.thresholds = {
      // Message rate limits
      messagesPerMinute: 20,
      messagesPerSecond: 3,
      burstMessageLimit: 5,
      burstTimeWindow: 2000, // 2 seconds
      
      // Connection abuse
      reconnectsPerMinute: 10,
      disconnectsPerMinute: 15,
      
      // Content patterns
      duplicateMessageLimit: 3,
      capsLockThreshold: 0.7, // 70% caps
      repeatedCharsThreshold: 5,
      
      // Penalties (in seconds)
      softMuteDuration: 30,
      shadowBanDuration: 300, // 5 minutes
      tempBlockDuration: 900, // 15 minutes
      severeBlockDuration: 3600 // 1 hour
    };
    
    // Redis key prefixes for TTL counters
    this.keys = {
      messageRate: 'abuse:msg_rate:',
      messageCount: 'abuse:msg_count:',
      burstDetection: 'abuse:burst:',
      reconnects: 'abuse:reconnect:',
      disconnects: 'abuse:disconnect:',
      duplicateMsg: 'abuse:duplicate:',
      penalties: 'abuse:penalty:',
      shadowBan: 'abuse:shadow:',
      contentHistory: 'abuse:content:'
    };
  }

  /**
   * Initialize Gemini AI for content moderation
   */
  initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Content AI moderation disabled.');
      this.gemini = null;
      return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Specialized prompt for abuse detection
      this.moderationPrompt = `You are a strict content moderator for an anonymous chat app. Your job is to keep conversations safe and respectful.

ANALYZE THE MESSAGE BELOW AND RESPOND WITH EXACTLY ONE WORD:

• SAFE - Normal, friendly conversation, appropriate language, casual chat
• BLOCK - ANY of the following:
  - Profanity, vulgar language, curse words
  - Sexual content, explicit language, inappropriate references
  - Harassment, threats, aggressive language
  - Hate speech, discriminatory language
  - Spam, nonsensical text, excessive repetition
  - Personal information requests (phone, address, etc.)
  - Inappropriate meeting suggestions

BE STRICT: When in doubt, choose BLOCK to keep users safe.
Respond with ONLY the word SAFE or BLOCK.

Message: `;

      console.log('✅ Gemini AI content moderation initialized');
    } catch (error) {
      console.error('❌ Gemini AI initialization failed:', error.message);
      this.gemini = null;
    }
  }

  /**
   * Main abuse detection pipeline for incoming messages
   */
  async detectAbuse(sessionId, message, socketId, messageType = 'chat') {
    const userId = this.hashUserId(sessionId); // Anonymous hash for tracking
    const results = {
      isBlocked: false,
      isMuted: false,
      isShadowBanned: false,
      action: null,
      reason: null,
      severity: 'none'
    };

    try {
      console.log(`🔍 Abuse detection for message: "${message}" from user ${userId.substring(0, 8)}...`);

      // 1. Check existing penalties
      const existingPenalty = await this.checkExistingPenalties(userId);
      if (existingPenalty.isBlocked) {
        console.log(`⚠️ User already blocked: ${userId.substring(0, 8)}...`);
        return { ...existingPenalty, action: 'block' };
      }
      if (existingPenalty.isShadowBanned) {
        results.isShadowBanned = true;
      }

      // 2. Rate limiting detection
      const rateLimitResult = await this.detectRateLimit(userId);
      if (rateLimitResult.violation) {
        return await this.applyPenalty(userId, 'rate_limit', rateLimitResult.severity);
      }

      // 3. Burst messaging detection
      const burstResult = await this.detectBurstMessaging(userId);
      if (burstResult.violation) {
        return await this.applyPenalty(userId, 'burst_messaging', burstResult.severity);
      }

      // 4. Content analysis (AI + Pattern detection)
      if (messageType === 'chat' && message) {
        console.log(`🧠 Analyzing content: "${message}"`);
        const contentResult = await this.analyzeContent(userId, message);
        console.log(`📊 Content analysis result:`, contentResult);
        if (contentResult.violation) {
          console.log(`🚫 Content violation detected: ${contentResult.reason} (${contentResult.severity})`);
          return await this.applyPenalty(userId, 'content_abuse', contentResult.severity);
        }
        
        // Check for spam patterns
        const spamResult = await this.detectSpamPatterns(userId, message);
        if (spamResult.violation) {
          return await this.applyPenalty(userId, 'spam', spamResult.severity);
        }
      }

      // 5. Update counters for future detection
      await this.updateUserCounters(userId, messageType);

      // Return shadow ban status if active
      return results;

    } catch (error) {
      console.error('Error in abuse detection:', error);
      return results; // Fail open - don't block on errors
    }
  }

  /**
   * Analyze content using Gemini AI + pattern detection
   */
  async analyzeContent(userId, message) {
    const result = { violation: false, severity: 'none', reason: null };

    try {
      // Basic pattern detection first (faster)
      const patternResult = this.detectBasicPatterns(message);
      if (patternResult.violation) {
        return patternResult;
      }

      // Gemini AI analysis for nuanced content
      if (this.gemini && message.length > 3) {
        const aiResult = await this.analyzeWithGemini(message);
        if (aiResult.violation) {
          await this.recordContentViolation(userId, message, aiResult.severity);
          return aiResult;
        }
      }

      return result;
    } catch (error) {
      console.error('Content analysis error:', error);
      return result;
    }
  }

  /**
   * Gemini AI content analysis
   */
  async analyzeWithGemini(message) {
    try {
      const prompt = this.moderationPrompt + `"${message}"`;
      const result = await this.gemini.generateContent(prompt);
      const response = result.response.text().trim().toUpperCase();

      const severityMap = {
        'SAFE': { violation: false, severity: 'none' },
        'BLOCK': { violation: true, severity: 'moderate', reason: 'inappropriate_content' }
      };

      // Default to blocking if response is unexpected
      return severityMap[response] || { violation: true, severity: 'moderate', reason: 'content_flagged' };

    } catch (error) {
      console.error('Gemini analysis error:', error);
      return { violation: false, severity: 'none' };
    }
  }

  /**
   * Basic pattern detection (fast, non-AI)
   */
  detectBasicPatterns(message) {
    const text = message.toLowerCase();
    console.log(`🔍 Basic pattern check for: "${text}"`);
    
    // Basic profanity detection (add common patterns)
    const profanityPatterns = [
      /\b(f[u*]ck|fuck|shit|sh[i*]t|bitch|b[i*]tch|ass|asshole|a[s*]{2}hole|damn|hell|crap)\b/i,
      /\b(sex|porn|nude|n[u*]de|dick|d[i*]ck|pussy|p[u*]ssy|cock|c[o*]ck)\b/i,
      /\b(kill yourself|kys|die|suicide|wtf|stfu)\b/i,
      /\b(stupid|idiot|retard|moron|dumb)\s+(you|ass|bitch)\b/i
    ];
    
    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        console.log(`🚫 Profanity detected with pattern: ${pattern}`);
        return { violation: true, severity: 'moderate', reason: 'profanity_detected' };
      }
    }
    
    // Excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > this.thresholds.capsLockThreshold && message.length > 10) {
      return { violation: true, severity: 'mild', reason: 'excessive_caps' };
    }
    
    // Repeated characters (spammy patterns)
    const repeatedPattern = /(.)\1{4,}/g;
    if (repeatedPattern.test(message)) {
      return { violation: true, severity: 'moderate', reason: 'spam_pattern' };
    }
    
    // URL/link spam (basic detection)
    const urlPattern = /(https?:\/\/|www\.|\.[a-z]{2,4}\/)/gi;
    if (urlPattern.test(text)) {
      return { violation: true, severity: 'moderate', reason: 'link_spam' };
    }
    
    return { violation: false, severity: 'none' };
  }

  /**
   * Detect rate limiting violations
   */
  async detectRateLimit(userId) {
    try {
      const key = this.keys.messageRate + userId;
      
      if (this.useRedis) {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, 60); // 1 minute window
        }
        
        if (count > this.thresholds.messagesPerMinute) {
          return { violation: true, severity: 'moderate', reason: 'rate_limit_exceeded' };
        }
      } else {
        // Fallback to memory
        const now = Date.now();
        const userKey = `rate_${userId}`;
        const userData = this.memoryStore.get(userKey) || { count: 0, lastReset: now };
        
        if (now - userData.lastReset > 60000) {
          userData.count = 1;
          userData.lastReset = now;
        } else {
          userData.count++;
        }
        
        this.memoryStore.set(userKey, userData);
        
        if (userData.count > this.thresholds.messagesPerMinute) {
          return { violation: true, severity: 'moderate', reason: 'rate_limit_exceeded' };
        }
      }
      
      return { violation: false, severity: 'none' };
    } catch (error) {
      console.error('Rate limit detection error:', error);
      return { violation: false, severity: 'none' };
    }
  }

  /**
   * Detect burst messaging patterns
   */
  async detectBurstMessaging(userId) {
    try {
      const key = this.keys.burstDetection + userId;
      const now = Date.now();
      
      if (this.useRedis && this.redis && typeof this.redis.zAdd === 'function') {
        // Store timestamps of recent messages
        await this.redis.zAdd(key, { score: now, value: now.toString() });
        await this.redis.expire(key, 10); // Keep for 10 seconds
        
        // Count messages in burst window
        const cutoff = now - this.thresholds.burstTimeWindow;
        const recentCount = await this.redis.zCount(key, cutoff, '+inf');
        
        if (recentCount > this.thresholds.burstMessageLimit) {
          return { violation: true, severity: 'moderate', reason: 'burst_messaging' };
        }
      }
      
      return { violation: false, severity: 'none' };
    } catch (error) {
      console.error('Burst detection error:', error);
      return { violation: false, severity: 'none' };
    }
  }

  /**
   * Detect spam patterns and duplicate messages
   */
  async detectSpamPatterns(userId, message) {
    try {
      const messageHash = this.hashMessage(message);
      const key = this.keys.duplicateMsg + userId;
      
      if (this.useRedis) {
        const count = await this.redis.hIncrBy(key, messageHash, 1);
        await this.redis.expire(key, 300); // 5 minutes
        
        if (count > this.thresholds.duplicateMessageLimit) {
          return { violation: true, severity: 'moderate', reason: 'duplicate_spam' };
        }
      }
      
      return { violation: false, severity: 'none' };
    } catch (error) {
      console.error('Spam detection error:', error);
      return { violation: false, severity: 'none' };
    }
  }

  /**
   * Check for existing penalties
   */
  async checkExistingPenalties(userId) {
    const result = { isBlocked: false, isMuted: false, isShadowBanned: false };
    
    try {
      if (this.useRedis) {
        const [penaltyExists, shadowExists] = await Promise.all([
          this.redis.exists(this.keys.penalties + userId),
          this.redis.exists(this.keys.shadowBan + userId)
        ]);
        
        result.isBlocked = penaltyExists === 1;
        result.isShadowBanned = shadowExists === 1;
      }
      
      return result;
    } catch (error) {
      console.error('Penalty check error:', error);
      return result;
    }
  }

  /**
   * Apply penalties based on violation type and severity
   */
  async applyPenalty(userId, violationType, severity) {
    try {
      // Check violation history for progressive penalties
      const violationHistory = await this.getViolationHistory(userId);
      let duration = this.thresholds.softMuteDuration;
      let action = 'soft_mute';
      
      // Determine penalty based on severity, violation type, and history
      switch (severity) {
        case 'mild':
          duration = this.thresholds.softMuteDuration;
          action = 'soft_mute';
          break;
        case 'moderate':
          // Progressive penalties for content abuse
          if (violationType === 'content_abuse' || violationType === 'profanity_detected') {
            if (violationHistory.contentViolations === 0) {
              // First offense: Warning dialog only
              duration = 0;
              action = 'content_warning';
            } else if (violationHistory.contentViolations === 1) {
              // Second offense: Shadow ban
              duration = this.thresholds.shadowBanDuration;
              action = 'shadow_ban';
            } else {
              // Third+ offense: Temporary block
              duration = this.thresholds.tempBlockDuration;
              action = 'temp_block';
            }
          } else {
            duration = this.thresholds.shadowBanDuration;
            action = 'shadow_ban';
          }
          break;
        case 'severe':
          duration = this.thresholds.tempBlockDuration;
          action = 'temp_block';
          break;
      }
      
      // Apply penalty in Redis (only if not just a warning)
      if (this.useRedis && this.redis && typeof this.redis.setEx === 'function' && action !== 'content_warning') {
        if (action === 'shadow_ban') {
          await this.redis.setEx(this.keys.shadowBan + userId, duration, violationType);
        } else {
          await this.redis.setEx(this.keys.penalties + userId, duration, `${action}:${violationType}`);
        }
      }
      
      // Track violation for future escalation
      await this.recordContentViolation(userId, '', severity);
      
      console.log(`🚫 Applied ${action} to user ${userId.substring(0, 8)}... for ${violationType} (${duration}s)`);
      
      return {
        isBlocked: action === 'temp_block' || action === 'content_warning',
        isMuted: action === 'soft_mute',
        isShadowBanned: action === 'shadow_ban',
        action,
        reason: violationType,
        severity,
        duration
      };
      
    } catch (error) {
      console.error('Apply penalty error:', error);
      return { isBlocked: false, isMuted: false, isShadowBanned: false };
    }
  }

  /**
   * Track connection abuse (reconnects/disconnects)
   */
  async trackConnectionAbuse(userId, type = 'connect') {
    try {
      const key = type === 'connect' ? 
        this.keys.reconnects + userId : 
        this.keys.disconnects + userId;
      
      if (this.useRedis) {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, 60); // 1 minute window
        }
        
        const limit = type === 'connect' ? 
          this.thresholds.reconnectsPerMinute : 
          this.thresholds.disconnectsPerMinute;
        
        if (count > limit) {
          console.log(`🔄 Connection abuse detected: ${type} for ${userId.substring(0, 8)}...`);
          await this.applyPenalty(userId, `connection_abuse_${type}`, 'moderate');
        }
      }
    } catch (error) {
      console.error('Connection abuse tracking error:', error);
    }
  }

  /**
   * Update user activity counters
   */
  async updateUserCounters(userId, activityType) {
    try {
      if (this.useRedis) {
        const key = this.keys.messageCount + userId;
        await this.redis.incr(key);
        await this.redis.expire(key, 3600); // 1 hour
      }
    } catch (error) {
      console.error('Counter update error:', error);
    }
  }

  /**
   * Get violation history for progressive penalties
   */
  async getViolationHistory(userId) {
    try {
      const history = { contentViolations: 0, totalViolations: 0 };
      
      if (this.useRedis && this.redis) {
        const key = this.keys.contentHistory + userId;
        const violations = await this.redis.lRange(key, 0, -1);
        
        history.totalViolations = violations.length;
        history.contentViolations = violations.filter(v => {
          try {
            const violation = JSON.parse(v);
            return violation.severity === 'moderate' || violation.severity === 'severe';
          } catch {
            return false;
          }
        }).length;
      }
      
      return history;
    } catch (error) {
      console.error('Error getting violation history:', error);
      return { contentViolations: 0, totalViolations: 0 };
    }
  }

  /**
   * Record content violations for pattern analysis
   */
  async recordContentViolation(userId, message, severity) {
    try {
      if (this.useRedis) {
        const key = this.keys.contentHistory + userId;
        const violation = {
          timestamp: Date.now(),
          severity,
          length: message.length,
          hash: this.hashMessage(message).substring(0, 8) // Partial hash for privacy
        };
        
        await this.redis.lPush(key, JSON.stringify(violation));
        await this.redis.lTrim(key, 0, 9); // Keep last 10 violations
        await this.redis.expire(key, 86400); // 24 hours
      }
    } catch (error) {
      console.error('Violation recording error:', error);
    }
  }

  /**
   * Get abuse statistics (for monitoring)
   */
  async getAbuseStats() {
    try {
      const stats = {
        activePenalties: 0,
        activeShadowBans: 0,
        totalViolations: 0,
        geminiEnabled: !!this.gemini
      };

      if (this.useRedis) {
        // Count active penalties and shadow bans
        const keys = await this.redis.keys('abuse:penalty:*');
        stats.activePenalties = keys.length;
        
        const shadowKeys = await this.redis.keys('abuse:shadow:*');
        stats.activeShadowBans = shadowKeys.length;
      }

      return stats;
    } catch (error) {
      console.error('Stats error:', error);
      return { error: error.message };
    }
  }

  /**
   * Utility functions
   */
  hashUserId(sessionId) {
    // Create anonymous hash for tracking without storing actual IDs
    return crypto.createHash('sha256').update(sessionId + 'abuse_salt').digest('hex');
  }

  hashMessage(message) {
    return crypto.createHash('md5').update(message.toLowerCase().trim()).digest('hex');
  }

  /**
   * Clean up expired data (run periodically)
   */
  async cleanupExpiredData() {
    try {
      if (this.useRedis) {
        // Redis TTL handles automatic cleanup
        console.log('🧹 Abuse detection cleanup completed (Redis TTL)');
      } else {
        // Clean memory store
        this.memoryStore.clear();
        console.log('🧹 Abuse detection memory store cleared');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default AbuseDetectionLayer;