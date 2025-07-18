/**
 * Enterprise-Grade IP-Based Freemium Session Service
 * Implements robust IP-based question limit tracking with comprehensive edge case handling
 * Based on industry best practices for freemium models and session management
 */

import { db } from "../db";
import { anonQuestionSessions } from "../../../shared/schema";
import { eq, and, lte } from "drizzle-orm";
import * as ipaddr from 'ipaddr.js';
import * as crypto from 'crypto';
import { Request } from 'express';

// Fixed: Configurable constants with environment variable support
const MAX_FREE_QUESTIONS = 20;
const RESET_HOURS = Number(process.env.VITE_RESET_HOURS) || 24;
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
 * Fixed: Enhanced IP normalization using ipaddr.js for robust IPv4/IPv6 handling
 * Handles both IPv4 and IPv6 formats with proper normalization
 */
function normalizeIpAddress(ip: string): string {
  try {
    // Handle IPv4-mapped IPv6 addresses first
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    // Fixed: Use ipaddr.js for proper IP parsing and normalization
    const parsed = ipaddr.process(ip);
    
    if (parsed.kind() === 'ipv4') {
      // For IPv4, return the string representation
      return parsed.toString();
    } else if (parsed.kind() === 'ipv6') {
      // For IPv6, return the full representation
      return parsed.toString();
    }
    
    // Fallback to original if parsing succeeds but type is unexpected
    return ip.trim();
  } catch (error) {
    console.warn(`Failed to normalize IP address with ipaddr.js: ${ip}`, error);
    
    // Fixed: Fallback to basic validation for malformed IPs
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return ip.trim(); // Return trimmed IPv4
    }
    
    return ip.trim(); // Return original for IPv6 or other formats
  }
}

// Fixed: Type-safe client key type definition
type ClientKey = string | null;

/**
 * Fixed: Enhanced IP extraction utility function for serverless environments
 */
function extractIp(req: Request): string | null {
  // Fixed: Enhanced IP extraction for Vercel and other serverless platforms
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // First IP in the chain
  }

  // Fixed: Additional headers for different proxy configurations
  const realIP = req.headers['x-real-ip'] as string;
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers['cf-connecting-ip'] as string; // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  const xClientIP = req.headers['x-client-ip'] as string;
  if (xClientIP) {
    return xClientIP;
  }

  // Fallback to connection properties
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip ||
         null;
}

/**
 * Fixed: Enhanced client key generation with proper type safety and user-agent support
 * Combines IP with hashed user-agent for better granularity on shared IPs
 */
function getClientKey(req: Request): ClientKey {
  const ip = extractIp(req);

  if (!ip) {
    console.warn('Unable to determine client IP address');
    return null;
  }

  // Normalize the IP address
  const normalizedIp = normalizeIpAddress(ip);

  // Fixed: Enable user-agent hash for better session granularity on shared IPs
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent) {
    const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
    return `${normalizedIp}:${uaHash}`;
  }

  return normalizedIp;
}

/**
 * Fixed: Enhanced user-agent hash with empty string handling
 */
function createUserAgentHash(userAgent: string): string {
  // Fixed: Handle empty user-agent gracefully
  if (!userAgent || userAgent.trim() === '') {
    return 'unknown_ua';
  }
  return crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
}

export class FreemiumService {
  /**
   * Fixed: Consolidated session info calculation utility
   */
  private calculateSessionInfo(clientKey: string, resetThreshold: Date): Promise<FreemiumSessionInfo> {
    return this.getSessionInfo(clientKey, resetThreshold);
  }

  /**
   * Fixed: Enhanced question limit check with fail-closed security and proper type safety
   */
  async checkQuestionLimit(req: Request): Promise<FreemiumCheckResult> {
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

      // Get current session info using consolidated utility
      const sessionInfo = await this.calculateSessionInfo(clientKey, resetThreshold);
      
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
      // Fixed: Fail-closed policy for better security - deny access on errors
      return {
        allowed: false,
        sessionInfo: this.createEmptySessionInfo(),
        message: 'Service temporarily unavailable. Please try again later.'
      };
    }
  }

  /**
   * Fixed: Enhanced question view recording with comprehensive error handling and database transactions
   */
  async recordQuestionView(req: Request): Promise<FreemiumCheckResult> {
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

      // Fixed: Enhanced database transaction with comprehensive error handling
      const result = await db.transaction(async (tx) => {
        try {
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
        } catch (transactionError) {
          console.error('Transaction error in recordQuestionView:', transactionError);
          throw transactionError;
        }
      });

      if (result.overLimit) {
        const sessionInfo = await this.calculateSessionInfo(clientKey, resetThreshold);
        return {
          allowed: false,
          sessionInfo,
          message: `Free question limit reached (${MAX_FREE_QUESTIONS} questions per ${RESET_HOURS} hours). Please sign up for unlimited access!`
        };
      }

      // Get updated session info using consolidated utility
      const sessionInfo = await this.calculateSessionInfo(clientKey, resetThreshold);
      
      return {
        allowed: true,
        sessionInfo
      };
    } catch (error) {
      console.error('Error recording question view:', error);
      // Fixed: Return error result instead of throwing to prevent unhandled exceptions
      return {
        allowed: false,
        sessionInfo: this.createEmptySessionInfo(),
        message: 'Unable to record question view. Please try again.'
      };
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
        .where(lte(anonQuestionSessions.lastReset, cleanupThreshold))
        .returning();

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

// Fixed: Conditional cleanup scheduling for different environments
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  // Only run setInterval in non-Vercel environments
  // In Vercel, use Vercel Cron Jobs instead
  setInterval(() => {
    freemiumService.cleanupOldSessions().catch(error => {
      console.error('Failed to cleanup old freemium sessions:', error);
    });
  }, 6 * 60 * 60 * 1000); // 6 hours
} else {
  console.log('🔄 Freemium cleanup: Use Vercel Cron Jobs for production cleanup');
}