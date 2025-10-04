import type { PaginatedResult } from '../types';

export type AuditActorType = 'admin' | 'user' | 'system';

export interface AuditLogRecord {
  readonly id: string;
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly actorEmail: string | null;
  readonly actorDisplayName: string | null;
  readonly actorRole: string | null;
  readonly actorStatus: string | null;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly diff: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
}

export interface CreateAuditLogInput {
  readonly actorType: AuditActorType;
  readonly actorId?: string | null;
  readonly action: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly diff?: Record<string, unknown> | null;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly createdAt?: Date;
}

export interface AuditLogFilter {
  readonly actorType?: AuditActorType;
  readonly actorId?: string;
  readonly actorEmail?: string;
  readonly action?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly ipAddress?: string;
  readonly search?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export interface AuditLogRepository {
  list(filters: AuditLogFilter, page: number, pageSize: number): Promise<PaginatedResult<AuditLogRecord>>;
  log(entry: CreateAuditLogInput): Promise<void>;
}
