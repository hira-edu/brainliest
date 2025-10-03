import 'server-only';

import type { PaginatedResult, AdminUserFilter, AdminUserRecord } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListAdminUsersOptions extends Partial<AdminUserFilter> {
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listAdminUsers(options: ListAdminUsersOptions = {}): Promise<PaginatedResult<AdminUserRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: AdminUserFilter = {
    ...(options.role ? { role: options.role } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.adminUsers.list(filters, page, pageSize);
}

export async function countAdminUsersByRole(role: NonNullable<AdminUserFilter['role']>): Promise<number> {
  const result = await repositories.adminUsers.list({ role }, 1, 1);
  return result.pagination.totalCount;
}

export interface AdminUserSuggestion {
  readonly id: string;
  readonly email: string;
  readonly role: NonNullable<AdminUserFilter['role']>;
}

export interface AdminUserSuggestionFilter {
  readonly role?: NonNullable<AdminUserFilter['role']>;
  readonly status?: AdminUserFilter['status'];
}

export async function searchAdminUsersSuggestions(
  query: string,
  limit = 6,
  filter: AdminUserSuggestionFilter = {}
): Promise<AdminUserSuggestion[]> {
  const term = query.trim();
  if (term.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));

  const filters: AdminUserFilter = {
    search: term,
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };

  const page = await repositories.adminUsers.list(filters, 1, safeLimit);

  return page.data.map((admin) => ({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  }));
}
