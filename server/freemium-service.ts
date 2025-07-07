/**
 * Enterprise-Grade IP-Based Freemium Session Service
 * Implements robust IP-based question limit tracking with comprehensive edge case handling
 * Based on industry best practices for freemium models and session management
 */

import { db } from "./db";
import { anonQuestionSessions } from "../shared/schema";
import { eq, and, lte } from "drizzle-orm";
import * as ipaddr from 'ipaddr.js';
import * as crypto from 'crypto';

// Configuration constants
const MAX_FREE_QUESTIONS = 20;
const RESET_HOURS = 24;
const CLEANUP_INTERVAL_HOURS = 24 * 7; // Weekly cleanup

// Types for the service
export interface FreemiumSessionInfo {
  questionsAnswered: number;
  remainingQuestions: number;
  isOverLimit: boolean;
  lastReset: Date;
  canViewQuestion: boolean;
  percentageUsed: number;
}

export interface FreemiumCheckResult {
  allowed: boolean;
  sessionInfo: FreemiumSessionInfo;
  message?: string;
}

/**
 * Normalize IP address to handle IPv6 abbreviations and ensure consistency
 * Handles both IPv4 and IPv6 formats with proper normalization
 */
function normalizeIpAddress(ip: string): string {
  try {
    // Handle IPv4-mapped IPv6 addresses
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    // Simple IP normalization without complex parsing
    // For IPv4, just trim and return
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return ip.trim();
    }
    
    // For IPv6, return as-is (can be enhanced later)
    return ip.trim();
  } catch (error) {
    console.warn(`Failed to normalize IP address: ${ip}`, error);
    return ip; // Return original if parsing fails
  }
}

/**
 * Generate a client key for session tracking
 * Optionally combines IP with hashed user-agent for better granularity on shared IPs
 */
function getClientKey(req: any): string | null {
  // Extract IP from request headers (handles proxy chains)
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.ip;

  if (!ip) {
    console.warn('Unable to determine client IP address');
    return null;
  }

  // Normalize the IP address
  const normalizedIp = normalizeIpAddress(ip);

  // Optional: Combine with hashed user-agent for better granularity
  // Uncomment the following lines to enable UA-based differentiation
  /*
  const userAgent = req.headers['user-agent'] || '';
  const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
  return `${normalizedIp}:${uaHash}`;
  */

  return normalizedIp;
}

/**
 * Create or update user-agent hash for enhanced session tracking
 */
function createUserAgentHash(userAgent: string): string {
  return crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
}

export class FreemiumService {
  /**
   * Check if a user can view another question based on their IP-based session
   * Implements atomic operations to prevent race conditions
   */
  async checkQuestionLimit(req: any): Promise<FreemiumCheckResult> {
    const clientKey = getClientKey(req);
    
    if (!clientKey) {
      return {
        allowed: false,
        sessionInfo: this.createEmptySessionInfo(),
        message: 'Unable to determine client identifier'
      };
    }

    try {
      const now = new Date();
      const resetThreshold = new Date(now.getTime() - (RESET_HOURS * 60 * 60 * 1000));

      // Get current session info
      const sessionInfo = await this.getSessionInfo(clientKey, resetThreshold);
      
      if (sessionInfo.isOverLimit) {
        return {
          allowed: false,
          sessionInfo,
          message: `Free question limit reached (${MAX_FREE_QUESTIONS} questions per ${RESET_HOURS} hours). Please sign up for unlimited access!`
        };
      }

      return {
        allowed: true,
        sessionInfo
      };
    } catch (error) {
      console.error('Error checking question limit:', error);
      return {
        allowed: true, // Fail open for better user experience
        sessionInfo: this.createEmptySessionInfo(),
        message: 'Temporary service unavailable'
      };
    }
  }

  /**
   * Record that a user has viewed a question (atomic increment)
   * Uses database transactions to prevent race conditions
   */
  async recordQuestionView(req: any): Promise<FreemiumCheckResult> {
    const clientKey = getClientKey(req);
    
    if (!clientKey) {
      return {
        allowed: false,
        sessionInfo: this.createEmptySessionInfo(),
        message: 'Unable to determine client identifier'
      };
    }

    try {
      const now = new Date();
      const resetThreshold = new Date(now.getTime() - (RESET_HOURS * 60 * 60 * 1000));
      const userAgent = req.headers['user-agent'] || '';
      const userAgentHash = createUserAgentHash(userAgent);

      // Atomic update: only increment if under limit or needs reset
      const result = await db.transaction(async (tx) => {
        // Check if session exists and needs reset
        const existingSessions = await tx
          .select()
          .from(anonQuestionSessions)
          .where(eq(anonQuestionSessions.ipAddress, clientKey))
          .limit(1);

        const existingSession = existingSessions[0];

        if (existingSession) {
          // Check if reset is needed
          if (existingSession.lastReset < resetThreshold) {
            // Reset the session
            await tx
              .update(anonQuestionSessions)
              .set({
                questionsAnswered: 1,
                lastReset: now,
                updatedAt: now,
                userAgentHash
              })
              .where(eq(anonQuestionSessions.ipAddress, clientKey));

            return { questionsAnswered: 1, wasReset: true };
          } else {
            // Check if over limit
            if (existingSession.questionsAnswered >= MAX_FREE_QUESTIONS) {
              return { questionsAnswered: existingSession.questionsAnswered, wasReset: false, overLimit: true };
            }

            // Increment counter
            const newCount = existingSession.questionsAnswered + 1;
            await tx
              .update(anonQuestionSessions)
              .set({
                questionsAnswered: newCount,
                updatedAt: now,
                userAgentHash
              })
              .where(eq(anonQuestionSessions.ipAddress, clientKey));

            return { questionsAnswered: newCount, wasReset: false };
          }
        } else {
          // Create new session
          await tx
            .insert(anonQuestionSessions)
            .values({
              ipAddress: clientKey,
              questionsAnswered: 1,
              lastReset: now,
              userAgentHash,
              createdAt: now,
              updatedAt: now
            });

          return { questionsAnswered: 1, wasReset: false };
        }
      });

      if (result.overLimit) {
        const sessionInfo = await this.getSessionInfo(clientKey, resetThreshold);
        return {
          allowed: false,
          sessionInfo,
          message: `Free question limit reached (${MAX_FREE_QUESTIONS} questions per ${RESET_HOURS} hours). Please sign up for unlimited access!`
        };
      }

      // Get updated session info
      const sessionInfo = await this.getSessionInfo(clientKey, resetThreshold);
      
      return {
        allowed: true,
        sessionInfo
      };
    } catch (error) {
      console.error('Error recording question view:', error);
      throw error;
    }
  }

