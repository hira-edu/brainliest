/**
 * Admin Audit Trail System
 * Comprehensive logging for all admin operations
 */

import { db } from "../supabase-db";
import { auditLogs } from "@shared/schema";

export interface AdminAuditEvent {
  adminId: number;
  adminEmail: string;
  action: string;
  resourceType?: string;
  resourceId?: number;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log admin action with comprehensive details
 */
export async function logAdminAudit(event: AdminAuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      adminId: event.adminId,
      adminEmail: event.adminEmail,
      action: event.action,
      resourceType: event.resourceType || null,
      resourceId: event.resourceId || null,
      changes: event.changes || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      success: event.success,
      errorMessage: event.errorMessage || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log admin audit event:", error);
    // Don't throw - audit logging failure shouldn't break admin operations
  }
}

/**
 * Create audit trail decorator for admin functions
 */
export function auditAdminAction(action: string, resourceType?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const adminUser = args[0]?.adminUser || args[0]?.user;
      const ipAddress = args[0]?.ipAddress;
      const userAgent = args[0]?.userAgent;

      try {
        const result = await originalMethod.apply(this, args);

        // Log successful action
        await logAdminAudit({
          adminId: adminUser?.id || 0,
          adminEmail: adminUser?.email || "unknown",
          action,
          resourceType,
          resourceId: result?.id,
          changes: JSON.stringify(args[1] || {}),
          ipAddress,
          userAgent,
          success: true,
        });

        return result;
      } catch (error) {
        // Log failed action
        await logAdminAudit({
          adminId: adminUser?.id || 0,
          adminEmail: adminUser?.email || "unknown",
          action,
          resourceType,
          ipAddress,
          userAgent,
          success: false,
          errorMessage: error.message,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Get admin audit logs with filtering
 */
export async function getAdminAuditLogs(
  options: {
    adminId?: number;
    action?: string;
    resourceType?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  try {
    const query = db.select().from(auditLogs);

    // Apply filters (would need proper query building in real implementation)
    // For now, return all logs with limit
    const logs = await query
      .limit(options.limit || 100)
      .offset(options.offset || 0);

    return logs;
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    return [];
  }
}
