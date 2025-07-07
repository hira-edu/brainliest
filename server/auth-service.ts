import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { users, authLogs, authSessions } from '@shared/schema';
import { eq, and, or, lt, gt } from 'drizzle-orm';
import { emailService } from './email-service';

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev-jwt-secret-key-not-for-production';
})();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
  }
  return 'dev-jwt-refresh-secret-key-not-for-production';
})();
const JWT_EXPIRY = '15m'; // Short-lived access tokens
const JWT_REFRESH_EXPIRY = '7d'; // Longer-lived refresh tokens
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour

export interface AuthUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role: string;
  emailVerified: boolean;
  oauthProvider?: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  requiresEmailVerification?: boolean;
  accountLocked?: boolean;
  lockoutExpires?: Date;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  message?: string;
  requiresEmailVerification?: boolean;
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate secure tokens
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// JWT token generation
function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      emailVerified: user.emailVerified 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

// Audit logging
async function logAuthEvent(
  userId: number | null,
  email: string,
  action: string,
  method: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  failureReason?: string,
  metadata?: any
) {
  try {
    await db.insert(authLogs).values({
      userId,
      email,
      action,
      method,
      success,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      failureReason: failureReason || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

export class AuthService {
  // Register with email/password
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RegisterResult> {
    try {
      // Validate email
      if (!validateEmail(email)) {
        await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, 'Invalid email format');
        return { success: false, message: 'Invalid email address' };
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, 'Weak password');
        return { success: false, message: passwordValidation.errors.join('. ') };
      }

      // Check if user already exists and is verified
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0 && existingUser[0].emailVerified) {
        await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, 'Email already exists and verified');
        return { success: false, message: 'Email address is already registered and verified' };
      }
      
      // If user exists but not verified, delete the old unverified account
      if (existingUser.length > 0 && !existingUser[0].emailVerified) {
        // Delete user (auth_logs will be auto-deleted via CASCADE)
        await db.delete(users).where(eq(users.email, email));
        await logAuthEvent(null, email, 'unverified_account_replaced', 'email', true, ipAddress, userAgent);
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Generate username from email if not provided
      const generatedUsername = email.split('@')[0] + Math.random().toString(36).substr(2, 4);
      
      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        username: generatedUsername,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        emailVerificationToken,
        emailVerificationExpires,
        emailVerified: false,
        registrationIp: ipAddress || null,
      }).returning();

      // Send verification email
      try {
        await emailService.sendEmailVerification(email, emailVerificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue registration even if email fails
      }

      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username || undefined,
        firstName: newUser.firstName || undefined,
        lastName: newUser.lastName || undefined,
        profileImage: newUser.profileImage || undefined,
        role: newUser.role || 'user',
        emailVerified: newUser.emailVerified || false,
      };

      await logAuthEvent(newUser.id, email, 'register_success', 'email', true, ipAddress, userAgent);

      return {
        success: true,
        user: authUser,
        requiresEmailVerification: true,
        message: 'Registration successful. Please check your email to verify your account.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      await logAuthEvent(null, email, 'register_failed', 'email', false, ipAddress, userAgent, 'Internal error');
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login with email/password
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    try {
      // Validate email
      if (!validateEmail(email)) {
        await logAuthEvent(null, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Invalid email format');
        return { success: false, message: 'Invalid email or password' };
      }

      // Get user
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !user.passwordHash) {
        await logAuthEvent(null, email, 'login_failed', 'email', false, ipAddress, userAgent, 'User not found or no password set');
        return { success: false, message: 'Invalid email or password' };
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Account locked');
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts',
          accountLocked: true,
          lockoutExpires: user.lockedUntil
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Increment failed attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = { failedLoginAttempts: failedAttempts };
        
        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
          updateData.lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
        }

        await db.update(users).set(updateData).where(eq(users.id, user.id));
        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Invalid password');
        
        return { 
          success: false, 
          message: failedAttempts >= MAX_LOGIN_ATTEMPTS 
            ? 'Account locked due to too many failed attempts. Try again in 15 minutes.'
            : 'Invalid email or password'
        };
      }

      // Check if email is verified
      if (!user.emailVerified) {
        await logAuthEvent(user.id, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Email not verified');
        return {
          success: false,
          message: 'Please verify your email address before logging in',
          requiresEmailVerification: true
        };
      }

      // Reset failed attempts on successful login
      await db.update(users).set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
        loginCount: (user.loginCount || 0) + 1
      }).where(eq(users.id, user.id));

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImage: user.profileImage || undefined,
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
      };

      // Generate tokens
      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      // Store session
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(authSessions).values({
        userId: user.id,
        sessionToken: accessToken,
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

    } catch (error) {
      console.error('Login error:', error);
      await logAuthEvent(null, email, 'login_failed', 'email', false, ipAddress, userAgent, 'Internal error');
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // OAuth login/register
  async oauthLogin(
    provider: string,
    oauthId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    profileImage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    try {
      // Check if user exists with OAuth ID
      let [user] = await db.select().from(users).where(eq(users.googleId, oauthId)).limit(1);
      
      if (!user) {
        // Check if user exists with same email
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (existingUser) {
          // Link OAuth account to existing user
          await db.update(users).set({
            googleId: provider === 'google' ? oauthId : null,
            oauthProvider: provider,
            emailVerified: true, // OAuth emails are pre-verified
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress || null,
            loginCount: (existingUser.loginCount || 0) + 1
          }).where(eq(users.id, existingUser.id));
          
          user = { ...existingUser, googleId: oauthId, emailVerified: true };
        } else {
          // Create new user with OAuth
          const [newUser] = await db.insert(users).values({
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            profileImage: profileImage || null,
            googleId: provider === 'google' ? oauthId : null,
            oauthProvider: provider,
            emailVerified: true, // OAuth emails are pre-verified
            registrationIp: ipAddress || null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress || null,
            loginCount: 1
          }).returning();
          
          user = newUser;
          await logAuthEvent(user.id, email, 'register_success', provider, true, ipAddress, userAgent);
        }
      } else {
        // Update existing OAuth user
        await db.update(users).set({
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress || null,
          loginCount: (user.loginCount || 0) + 1,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          profileImage: profileImage || user.profileImage,
        }).where(eq(users.id, user.id));
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImage: user.profileImage || undefined,
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        oauthProvider: user.oauthProvider || undefined,
      };

      // Generate tokens
      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      // Store session
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(authSessions).values({
        userId: user.id,
        sessionToken: accessToken,
        refreshToken,
        isActive: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: sessionExpiry,
      });

      await logAuthEvent(user.id, email, 'login_success', provider, true, ipAddress, userAgent);

      return {
        success: true,
        user: authUser,
        accessToken,
        refreshToken,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('OAuth login error:', error);
      await logAuthEvent(null, email, 'login_failed', provider, false, ipAddress, userAgent, 'Internal error');
      return { success: false, message: 'OAuth login failed. Please try again.' };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const [user] = await db.select().from(users).where(
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationExpires, new Date())
        )
      ).limit(1);

      if (!user) {
        return { success: false, message: 'Invalid or expired verification token' };
      }

      await db.update(users).set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }).where(eq(users.id, user.id));

      await logAuthEvent(user.id, user.email, 'email_verified', 'email', true);

      return { success: true, message: 'Email verified successfully' };

    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, message: 'Email verification failed' };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (!user) {
        // Don't reveal that user doesn't exist
        await logAuthEvent(null, email, 'password_reset_requested', 'email', false, ipAddress, userAgent, 'User not found');
        return { success: true, message: 'If an account with that email exists, you will receive a password reset link.' };
      }

      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

      await db.update(users).set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }).where(eq(users.id, user.id));

      try {
        await emailService.sendPasswordReset(email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return { success: false, message: 'Failed to send password reset email. Please try again.' };
      }

      await logAuthEvent(user.id, email, 'password_reset_requested', 'email', true, ipAddress, userAgent);

      return { success: true, message: 'If an account with that email exists, you will receive a password reset link.' };

    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Password reset request failed. Please try again.' };
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.errors.join('. ') };
      }

      const [user] = await db.select().from(users).where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      ).limit(1);

      if (!user) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await db.update(users).set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock account
      }).where(eq(users.id, user.id));

      // Invalidate all existing sessions
      await db.update(authSessions).set({ isActive: false }).where(eq(authSessions.userId, user.id));

      await logAuthEvent(user.id, user.email, 'password_reset_success', 'email', true);

      return { success: true, message: 'Password reset successfully. Please log in with your new password.' };

    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Password reset failed. Please try again.' };
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<{ valid: boolean; user?: AuthUser; expired?: boolean }> {
    try {
      // Token verification attempt logged for security audit
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('✅ Token decoded successfully:', { userId: decoded.userId });
      
      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      console.log('🔍 Database user lookup result:', user ? `Found user ${user.id}` : 'No user found');
      
      if (!user) {
        console.log('❌ User not found in database for userId:', decoded.userId);
        return { valid: false };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImage: user.profileImage || undefined,
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        oauthProvider: user.oauthProvider || undefined,
      };

      return { valid: true, user: authUser };

    } catch (error: any) {
      console.log('❌ Token verification error:', error.message, error.name);
      if (error.name === 'TokenExpiredError') {
        return { valid: false, expired: true };
      }
      return { valid: false };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; message?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      
      // Check if session exists and is active
      const [session] = await db.select().from(authSessions).where(
        and(
          eq(authSessions.refreshToken, refreshToken),
          eq(authSessions.isActive, true),
          gt(authSessions.expiresAt, new Date())
        )
      ).limit(1);

      if (!session) {
        return { success: false, message: 'Invalid refresh token' };
      }

      const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImage: user.profileImage || undefined,
        role: user.role || 'user',
        emailVerified: user.emailVerified || false,
        oauthProvider: user.oauthProvider || undefined,
      };

      // Generate new tokens
      const newAccessToken = generateAccessToken(authUser);
      const newRefreshToken = generateRefreshToken(authUser);

      // Update session
      await db.update(authSessions).set({
        sessionToken: newAccessToken,
        refreshToken: newRefreshToken,
        lastUsedAt: new Date(),
      }).where(eq(authSessions.id, session.id));

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  // Logout
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Invalidate session
      await db.update(authSessions).set({ isActive: false }).where(eq(authSessions.sessionToken, token));
      
      return { success: true, message: 'Logged out successfully' };

    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }

  // Logout from all devices
  async logoutAll(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      await db.update(authSessions).set({ isActive: false }).where(eq(authSessions.userId, userId));
      
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        await logAuthEvent(user.id, user.email, 'logout_all', 'manual', true);
      }
      
      return { success: true, message: 'Logged out from all devices successfully' };

    } catch (error) {
      console.error('Logout all error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }
}

export const authService = new AuthService();