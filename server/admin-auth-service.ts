import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { users, authLogs } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Secure JWT secret generation for admin authentication
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET environment variable is required in production');
  }
  // Generate cryptographically secure secret for development
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  Using auto-generated JWT secret for development. Set ADMIN_JWT_SECRET for production.');
  return devSecret;
})();

const ADMIN_JWT_EXPIRY = '8h'; // Longer sessions for admin users
const MAX_ADMIN_LOGIN_ATTEMPTS = 3;
const ADMIN_LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

export interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
}

export interface AdminLoginResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  message?: string;
  accountLocked?: boolean;
  lockoutExpires?: Date;
}

// Secure admin email configuration from environment
const AUTHORIZED_ADMIN_EMAILS = (() => {
  const envEmails = process.env.AUTHORIZED_ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(email => email.trim()).filter(Boolean);
  }
  
  // Development fallback with warning
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Using default admin emails for development. Set AUTHORIZED_ADMIN_EMAILS for production.');
    return [
      'admin@brainliest.com',
      'super.admin@brainliest.com',
      'platform.admin@brainliest.com'
    ];
  }
  
  throw new Error('AUTHORIZED_ADMIN_EMAILS environment variable is required in production');
})();

// Generate admin JWT token
function generateAdminToken(user: AdminUser): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      isAdmin: true,
      type: 'admin'
    },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRY }
  );
}

// Verify admin JWT token
export function verifyAdminToken(token: string): { valid: boolean; user?: AdminUser; expired?: boolean } {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;
    
    // Ensure this is an admin token
    if (!decoded.isAdmin || decoded.type !== 'admin') {
      return { valid: false };
    }
    
    const user: AdminUser = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      emailVerified: true
    };
    
    return { valid: true, user };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

// Log admin authentication events
async function logAdminAuthEvent(
  email: string,
  action: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  details?: string
) {
  try {
    await db.insert(authLogs).values({
      email,
      action: `ADMIN_${action}`,
      method: 'email_password',
      success,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date(),
      details: details || null
    });
  } catch (error) {
    console.error('Failed to log admin auth event:', error);
  }
}

export class AdminAuthService {
  
  /**
   * Admin login - only for authorized admin emails
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminLoginResult> {
    try {
      // Check if email is in authorized admin list
      if (!AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase())) {
        await logAdminAuthEvent(email, 'LOGIN_ATTEMPT', false, ipAddress, userAgent, 'Unauthorized email');
        return {
          success: false,
          message: "Access denied. This email is not authorized for admin access."
        };
      }

      // Find user in database
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, email.toLowerCase()),
          eq(users.role, 'admin')
        ));

      if (!user) {
        await logAdminAuthEvent(email, 'LOGIN_ATTEMPT', false, ipAddress, userAgent, 'Admin user not found');
        return {
          success: false,
          message: "Admin account not found. Please contact system administrator."
        };
      }

      // Check if account is locked
      if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
        await logAdminAuthEvent(email, 'LOGIN_ATTEMPT', false, ipAddress, userAgent, 'Account locked');
        return {
          success: false,
          accountLocked: true,
          lockoutExpires: user.accountLockedUntil,
          message: `Account is locked until ${user.accountLockedUntil.toLocaleString()}`
        };
      }

      // Verify password
      if (!user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
        // Increment failed attempts
        const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
        const shouldLock = newFailedAttempts >= MAX_ADMIN_LOGIN_ATTEMPTS;
        
        await db
          .update(users)
          .set({
            failedLoginAttempts: newFailedAttempts,
            accountLockedUntil: shouldLock ? new Date(Date.now() + ADMIN_LOCKOUT_TIME) : null,
            lastLoginAt: new Date()
          })
          .where(eq(users.id, user.id));

        await logAdminAuthEvent(email, 'LOGIN_ATTEMPT', false, ipAddress, userAgent, 'Invalid password');
        
        if (shouldLock) {
          return {
            success: false,
            accountLocked: true,
            lockoutExpires: new Date(Date.now() + ADMIN_LOCKOUT_TIME),
            message: "Too many failed attempts. Account locked for 30 minutes."
          };
        }
        
        return {
          success: false,
          message: `Invalid password. ${MAX_ADMIN_LOGIN_ATTEMPTS - newFailedAttempts} attempts remaining.`
        };
      }

      // Check if email is verified (required for admin access)
      if (!user.emailVerified) {
        await logAdminAuthEvent(email, 'LOGIN_ATTEMPT', false, ipAddress, userAgent, 'Email not verified');
        return {
          success: false,
          message: "Email verification required for admin access. Please contact system administrator."
        };
      }

      // Successful login - reset failed attempts
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress || null
        })
        .where(eq(users.id, user.id));

      const adminUser: AdminUser = {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role || 'admin',
        emailVerified: user.emailVerified || false
      };

      const token = generateAdminToken(adminUser);

      await logAdminAuthEvent(email, 'LOGIN_SUCCESS', true, ipAddress, userAgent, 'Successful admin login');

      return {
        success: true,
        user: adminUser,
        token,
        message: "Admin login successful"
      };

    } catch (error) {
      console.error('Admin login error:', error);
      await logAdminAuthEvent(email, 'LOGIN_ERROR', false, ipAddress, userAgent, 'System error during login');
      return {
        success: false,
        message: "System error during login. Please try again."
      };
    }
  }

  /**
   * Verify admin token and return user if valid
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: AdminUser; expired?: boolean }> {
    const result = verifyAdminToken(token);
    
    if (result.valid && result.user) {
      // Additional database verification to ensure user still exists and is admin
      try {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(and(
            eq(users.id, result.user.id),
            eq(users.role, 'admin')
          ));

        if (!dbUser || !dbUser.emailVerified) {
          return { valid: false };
        }

        return { valid: true, user: result.user };
      } catch (error) {
        console.error('Admin token verification error:', error);
        return { valid: false };
      }
    }
    
    return result;
  }

  /**
   * Admin logout
   */
  async logout(token: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      const verification = verifyAdminToken(token);
      
      if (verification.valid && verification.user) {
        await logAdminAuthEvent(
          verification.user.email, 
          'LOGOUT', 
          true, 
          ipAddress, 
          userAgent, 
          'Admin logout'
        );
      }

      return {
        success: true,
        message: "Admin logout successful"
      };
    } catch (error) {
      console.error('Admin logout error:', error);
      return {
        success: false,
        message: "Logout error"
      };
    }
  }

  /**
   * Get list of authorized admin emails (for reference only)
   */
  getAuthorizedEmails(): string[] {
    return [...AUTHORIZED_ADMIN_EMAILS];
  }
}

export const adminAuthService = new AdminAuthService();