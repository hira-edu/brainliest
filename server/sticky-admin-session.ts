import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { getSubdomainContext } from './subdomain-manager';

/**
 * Enterprise Sticky Admin Session Service
 * Provides persistent admin sessions across browser restarts
 */

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret-change-in-production';
const ADMIN_JWT_REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET || 'dev-admin-refresh-secret-change-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 hour access tokens
const REFRESH_EXPIRES_IN = '7d'; // 7 day refresh tokens

export interface AdminSession {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface StickySessionResult {
  success: boolean;
  user?: AdminSession;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Generate secure admin access token
 */
function generateAdminAccessToken(user: AdminSession): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      sessionId: user.sessionId,
      type: 'access'
    },
    ADMIN_JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'brainliest-admin',
      audience: 'admin.brainliest.com'
    }
  );
}

/**
 * Generate secure admin refresh token
 */
function generateAdminRefreshToken(user: AdminSession): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      sessionId: user.sessionId,
      type: 'refresh'
    },
    ADMIN_JWT_REFRESH_SECRET,
    { 
      expiresIn: REFRESH_EXPIRES_IN,
      issuer: 'brainliest-admin',
      audience: 'admin.brainliest.com'
    }
  );
}

/**
 * Verify admin access token
 */
export function verifyAdminAccessToken(token: string): { valid: boolean; user?: AdminSession; expired?: boolean } {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET, {
      issuer: 'brainliest-admin',
      audience: 'admin.brainliest.com'
    }) as any;
    
    if (decoded.type !== 'access') {
      return { valid: false };
    }
    
    return {
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        sessionId: decoded.sessionId,
        issuedAt: decoded.iat,
        expiresAt: decoded.exp
      }
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

/**
 * Verify admin refresh token
 */
export function verifyAdminRefreshToken(token: string): { valid: boolean; user?: any; expired?: boolean } {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_REFRESH_SECRET, {
      issuer: 'brainliest-admin',
      audience: 'admin.brainliest.com'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      return { valid: false };
    }
    
    return {
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        sessionId: decoded.sessionId
      }
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

export class StickyAdminSessionService {
  /**
   * Create a new sticky admin session
   */
  async createSession(user: any): Promise<StickySessionResult> {
    try {
      // Generate unique session ID
      const sessionId = `admin_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const adminSession: AdminSession = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sessionId,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
      };
      
      const accessToken = generateAdminAccessToken(adminSession);
      const refreshToken = generateAdminRefreshToken(adminSession);
      
      return {
        success: true,
        user: adminSession,
        accessToken,
        refreshToken,
        message: 'Admin session created successfully'
      };
    } catch (error) {
      console.error('❌ Admin session creation error:', error);
      return {
        success: false,
        message: 'Failed to create admin session'
      };
    }
  }
  
  /**
   * Refresh admin session tokens
   */
  async refreshSession(refreshToken: string): Promise<StickySessionResult> {
    try {
      const refreshResult = verifyAdminRefreshToken(refreshToken);
      
      if (!refreshResult.valid) {
        return {
          success: false,
          message: refreshResult.expired ? 'Refresh token expired' : 'Invalid refresh token'
        };
      }
      
      // Get current user data
      const user = await storage.getUser(refreshResult.user!.id);
      if (!user || user.role !== 'admin') {
        return {
          success: false,
          message: 'Admin user not found or access revoked'
        };
      }
      
      // Create new session
      return await this.createSession(user);
    } catch (error) {
      console.error('❌ Admin session refresh error:', error);
      return {
        success: false,
        message: 'Failed to refresh admin session'
      };
    }
  }
  
  /**
   * Validate admin session
   */
  async validateSession(accessToken: string): Promise<{ valid: boolean; user?: AdminSession }> {
    try {
      const result = verifyAdminAccessToken(accessToken);
      
      if (!result.valid) {
        return { valid: false };
      }
      
      // Verify user still exists and is admin
      const user = await storage.getUser(result.user!.id);
      if (!user || user.role !== 'admin') {
        return { valid: false };
      }
      
      return {
        valid: true,
        user: result.user
      };
    } catch (error) {
      console.error('❌ Admin session validation error:', error);
      return { valid: false };
    }
  }
  
  /**
   * Destroy admin session
   */
  async destroySession(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      // In a production environment, you'd invalidate the session in Redis/database
      // For now, we rely on token expiration
      console.log(`🗑️ Admin session destroyed: ${sessionId}`);
      
      return {
        success: true,
        message: 'Admin session destroyed successfully'
      };
    } catch (error) {
      console.error('❌ Admin session destruction error:', error);
      return {
        success: false,
        message: 'Failed to destroy admin session'
      };
    }
  }
}

/**
 * Middleware to authenticate admin requests with sticky sessions
 */
export function authenticateAdminSession(req: Request, res: Response, next: NextFunction) {
  const context = getSubdomainContext(req);
  
  // Only allow admin authentication on admin subdomain
  if (!context.isAdmin && !req.path.includes('/presence')) {
    return res.status(403).json({ 
      error: 'Admin authentication only allowed on admin subdomain',
      redirect: process.env.NODE_ENV === 'development' 
        ? 'http://admin.localhost:5000' 
        : 'https://admin.brainliest.com'
    });
  }
  
  // Extract token from cookie or Authorization header
  const accessToken = req.cookies?.admin_access_token || 
    req.headers.authorization?.replace('Bearer ', '') || '';
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Admin access token required' });
  }
  
  const sessionService = new StickyAdminSessionService();
  
  sessionService.validateSession(accessToken)
    .then(result => {
      if (result.valid && result.user) {
        req.adminUser = result.user;
        next();
      } else {
        res.status(401).json({ error: 'Invalid or expired admin session' });
      }
    })
    .catch(error => {
      console.error('❌ Admin session authentication error:', error);
      res.status(500).json({ error: 'Authentication system error' });
    });
}

export const stickyAdminSessionService = new StickyAdminSessionService();

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminSession;
    }
  }
}