import 'server-only';

import type { IntegrationEnvironment, IntegrationKeyFilter, IntegrationKeyRecord, PaginatedResult } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListIntegrationKeysOptions extends Partial<IntegrationKeyFilter> {
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listIntegrationKeys(
  options: ListIntegrationKeysOptions = {}
): Promise<PaginatedResult<IntegrationKeyRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: IntegrationKeyFilter = {
    ...(options.type ? { type: options.type } : {}),
    ...(options.environment ? { environment: options.environment } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.integrationKeys.list(filters, page, pageSize);
}

export async function countIntegrationKeysByEnvironment(environment: IntegrationEnvironment): Promise<number> {
  const result = await repositories.integrationKeys.list({ environment }, 1, 1);
  return result.pagination.totalCount;
}
