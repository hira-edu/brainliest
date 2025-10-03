import 'server-only';

import { headers } from 'next/headers';

interface ExplanationDto {
  readonly id: string;
  readonly questionId: string;
  readonly questionVersionId: string;
  readonly answerPattern: string;
  readonly model: string;
  readonly language: string;
  readonly tokensTotal: number;
  readonly costCents: number;
  readonly createdAt: string;
  readonly subjectSlug: string;
  readonly examSlug: string | null;
  readonly questionStem: string;
}

export interface PaginationDto {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

interface ExplanationResponse {
  readonly data: ExplanationDto[];
  readonly pagination: PaginationDto;
}

export interface ExplanationRecord extends Omit<ExplanationDto, 'createdAt'> {
  readonly createdAt: Date;
}

export interface ExplanationMetrics {
  readonly totalCount: number;
  readonly tokensTotal: number;
  readonly costCentsTotal: number;
  readonly averageCostCents: number;
  readonly averageTokens: number;
  readonly windowDays: number;
  readonly series: ReadonlyArray<{
    readonly day: string;
    readonly totalCount: number;
    readonly tokensTotal: number;
    readonly costCentsTotal: number;
  }>;
}

type FetchExplanationPageOptions = {
  readonly page: number;
  readonly pageSize: number;
  readonly cache?: RequestCache;
};

async function resolveAdminBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const rawHost = headerStore.get('host');
  const hostHeader = typeof rawHost === 'string' ? rawHost : '';

  if (process.env.ADMIN_BASE_URL) {
    return process.env.ADMIN_BASE_URL;
  }

  if (hostHeader.length > 0) {
    const protocol = hostHeader.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${hostHeader}`;
  }

  return 'http://localhost:3001';
}

function isPaginationDto(value: unknown): value is PaginationDto {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.page === 'number' &&
    typeof candidate.pageSize === 'number' &&
    typeof candidate.totalCount === 'number' &&
    typeof candidate.totalPages === 'number'
  );
}

function isExplanationDto(value: unknown): value is ExplanationDto {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.questionId === 'string' &&
    typeof candidate.questionVersionId === 'string' &&
    typeof candidate.answerPattern === 'string' &&
    typeof candidate.model === 'string' &&
    typeof candidate.language === 'string' &&
    typeof candidate.tokensTotal === 'number' &&
    typeof candidate.costCents === 'number' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.subjectSlug === 'string' &&
    (typeof candidate.examSlug === 'string' || candidate.examSlug === null) &&
    typeof candidate.questionStem === 'string'
  );
}

function isExplanationResponse(payload: unknown): payload is ExplanationResponse {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.data) || !isPaginationDto(record.pagination)) {
    return false;
  }

  return record.data.every((item) => isExplanationDto(item));
}

export async function fetchExplanationPage({
  page,
  pageSize,
  cache = 'no-store',
}: FetchExplanationPageOptions): Promise<{ data: ExplanationRecord[]; pagination: PaginationDto; }> {
  const baseUrl = await resolveAdminBaseUrl();

  const response = await fetch(`${baseUrl}/api/explanations?page=${page}&pageSize=${pageSize}`, {
    cache,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load explanation activity (status ${response.status})`);
  }

  const payload = (await response.json()) as unknown;

  if (!isExplanationResponse(payload)) {
    throw new Error('Unexpected explanation response payload.');
  }

  return {
    data: payload.data.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
    pagination: payload.pagination,
  };
}

export async function fetchExplanationMetrics(
  options: { windowDays?: number; cache?: RequestCache } = {}
): Promise<ExplanationMetrics> {
  const baseUrl = await resolveAdminBaseUrl();
  const windowDays = options.windowDays ?? 7;
  const cache = options.cache ?? 'no-store';

  const response = await fetch(`${baseUrl}/api/explanations/metrics?window=${windowDays}`, {
    cache,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load explanation metrics (status ${response.status})`);
  }

  const payload = (await response.json()) as Partial<ExplanationMetrics> & {
    readonly series?: Array<{
      readonly day?: string;
      readonly totalCount?: number;
      readonly tokensTotal?: number;
      readonly costCentsTotal?: number;
    }>;
  };

  return {
    totalCount: typeof payload.totalCount === 'number' ? payload.totalCount : 0,
    tokensTotal: typeof payload.tokensTotal === 'number' ? payload.tokensTotal : 0,
    costCentsTotal: typeof payload.costCentsTotal === 'number' ? payload.costCentsTotal : 0,
    averageCostCents: typeof payload.averageCostCents === 'number' ? payload.averageCostCents : 0,
    averageTokens: typeof payload.averageTokens === 'number' ? payload.averageTokens : 0,
    windowDays: typeof payload.windowDays === 'number' ? payload.windowDays : windowDays,
    series: Array.isArray(payload.series)
      ? payload.series
          .filter((point): point is { day: string; totalCount: number; tokensTotal: number; costCentsTotal: number } =>
            typeof point.day === 'string' &&
            typeof point.totalCount === 'number' &&
            typeof point.tokensTotal === 'number' &&
            typeof point.costCentsTotal === 'number'
          )
          .map((point) => ({
            day: point.day,
            totalCount: point.totalCount,
            tokensTotal: point.tokensTotal,
            costCentsTotal: point.costCentsTotal,
          }))
      : [],
  } satisfies ExplanationMetrics;
}
