import type { PaginatedResult } from '../types';

export interface AdminUserRecord {
  readonly id: string;
  readonly email: string;
  readonly role: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN';
  readonly status: string;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminUserFilter {
  readonly role?: AdminUserRecord['role'];
  readonly status?: string;
  readonly search?: string;
}

export interface AdminUserRepository {
  list(filters: AdminUserFilter, page: number, pageSize: number): Promise<PaginatedResult<AdminUserRecord>>;
}
