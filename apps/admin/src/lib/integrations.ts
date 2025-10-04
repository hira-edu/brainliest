import 'server-only';

import type {
  IntegrationEnvironment,
  IntegrationKeyFilter,
  IntegrationKeyRecord,
  PaginatedResult,
} from '@brainliest/db';
import { repositories } from './repositories';
import type { CreateIntegrationKeyPayload, RotateIntegrationKeyPayload } from './shared-schemas';

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

export interface IntegrationKeySuggestion {
  readonly id: string;
  readonly name: string;
  readonly environment: IntegrationEnvironment;
}

export async function searchIntegrationKeySuggestions(
  query: string,
  limit = 6,
  environment?: IntegrationEnvironment
): Promise<IntegrationKeySuggestion[]> {
  const term = query.trim();
  if (term.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(20, Math.trunc(limit)));

  const filters: IntegrationKeyFilter = {
    ...(environment ? { environment } : {}),
    search: term,
  };

  const page = await repositories.integrationKeys.list(filters, 1, safeLimit);

  return page.data.map((key) => ({
    id: key.id,
    name: key.name,
    environment: key.environment,
  }));
}

export async function createIntegrationKey(
  payload: CreateIntegrationKeyPayload,
  actorId: string | null = null
): Promise<string> {
  return repositories.integrationKeys.create({
    name: payload.name,
    type: payload.type,
    environment: payload.environment,
    description: payload.description ?? null,
    value: payload.value,
    createdByAdminId: actorId,
  });
}

export async function rotateIntegrationKey(
  payload: RotateIntegrationKeyPayload,
  actorId: string | null = null
): Promise<void> {
  await repositories.integrationKeys.rotate({
    id: payload.id,
    value: payload.value,
    rotatedByAdminId: actorId,
  });
}
