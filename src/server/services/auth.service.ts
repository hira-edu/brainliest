import { db } from "../db";
import { users, authSessions, authLogs } from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { AuthUser, AuthLoginResult, AuthToken } from "../types/auth";
import { generateSecureRandomString } from "../utils/crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const MAX_FAILED_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Helper functions
function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { 
      userId: user.id, 
      type: 'refresh' 
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function verifyToken(token: string): { valid: boolean; payload?: any; expired?: boolean } {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

// Auth logging function
async function logAuthEvent(
  userId: string | null,
  email: string,
  action: string,
  method: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  try {
    await db.insert(authLogs).values({
      userId: userId || null,
      email,
      action,
      method,
      success,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      errorMessage: errorMessage || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

export class AuthService {
  /**
   * Register a new user with email verification
   */
  async register(
    email: string,
    password: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthLoginResult> {
    try {
      // Check if user already exists with verified email
      const existingVerifiedUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.emailVerified, true)))
        .limit(1);

      if (existingVerifiedUser.length > 0) {
        await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, 'Email already registered');
        return {
          success: false,
          message: 'An account with this email already exists'
        };
      }

      // Check if there's an unverified user with same email
      const existingUnverifiedUser = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.emailVerified, false)))
        .limit(1);

      if (existingUnverifiedUser.length > 0) {
        // Delete the unverified user and their sessions
        await db.delete(users).where(eq(users.id, existingUnverifiedUser[0].id));
        console.log(`Deleted unverified user ${existingUnverifiedUser[0].id} for re-registration`);
      }

      // Generate auto username if not provided
      const finalUsername = username || email.split('@')[0] + Math.random().toString(36).substr(2, 4);

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate verification token
      const verificationToken = generateSecureRandomString(32);

      // Create user
      const [user] = await db.insert(users).values({
        email,
        username: finalUsername,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified || false,
      };

      // Generate tokens
      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      // Store session
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(authSessions).values({
        userId: user.id,
        token: accessToken,
        refreshToken,
        isActive: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: sessionExpiry,
      });

      await logAuthEvent(user.id, email, 'register_success', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        user: authUser,
        accessToken,
        refreshToken,
        verificationToken,
        message: 'Registration successful. Please verify your email.'
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, error.message);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthLoginResult> {
    try {
      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        await logAuthEvent(null, email, 'login_failed', 'email', false, ipAddress, userAgent, 'User not found');
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Account locked');
        return {
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
          accountLocked: true,
          lockoutExpires: user.accountLockedUntil
        };
      }

      // Verify password
      if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        // Increment failed attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = {
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: new Date(),
        };

        // Lock account if too many failed attempts
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          updateData.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_TIME);
        }

        await db.update(users).set(updateData).where(eq(users.id, user.id));

        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Invalid password');
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if email is verified
      if (!user.emailVerified) {
        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Email not verified');
        return {
          success: false,
          message: 'Please verify your email before logging in',
          requiresEmailVerification: true
        };
      }

      // Reset failed attempts on successful login
      await db.update(users).set({
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      }).where(eq(users.id, user.id));

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified || false,
      };

      // Generate tokens
      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      // Store session
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(authSessions).values({
        userId: user.id,
        token: accessToken,
        refreshToken,
        isActive: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: sessionExpiry,
      });

      await logAuthEvent(user.id, email, 'login_success', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        user: authUser,
        accessToken,
        refreshToken,
        message: 'Login successful'
      };

    } catch (error: any) {
      console.error('Login error:', error);
      await logAuthEvent(null, email, 'login_failed', 'email', false, ipAddress, userAgent, error.message);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Verify email with verification token
   */
  async verifyEmail(token: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by verification token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (!user) {
        return {
          success: false,
          message: 'Invalid verification token'
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          message: 'Email already verified'
        };
      }

      // Update user as verified
      await db.update(users).set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await logAuthEvent(user.id, user.email!, 'email_verified', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error: any) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed'
      };
    }
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    try {
      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        await logAuthEvent(null, email, 'password_reset_requested', 'email', false, ipAddress, userAgent, 'User not found');
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent'
        };
      }

      // Generate reset token
      const resetToken = generateSecureRandomString(32);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await db.update(users).set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await logAuthEvent(user.id, email, 'password_reset_requested', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Password reset link has been sent to your email',
        resetToken
      };

    } catch (error: any) {
      console.error('Password reset initiation error:', error);
      await logAuthEvent(null, email, 'password_reset_requested', 'email', false, ipAddress, userAgent, error.message);
      return {
        success: false,
        message: 'Failed to initiate password reset'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by reset token
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpiry, new Date())
        ))
        .limit(1);

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user with new password
      await db.update(users).set({
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      // Invalidate all existing sessions
      await db.update(authSessions).set({ isActive: false }).where(eq(authSessions.userId, user.id));

      await logAuthEvent(user.id, user.email!, 'password_reset', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Password reset successful'
      };

    } catch (error: any) {
      console.error('Password reset error:', error);
      await logAuthEvent(null, 'unknown', 'password_reset', 'email', false, ipAddress, userAgent, error.message);
      return {
        success: false,
        message: 'Password reset failed'
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthToken | null> {
    try {
      // Verify refresh token
      const { valid, payload } = verifyToken(refreshToken);
      if (!valid || payload.type !== 'refresh') {
        return null;
      }

      // Find active session
      const [session] = await db
        .select()
        .from(authSessions)
        .where(and(
          eq(authSessions.userId, payload.userId),
          eq(authSessions.refreshToken, refreshToken),
          eq(authSessions.isActive, true),
          gt(authSessions.expiresAt, new Date())
        ))
        .limit(1);

      if (!session) {
        return null;
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user || !user.emailVerified) {
        return null;
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified || false,
      };

      // Generate new access token
      const newAccessToken = generateAccessToken(authUser);

      // Update session with new access token
      await db.update(authSessions).set({
        token: newAccessToken,
        updatedAt: new Date(),
      }).where(eq(authSessions.id, session.id));

      await logAuthEvent(user.id, user.email!, 'token_refreshed', 'jwt', true, ipAddress, userAgent);

      return {
        accessToken: newAccessToken,
        refreshToken: session.refreshToken,
        expiresIn: JWT_EXPIRES_IN
      };

    } catch (error: any) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(token: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Invalidate session
      await db.update(authSessions).set({ isActive: false }).where(eq(authSessions.token, token));

      // We can't easily get user info from token at this point, so log with minimal info
      await logAuthEvent(null, 'unknown', 'logout', 'jwt', true, ipAddress, userAgent);

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Verify session token
   */
  async verifySession(token: string): Promise<AuthUser | null> {
    try {
      // Verify JWT token
      const { valid, payload, expired } = verifyToken(token);
      if (!valid) {
        return null;
      }

      // Find active session
      const [session] = await db
        .select()
        .from(authSessions)
        .where(and(
          eq(authSessions.token, token),
          eq(authSessions.isActive, true),
          gt(authSessions.expiresAt, new Date())
        ))
        .limit(1);

      if (!session) {
        return null;
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user || !user.emailVerified) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified || false,
      };

    } catch (error: any) {
      console.error('Session verification error:', error);
      return null;
    }
  }

  /**
   * Google OAuth login/register
   */
  async googleAuth(
    googleId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthLoginResult> {
    try {
      // Check if user exists with this Google ID
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);

      if (!user) {
        // Check if user exists with this email
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user) {
          // Link Google account to existing user
          await db.update(users).set({
            googleId,
            oauthProvider: 'google',
            emailVerified: true, // Google emails are pre-verified
            updatedAt: new Date(),
          }).where(eq(users.id, user.id));
        } else {
          // Create new user
          const username = email.split('@')[0] + Math.random().toString(36).substr(2, 4);
          
          [user] = await db.insert(users).values({
            email,
            username,
            firstName: firstName || null,
            lastName: lastName || null,
            googleId,
            oauthProvider: 'google',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
        }
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true,
      };

      // Generate tokens
      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      // Store session
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(authSessions).values({
        userId: user.id,
        token: accessToken,
        refreshToken,
        isActive: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: sessionExpiry,
      });

      await logAuthEvent(user.id, email, 'login_success', 'google', true, ipAddress, userAgent);

      return {
        success: true,
        user: authUser,
        accessToken,
        refreshToken,
        message: 'Google authentication successful'
      };

    } catch (error: any) {
      console.error('Google auth error:', error);
      await logAuthEvent(null, email, 'login_failed', 'google', false, ipAddress, userAgent, error.message);
      return {
        success: false,
        message: 'Google authentication failed'
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        username: user.username!,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified || false,
      };

    } catch (error: any) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Get auth logs for a user
   */
  async getAuthLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(authLogs)
        .where(eq(authLogs.userId, userId))
        .orderBy(desc(authLogs.timestamp))
        .limit(limit);

      return logs;
    } catch (error: any) {
      console.error('Get auth logs error:', error);
      return [];
    }
  }
}

export const authService = new AuthService();