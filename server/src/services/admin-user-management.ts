import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, auditLogs, authLogs } from '../../../shared/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import crypto from 'crypto';

// Admin User Management Service
export class AdminUserManagementService {
  
  /**
   * Create a new user (admin function only)
   * Admins can create users, moderators, or other admins
   */
  async createUser(userData: {
    email: string;
    role: 'admin' | 'moderator' | 'user';
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }, adminId: number, adminEmail: string, ipAddress?: string, userAgent?: string) {
    
    // Validate role
    if (!['admin', 'moderator', 'user'].includes(userData.role)) {
      throw new Error('Invalid role specified');
    }
    
    // Validate email
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Invalid email address');
    }
    
    // Validate password strength
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.valid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }
    
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password securely
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      // Generate username if not provided
      const username = userData.username || this.generateUsernameFromEmail(userData.email);
      
      // Create user in database
      const [newUser] = await db.insert(users).values({
        email: userData.email,
        username: username,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role,
        passwordHash: passwordHash,
        emailVerified: true, // Admin-created users are pre-verified
        isActive: true,
        registrationIp: ipAddress || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Log admin action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'CREATE_USER',
        resourceType: 'user',
        resourceId: newUser.id,
        changes: JSON.stringify({
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
        ipAddress,
        userAgent,
      });
      
      // Log authentication event
      await db.insert(authLogs).values({
        userId: newUser.id,
        action: 'admin_created',
        success: true,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        timestamp: new Date(),
        method: 'admin_creation',
      });
      
      // Return user without sensitive data
      const { passwordHash: _, ...userResponse } = newUser;
      return userResponse;
      
    } catch (error) {
      // Log failed action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'CREATE_USER',
        resourceType: 'user',
        resourceId: null,
        changes: JSON.stringify({ email: userData.email, error: error.message }),
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Update user (admin function only)
   * Can change role, reset password, update profile
   */
  async updateUser(
    userId: number,
    updateData: {
      email?: string;
      role?: 'admin' | 'moderator' | 'user';
      password?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      isBanned?: boolean;
      banReason?: string;
    },
    adminId: number,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    
    try {
      // Get existing user
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      const updates: any = { updatedAt: new Date() };
      const changes: any = {};
      
      // Update email if provided
      if (updateData.email && updateData.email !== existingUser.email) {
        if (!this.isValidEmail(updateData.email)) {
          throw new Error('Invalid email address');
        }
        updates.email = updateData.email;
        changes.email = { from: existingUser.email, to: updateData.email };
      }
      
      // Update role if provided
      if (updateData.role && updateData.role !== existingUser.role) {
        if (!['admin', 'moderator', 'user'].includes(updateData.role)) {
          throw new Error('Invalid role specified');
        }
        updates.role = updateData.role;
        changes.role = { from: existingUser.role, to: updateData.role };
      }
      
      // Update password if provided (never log actual password)
      if (updateData.password) {
        const passwordValidation = this.validatePassword(updateData.password);
        if (!passwordValidation.valid) {
          throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
        }
        updates.passwordHash = await bcrypt.hash(updateData.password, 12);
        updates.failedLoginAttempts = 0; // Reset failed attempts
        updates.lockedUntil = null; // Unlock account
        changes.password = 'reset_by_admin';
      }
      
      // Update profile fields
      if (updateData.firstName !== undefined) {
        updates.firstName = updateData.firstName;
        changes.firstName = { from: existingUser.firstName, to: updateData.firstName };
      }
      
      if (updateData.lastName !== undefined) {
        updates.lastName = updateData.lastName;
        changes.lastName = { from: existingUser.lastName, to: updateData.lastName };
      }
      
      // Update status fields
      if (updateData.isActive !== undefined) {
        updates.isActive = updateData.isActive;
        changes.isActive = { from: existingUser.isActive, to: updateData.isActive };
      }
      
      if (updateData.isBanned !== undefined) {
        updates.isBanned = updateData.isBanned;
        changes.isBanned = { from: existingUser.isBanned, to: updateData.isBanned };
      }
      
      if (updateData.banReason !== undefined) {
        updates.banReason = updateData.banReason;
        changes.banReason = { from: existingUser.banReason, to: updateData.banReason };
      }
      
      // Update user in database
      const [updatedUser] = await db.update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      
      // Log admin action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'UPDATE_USER',
        resourceType: 'user',
        resourceId: userId,
        changes: JSON.stringify(changes),
        ipAddress,
        userAgent,
      });
      
      // Return user without sensitive data
      const { passwordHash: _, ...userResponse } = updatedUser;
      return userResponse;
      
    } catch (error) {
      // Log failed action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'UPDATE_USER',
        resourceType: 'user',
        resourceId: userId,
        changes: JSON.stringify({ error: error.message }),
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Delete user (admin function only)
   */
  async deleteUser(
    userId: number,
    adminId: number,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Get user before deletion for logging
      const [userToDelete] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Prevent admin from deleting themselves
      if (userId === adminId) {
        throw new Error('Cannot delete your own admin account');
      }
      
      // Delete user (CASCADE will handle related records)
      await db.delete(users).where(eq(users.id, userId));
      
      // Log admin action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'DELETE_USER',
        resourceType: 'user',
        resourceId: userId,
        changes: JSON.stringify({
          deletedUser: {
            email: userToDelete.email,
            role: userToDelete.role,
            username: userToDelete.username,
          }
        }),
        ipAddress,
        userAgent,
      });
      
      return { success: true, message: 'User deleted successfully' };
      
    } catch (error) {
      // Log failed action
      await this.logAdminAction({
        adminId,
        adminEmail,
        action: 'DELETE_USER',
        resourceType: 'user',
        resourceId: userId,
        changes: JSON.stringify({ error: error.message }),
        ipAddress,
        userAgent,
        success: false,
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Get admin audit logs
   */
  async getAdminAuditLogs(limit: number = 50, offset: number = 0) {
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(auditLogs.timestamp)
      .limit(limit)
      .offset(offset);
    
    return logs;
  }
  
  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private validatePassword(password: string): { valid: boolean; errors: string[] } {
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
  
  private generateUsernameFromEmail(email: string): string {
    const baseUsername = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomSuffix}`;
  }
  
  private async logAdminAction(actionData: {
    adminId: number;
    adminEmail: string;
    action: string;
    resourceType: string;
    resourceId: number | null;
    changes: string;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }) {
    try {
      await db.insert(auditLogs).values({
        adminId: actionData.adminId,
        adminEmail: actionData.adminEmail,
        action: actionData.action,
        resourceType: actionData.resourceType,
        resourceId: actionData.resourceId,
        changes: actionData.changes,
        ipAddress: actionData.ipAddress || null,
        userAgent: actionData.userAgent || null,
        success: actionData.success ?? true,
        errorMessage: actionData.errorMessage || null,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }
}

export const adminUserService = new AdminUserManagementService();