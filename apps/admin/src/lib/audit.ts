import 'server-only';

import type {
  AuditActorType,
  AuditLogFilter,
  AuditLogRecord,
  PaginatedResult,
} from '@brainliest/db';
import { repositories } from './repositories';

const DEFAULT_PAGE_SIZE = 20;

export interface ListAuditLogsOptions {
  readonly page?: number;
  readonly pageSize?: number;
  readonly actorType?: AuditActorType | 'all';
  readonly actorEmail?: string;
  readonly search?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export async function listAuditLogs(
  options: ListAuditLogsOptions = {}
): Promise<PaginatedResult<AuditLogRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize
    ? Math.max(1, Math.trunc(options.pageSize))
    : DEFAULT_PAGE_SIZE;

  const filters: AuditLogFilter = {
    ...(options.actorType && options.actorType !== 'all' ? { actorType: options.actorType } : {}),
    ...(options.actorEmail && options.actorEmail.trim().length > 0 ? { actorEmail: options.actorEmail.trim() } : {}),
    ...(options.search && options.search.trim().length > 0 ? { search: options.search.trim() } : {}),
    ...(options.createdAfter ? { createdAfter: options.createdAfter } : {}),
    ...(options.createdBefore ? { createdBefore: options.createdBefore } : {}),
  };

  return repositories.auditLogs.list(filters, page, pageSize);
}

export interface AuditLogMetrics {
  readonly totalCount: number;
  readonly adminCount: number;
  readonly userCount: number;
  readonly systemCount: number;
  readonly last24Hours: number;
}

export async function getAuditLogMetrics(): Promise<AuditLogMetrics> {
  const now = Date.now();
  const last24HoursBoundary = new Date(now - 24 * 60 * 60 * 1000);

  const [total, admin, user, system, last24h] = await Promise.all([
    repositories.auditLogs.list({}, 1, 1),
    repositories.auditLogs.list({ actorType: 'admin' }, 1, 1),
    repositories.auditLogs.list({ actorType: 'user' }, 1, 1),
    repositories.auditLogs.list({ actorType: 'system' }, 1, 1),
    repositories.auditLogs.list({ createdAfter: last24HoursBoundary }, 1, 1),
  ]);

  return {
    totalCount: total.pagination.totalCount,
    adminCount: admin.pagination.totalCount,
    userCount: user.pagination.totalCount,
    systemCount: system.pagination.totalCount,
    last24Hours: last24h.pagination.totalCount,
  };
}

export interface AuditActorSuggestion {
  readonly value: string;
  readonly label: string;
  readonly actorType: AuditActorType;
}

export async function searchAuditActorSuggestions(
  query: string,
  limit = 6
): Promise<AuditActorSuggestion[]> {
  const term = query.trim();
  if (term.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));

  const page = await repositories.auditLogs.list({ actorEmail: term }, 1, safeLimit * 3);

  const suggestions: AuditActorSuggestion[] = [];
  const seen = new Set<string>();

  for (const entry of page.data) {
    const email = entry.actorEmail ?? undefined;
    if (!email || seen.has(email)) {
      continue;
    }

    seen.add(email);

    const labelPrefix = entry.actorDisplayName && entry.actorDisplayName !== email ? `${entry.actorDisplayName} - ${email}` : email;

    suggestions.push({
      value: email,
      label: `${labelPrefix} (${entry.actorType})`,
      actorType: entry.actorType,
    });

    if (suggestions.length >= safeLimit) {
      break;
    }
  }

  return suggestions;
}

export interface AuditActionSuggestion {
  readonly value: string;
  readonly label: string;
}

export async function searchAuditActionSuggestions(
  query: string,
  limit = 6
): Promise<AuditActionSuggestion[]> {
  const term = query.trim();
  if (term.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));
  const page = await repositories.auditLogs.list({ action: term }, 1, safeLimit * 4);

  const seen = new Set<string>();
  const results: AuditActionSuggestion[] = [];

  for (const entry of page.data) {
    if (!entry.action || seen.has(entry.action)) {
      continue;
    }
    seen.add(entry.action);
    results.push({ value: entry.action, label: entry.action });
    if (results.length >= safeLimit) {
      break;
    }
  }

  return results;
}
