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
