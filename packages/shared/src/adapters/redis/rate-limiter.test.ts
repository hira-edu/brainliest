import { describe, expect, it, vi } from 'vitest';

const { incrMock, expireMock, ttlMock } = vi.hoisted(() => ({
  incrMock: vi.fn<[], Promise<number>>(),
  expireMock: vi.fn<[], Promise<number>>().mockResolvedValue(1),
  ttlMock: vi.fn<[], Promise<number>>().mockResolvedValue(42),
}));

vi.mock('./index', () => ({
  redis: {
    incr: incrMock,
    expire: expireMock,
    ttl: ttlMock,
  },
}));

import { checkAiRateLimit, consumeRateLimit } from './rate-limiter';
describe('checkAiRateLimit', () => {
  it('increases counters and enforces thresholds', async () => {
    incrMock.mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValue(6);

    const identifier = 'user-123';
    const first = await checkAiRateLimit(identifier);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBeGreaterThanOrEqual(-5);
    expect(incrMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/user-123:minute$/));
    expect(incrMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/user-123:day$/));
    expect(expireMock).toHaveBeenCalledWith(expect.stringMatching(/user-123:minute$/), 60);
    expect(expireMock).toHaveBeenCalledWith(expect.stringMatching(/user-123:day$/), 86400);

    const blocked = await checkAiRateLimit(identifier);
    expect(blocked.allowed).toBe(false);
  });
});

describe('consumeRateLimit', () => {
  it('enforces windowed limits and reports retry window', async () => {
    incrMock.mockClear();
    expireMock.mockClear();
    ttlMock.mockClear();

    incrMock.mockResolvedValueOnce(1).mockResolvedValueOnce(4).mockResolvedValueOnce(6);
    ttlMock.mockResolvedValueOnce(50).mockResolvedValueOnce(35).mockResolvedValueOnce(20);

    const first = await consumeRateLimit({ key: 'ratelimit:test:ip', limit: 5, windowSeconds: 60 });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(4);
    expect(first.retryAfterSeconds).toBe(50);

    const second = await consumeRateLimit({ key: 'ratelimit:test:ip', limit: 5, windowSeconds: 60 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);

    const blocked = await consumeRateLimit({ key: 'ratelimit:test:ip', limit: 5, windowSeconds: 60 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(20);
    expect(blocked.totalHits).toBe(6);
  });
});