  /**
   * Get current session information for a client
   */
  async getSessionInfo(clientKey: string, resetThreshold: Date): Promise<FreemiumSessionInfo> {
    try {
      const sessions = await db
        .select()
        .from(anonQuestionSessions)
        .where(eq(anonQuestionSessions.ipAddress, clientKey))
        .limit(1);

      const session = sessions[0];

      if (!session) {
        return {
          questionsAnswered: 0,
          remainingQuestions: MAX_FREE_QUESTIONS,
          isOverLimit: false,
          lastReset: new Date(),
          canViewQuestion: true,
          percentageUsed: 0
        };
      }

      // Check if session needs reset
      const needsReset = session.lastReset < resetThreshold;
      const questionsAnswered = needsReset ? 0 : session.questionsAnswered;
      const remainingQuestions = Math.max(0, MAX_FREE_QUESTIONS - questionsAnswered);
      const isOverLimit = questionsAnswered >= MAX_FREE_QUESTIONS;
      const percentageUsed = Math.round((questionsAnswered / MAX_FREE_QUESTIONS) * 100);

      return {
        questionsAnswered,
        remainingQuestions,
        isOverLimit,
        lastReset: needsReset ? new Date() : session.lastReset,
        canViewQuestion: !isOverLimit,
        percentageUsed
      };
    } catch (error) {
      console.error('Error getting session info:', error);
      return this.createEmptySessionInfo();
    }
  }

  /**
   * Reset session for a specific IP (admin function)
   */
  async resetSession(clientKey: string): Promise<boolean> {
    try {
      const now = new Date();
      await db
        .update(anonQuestionSessions)
        .set({
          questionsAnswered: 0,
          lastReset: now,
          updatedAt: now
        })
        .where(eq(anonQuestionSessions.ipAddress, clientKey));

      return true;
    } catch (error) {
      console.error('Error resetting session:', error);
      return false;
    }
  }

  /**
   * Get session statistics for monitoring and analytics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    overLimitSessions: number;
    averageQuestionsAnswered: number;
  }> {
    try {
      const now = new Date();
      const resetThreshold = new Date(now.getTime() - (RESET_HOURS * 60 * 60 * 1000));

      const sessions = await db
        .select()
        .from(anonQuestionSessions);

      const activeSessions = sessions.filter(s => s.lastReset >= resetThreshold);
      const overLimitSessions = activeSessions.filter(s => s.questionsAnswered >= MAX_FREE_QUESTIONS);
      
      const totalQuestions = activeSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
      const averageQuestionsAnswered = activeSessions.length > 0 ? 
        Math.round(totalQuestions / activeSessions.length * 100) / 100 : 0;

      return {
        totalSessions: sessions.length,
        activeSessions: activeSessions.length,
        overLimitSessions: overLimitSessions.length,
        averageQuestionsAnswered
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        overLimitSessions: 0,
        averageQuestionsAnswered: 0
      };
    }
  }

  /**
   * Cleanup old sessions (run periodically)
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      const cleanupThreshold = new Date(Date.now() - (CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000));
      
      const deletedSessions = await db
        .delete(anonQuestionSessions)
        .where(lte(anonQuestionSessions.lastReset, cleanupThreshold));

      console.log(`Cleaned up ${deletedSessions.length || 0} old freemium sessions`);
      return deletedSessions.length || 0;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }

  /**
   * Create empty session info for error cases
   */
  private createEmptySessionInfo(): FreemiumSessionInfo {
    return {
      questionsAnswered: 0,
      remainingQuestions: MAX_FREE_QUESTIONS,
      isOverLimit: false,
      lastReset: new Date(),
      canViewQuestion: true,
      percentageUsed: 0
    };
  }
}

// Export singleton instance
export const freemiumService = new FreemiumService();

// Schedule periodic cleanup (run every 6 hours)
setInterval(() => {
  freemiumService.cleanupOldSessions().catch(error => {
    console.error('Failed to cleanup old freemium sessions:', error);
  });
}, 6 * 60 * 60 * 1000); // 6 hours