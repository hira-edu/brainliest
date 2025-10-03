import { beforeEach, describe, expect, it, vi } from 'vitest';

const listRecentMock = vi.fn();
const getAggregateTotalsMock = vi.fn();
const listDailyTotalsMock = vi.fn();

vi.mock('@brainliest/db', () => ({
  drizzleClient: {},
  DrizzleExplanationRepository: class {
    public listRecent = listRecentMock;
    public getAggregateTotals = getAggregateTotalsMock;
    public listDailyTotals = listDailyTotalsMock;
  },
}));

describe('GET /api/explanations', () => {
  beforeEach(() => {
    listRecentMock.mockReset();
    getAggregateTotalsMock.mockReset();
    listDailyTotalsMock.mockReset();
  });

  it('returns paginated explanation data', async () => {
    const { GET } = await import('./route');

    listRecentMock.mockResolvedValueOnce({
      data: [
        {
          id: 'exp-1',
          questionId: 'question-123',
          questionVersionId: 'version-123',
          answerPattern: 'hash-abc',
          content: 'Detailed explanation markdown',
          model: 'gpt-4.1-mini',
          language: 'en',
          tokensTotal: 96,
          costCents: 12,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          subjectSlug: 'algebra',
          examSlug: 'algebra-ii-midterm',
          questionStem: 'What is 3 + 5?',
        },
      ],
      pagination: {
        page: 2,
        pageSize: 5,
        totalCount: 25,
        totalPages: 5,
      },
    });

    const request = new Request('http://localhost/api/explanations?page=2&pageSize=5');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(listRecentMock).toHaveBeenCalledWith({ page: 2, pageSize: 5 });

    const body = (await response.json()) as {
      data: Array<Record<string, unknown>>;
      pagination: Record<string, unknown>;
    };

    expect(body.data).toEqual([
      {
        id: 'exp-1',
        questionId: 'question-123',
        questionVersionId: 'version-123',
        answerPattern: 'hash-abc',
        model: 'gpt-4.1-mini',
        language: 'en',
        tokensTotal: 96,
        costCents: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        subjectSlug: 'algebra',
        examSlug: 'algebra-ii-midterm',
        questionStem: 'What is 3 + 5?',
      },
    ]);

    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 5,
      totalCount: 25,
      totalPages: 5,
    });
  });

  it('defaults query parameters and caps page size when invalid values are provided', async () => {
    const { GET } = await import('./route');

    listRecentMock.mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 100,
        totalCount: 0,
        totalPages: 0,
      },
    });

    const request = new Request('http://localhost/api/explanations?page=not-a-number&pageSize=500');
    const response = await GET(request);

    expect(response.status).toBe(200);
    await response.json();

    expect(listRecentMock).toHaveBeenCalledWith({ page: 1, pageSize: 100 });
  });

  it('supports the legacy limit query parameter as a fallback', async () => {
    const { GET } = await import('./route');

    listRecentMock.mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
      },
    });

    const request = new Request('http://localhost/api/explanations?limit=5');
    await GET(request);

    expect(listRecentMock).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
  });
});

describe('GET /api/explanations/metrics', () => {
  beforeEach(() => {
    getAggregateTotalsMock.mockReset();
  });

  it('returns aggregate totals with averages', async () => {
    const { GET } = await import('./metrics/route');

    getAggregateTotalsMock.mockResolvedValueOnce({
      totalCount: 42,
      tokensTotal: 1234,
      costCentsTotal: 256,
    });
    listDailyTotalsMock.mockResolvedValueOnce([
      {
        day: new Date('2025-10-01T00:00:00Z'),
        totalCount: 5,
        tokensTotal: 120,
        costCentsTotal: 12,
      },
    ]);

    const response = await GET(new Request('http://localhost/api/explanations/metrics'));

    expect(response.status).toBe(200);
    expect(getAggregateTotalsMock).toHaveBeenCalledTimes(1);
    expect(listDailyTotalsMock).toHaveBeenCalledWith({ days: 7 });

    const payload = (await response.json()) as {
      totalCount: number;
      tokensTotal: number;
      costCentsTotal: number;
      averageCostCents: number;
      averageTokens: number;
      windowDays: number;
      series: Array<{ day: string; totalCount: number; tokensTotal: number; costCentsTotal: number }>;
    };
    expect(payload.totalCount).toBe(42);
    expect(payload.tokensTotal).toBe(1234);
    expect(payload.costCentsTotal).toBe(256);
    expect(payload.averageCostCents).toBe(Math.round(256 / 42));
    expect(payload.averageTokens).toBe(Math.round(1234 / 42));
    expect(payload.windowDays).toBe(7);
    expect(payload.series).toEqual([
      {
        day: '2025-10-01',
        totalCount: 5,
        tokensTotal: 120,
        costCentsTotal: 12,
      },
    ]);
  });
});
