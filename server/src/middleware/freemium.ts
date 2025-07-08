/**
 * Enterprise-Grade Freemium Middleware
 * Implements IP-based question limits with comprehensive edge case handling
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { freemiumService, FreemiumCheckResult, FreemiumSessionInfo } from "../services/freemium-service";

// Global rate limiter to prevent DoS attacks
const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Freemium-specific rate limiter (more restrictive)
const freemiumRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 question requests per minute
  message: {
    success: false,
    message: 'Too many question requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to enforce freemium limits on question access
 * Skips authenticated users and applies IP-based limits to anonymous users
 */
export function enforceFreemiumLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip freemium limits for authenticated users (especially admins)
      const user = req.user || req.session?.user;
      if (user) {
        if (user.role === 'admin') {
          console.log('👑 Admin user - bypassing freemium limits');
        } else {
          console.log('🔓 Authenticated user - bypassing freemium limits');
        }
        return next();
      }

      // Apply rate limiting first
      globalRateLimit(req, res, (err) => {
        if (err) return;

        freemiumRateLimit(req, res, async (err) => {
          if (err) return;

          try {
            // Check question limit
            const result: FreemiumCheckResult = await freemiumService.checkQuestionLimit(req);

            if (!result.allowed) {
              console.log(`🚫 Freemium limit reached for IP: ${getClientIpForLogging(req)}`);
              return res.status(403).json({
                success: false,
                message: result.message || 'Question limit reached',
                freemiumInfo: {
                  questionsAnswered: result.sessionInfo.questionsAnswered,
                  remainingQuestions: result.sessionInfo.remainingQuestions,
                  percentageUsed: result.sessionInfo.percentageUsed,
                  resetTime: result.sessionInfo.lastReset
                },
                requiresAuth: true
              });
            }

            // Add session info to request for downstream handlers
            req.freemiumSession = result.sessionInfo;
            next();
          } catch (error) {
            console.error('Error in freemium middleware:', error);
            // Fail open - allow request to proceed
            next();
          }
        });
      });
    } catch (error) {
      console.error('Error in freemium enforcement:', error);
      // Fail open for better user experience
      next();
    }
  };
}

/**
 * Middleware to record question views for freemium tracking
 * Should be used after successful question delivery
 */
export function recordFreemiumQuestionView() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip for authenticated users
      if (req.user || req.session?.user) {
        return next();
      }

      // Record the question view
      const result: FreemiumCheckResult = await freemiumService.recordQuestionView(req);
      
      // Add updated session info to response headers for client tracking (only if headers not sent)
      if (!res.headersSent) {
        res.setHeader('X-Freemium-Questions-Answered', result.sessionInfo.questionsAnswered);
        res.setHeader('X-Freemium-Questions-Remaining', result.sessionInfo.remainingQuestions);
        res.setHeader('X-Freemium-Percentage-Used', result.sessionInfo.percentageUsed);
      }

      console.log(`📊 Question view recorded for IP: ${getClientIpForLogging(req)} (${result.sessionInfo.questionsAnswered}/${20})`);

      next();
    } catch (error) {
      console.error('Error recording question view:', error);
      // Don't block the response even if tracking fails
      next();
    }
  };
}

/**
 * Middleware to check freemium status without enforcing limits
 * Useful for providing session info to authenticated users
 */
export function checkFreemiumStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user || req.session?.user) {
        // For authenticated users, provide unlimited status
        req.freemiumSession = {
          questionsAnswered: 0,
          remainingQuestions: Infinity,
          isOverLimit: false,
          lastReset: new Date(),
          canViewQuestion: true,
          percentageUsed: 0
        };
      } else {
        // For anonymous users, get actual session info
        const result = await freemiumService.checkQuestionLimit(req);
        req.freemiumSession = result.sessionInfo;
      }

      next();
    } catch (error) {
      console.error('Error checking freemium status:', error);
      // Provide default status on error
      req.freemiumSession = {
        questionsAnswered: 0,
        remainingQuestions: 20,
        isOverLimit: false,
        lastReset: new Date(),
        canViewQuestion: true,
        percentageUsed: 0
      };
      next();
    }
  };
}

/**
 * Helper function to safely get client IP for logging
 */
function getClientIpForLogging(req: Request): string {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             req.ip ||
             'unknown';
  
  // Mask part of IP for privacy in logs
  if (ip.includes(':')) {
    // IPv6 - mask last segment
    const parts = ip.split(':');
    return parts.slice(0, -1).join(':') + ':****';
  } else {
    // IPv4 - mask last octet
    const parts = ip.split('.');
    if (parts.length === 4) {
      return parts.slice(0, 3).join('.') + '.***';
    }
  }
  
  return 'masked';
}

// Extend Request interface to include freemium session info
declare global {
  namespace Express {
    interface Request {
      freemiumSession?: FreemiumSessionInfo;
    }
  }
}

export { globalRateLimit, freemiumRateLimit };