import type { PaginatedResult } from '../types';

export interface AdminUserRecord {
  readonly id: string;
  readonly email: string;
  readonly role: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN';
  readonly status: string;
  readonly lastLoginAt: Date | null;
  readonly totpEnabledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminUserAuthRecord extends AdminUserRecord {
  readonly passwordHash: string;
  readonly totpSecret: string | null;
  readonly totpLastUsedAt: Date | null;
}

export interface AdminRecoveryCodeRecord {
  readonly id: string;
  readonly codeHash: string;
  readonly usedAt: Date | null;
  readonly createdAt: Date;
}

export interface RememberDeviceRecord {
  readonly id: string;
  readonly adminId: string;
  readonly tokenHash: string;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly lastUsedAt: Date | null;
}

export interface AdminUserFilter {
  readonly role?: AdminUserRecord['role'];
  readonly status?: string;
  readonly search?: string;
}

export interface AdminUserRepository {
  list(filters: AdminUserFilter, page: number, pageSize: number): Promise<PaginatedResult<AdminUserRecord>>;
  findByEmail(email: string): Promise<AdminUserAuthRecord | null>;
  findById(id: string): Promise<AdminUserAuthRecord | null>;
  updateLastLogin(id: string, lastLoginAt?: Date): Promise<void>;
  enableTotp(adminId: string, encryptedSecret: string, enabledAt: Date): Promise<void>;
  updateTotpUsage(adminId: string, usedAt: Date): Promise<void>;
  disableTotp(adminId: string): Promise<void>;
  replaceRecoveryCodes(adminId: string, codes: readonly { id: string; codeHash: string }[]): Promise<void>;
  listRecoveryCodes(adminId: string): Promise<AdminRecoveryCodeRecord[]>;
  markRecoveryCodeUsed(adminId: string, codeHash: string, usedAt: Date): Promise<boolean>;
  createRememberDevice(input: {
    adminId: string;
    deviceId: string;
    tokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
  }): Promise<void>;
  findRememberDevice(deviceId: string): Promise<RememberDeviceRecord | null>;
  touchRememberDevice(deviceId: string, usedAt: Date): Promise<void>;
  deleteRememberDevice(deviceId: string): Promise<void>;
  deleteRememberDevicesForAdmin(adminId: string): Promise<void>;
  listRememberDevices(adminId: string): Promise<RememberDeviceRecord[]>;
}
