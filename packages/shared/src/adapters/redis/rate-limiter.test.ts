import { describe, expect, it, vi } from 'vitest';

const { incrMock, expireMock } = vi.hoisted(() => ({
  incrMock: vi.fn<[], Promise<number>>(),
  expireMock: vi.fn<[], Promise<number>>().mockResolvedValue(1),
}));

vi.mock('./index', () => ({
  redis: {
    incr: incrMock,
    expire: expireMock,
  },
}));

import { checkAiRateLimit } from './rate-limiter';
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
