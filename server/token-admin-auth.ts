/**
 * Token-Only Admin Authentication Service
 * 
 * Cookie-free admin authentication system that uses only Authorization headers
 * with JWT tokens, completely separate from the industrial cookie system for regular users.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Environment validation
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('🚨 CRITICAL: ADMIN_JWT_SECRET environment variable is required in production');
  }
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  Development Mode: Auto-generated JWT secret. Set ADMIN_JWT_SECRET for production.');
  return devSecret;
})();

// Authorized admin emails from environment or development defaults
const AUTHORIZED_ADMIN_EMAILS = process.env.AUTHORIZED_ADMIN_EMAILS 
  ? process.env.AUTHORIZED_ADMIN_EMAILS.split(',').map(email => email.trim())
  : ['admin@brainliest.com', 'super.admin@brainliest.com', 'platform.admin@brainliest.com'];

export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
}

export interface TokenLoginResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  message?: string;
}

/**
 * Cookie-Free Admin Authentication Service
 */
export class TokenAdminAuthService {
  /**
   * Admin login without any cookie dependencies
   */
  async login(email: string, password: string): Promise<TokenLoginResult> {
    try {
      // Validate admin email authorization
      if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        console.log(`❌ Unauthorized admin login attempt: ${email}`);
        return {
          success: false,
          message: "Access denied. Contact system administrator for admin access."
        };
      }

      // Use database authentication
      const authService = await import('./auth-service');
      const loginResult = await authService.authService.login(email, password, undefined);

      if (!loginResult.success || !loginResult.user) {
        console.log(`❌ Invalid admin credentials: ${email}`);
        return {
          success: false,
          message: "Invalid admin credentials"
        };
      }

      // Verify user has admin role
      if (loginResult.user.role !== 'admin' && loginResult.user.role !== 'super_admin') {
        console.log(`❌ Non-admin user attempted admin login: ${email}`);
        return {
          success: false,
          message: "Access denied. Admin privileges required."
        };
      }

      const adminUser: AdminUser = {
        id: loginResult.user.id,
        email: loginResult.user.email,
        username: loginResult.user.username || 'admin',
        firstName: loginResult.user.firstName || 'Admin',
        lastName: loginResult.user.lastName || 'User',
        role: loginResult.user.role,
        emailVerified: loginResult.user.emailVerified
      };

      // Generate JWT token
      const token = this.generateToken(adminUser);

      console.log('✅ Admin login successful:', email);
      return {
        success: true,
        user: adminUser,
        token,
        message: "Admin authentication successful"
      };

      console.log(`❌ Invalid admin credentials: ${email}`);
      return {
        success: false,
        message: "Invalid admin credentials"
      };

    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: "Admin authentication system error"
      };
    }
  }

  /**
   * Verify JWT token and return admin user
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: AdminUser; expired?: boolean }> {
    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
      
      // Validate token structure
      if (!decoded || !decoded.user || !decoded.user.email) {
        return { valid: false };
      }

      // Verify admin authorization
      if (!AUTHORIZED_ADMIN_EMAILS.includes(decoded.user.email)) {
        return { valid: false };
      }

      return {
        valid: true,
        user: decoded.user
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, expired: true };
      }
      return { valid: false };
    }
  }

  /**
   * Admin logout (token-based, no cookies)
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    // Since we're token-only, logout is handled client-side by discarding the token
    return {
      success: true,
      message: "Admin logout successful"
    };
  }

  /**
   * Generate JWT token for admin user
   */
  private generateToken(user: AdminUser): string {
    return jwt.sign(
      { 
        user,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      ADMIN_JWT_SECRET,
      { expiresIn: '8h' }
    );
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Middleware for token-only admin authentication
   */
  createAuthMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractTokenFromRequest(req);
        
        if (!token) {
          return res.status(401).json({
            success: false,
            message: "Admin token required",
            code: "ADMIN_TOKEN_REQUIRED"
          });
        }

        const verification = await this.verifyToken(token);
        console.log('🔐 Token verification result:', JSON.stringify(verification, null, 2));
        
        if (!verification.valid) {
          const message = verification.expired ? "Admin session expired" : "Invalid admin token";
          return res.status(401).json({
            success: false,
            message,
            code: verification.expired ? "ADMIN_TOKEN_EXPIRED" : "ADMIN_TOKEN_INVALID"
          });
        }

        console.log('✅ Admin user attached:', verification.user);
        // Attach admin user to request
        (req as any).adminUser = verification.user;
        
        next();
      } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(500).json({
          success: false,
          message: "Authentication system error",
          code: "ADMIN_AUTH_ERROR"
        });
      }
    };
  }

  /**
   * Get list of authorized admin emails
   */
  getAuthorizedEmails(): string[] {
    return AUTHORIZED_ADMIN_EMAILS;
  }
}

export const tokenAdminAuth = new TokenAdminAuthService();