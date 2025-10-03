import 'server-only';

import type { PaginatedResult, UserFilter, UserRecord, UserRoleValue } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListUsersOptions extends Partial<UserFilter> {
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listUsers(options: ListUsersOptions = {}): Promise<PaginatedResult<UserRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: UserFilter = {
    ...(options.role ? { role: options.role } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.subscriptionTier ? { subscriptionTier: options.subscriptionTier } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.users.list(filters, page, pageSize);
}

export async function countUsersByStatus(role: UserRoleValue, status: string): Promise<number> {
  const result = await repositories.users.list({ role, status }, 1, 1);
  return result.pagination.totalCount;
}

export async function countUsersByRole(role: UserRoleValue): Promise<number> {
  const result = await repositories.users.list({ role }, 1, 1);
  return result.pagination.totalCount;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (!id) {
    return null;
  }

  return repositories.users.findById(id);
}

export interface UserSuggestion {
  readonly id: string;
  readonly email: string;
  readonly role: UserRoleValue;
  readonly status: string;
}

export interface UserSuggestionFilter {
  readonly role?: UserRoleValue;
  readonly status?: UserFilter['status'];
  readonly subscriptionTier?: UserFilter['subscriptionTier'];
}

export async function searchUsersSuggestions(
  query: string,
  limit = 6,
  filter: UserSuggestionFilter = {}
): Promise<UserSuggestion[]> {
  const term = query.trim();
  if (term.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));

  const filters: UserFilter = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.subscriptionTier ? { subscriptionTier: filter.subscriptionTier } : {}),
    search: term,
  };

  const page = await repositories.users.list(filters, 1, safeLimit);

  return page.data.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  }));
}
