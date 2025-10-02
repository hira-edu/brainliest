import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS, track, configureAnalyticsPersister } from './';

const SAMPLE_EVENT = {
  eventName: ANALYTICS_EVENTS.PAGE_VIEW,
  timestamp: Date.now(),
  properties: { path: '/' },
} as const;

describe('track', () => {
  afterEach(() => {
    configureAnalyticsPersister(async () => {});
    vi.restoreAllMocks();
  });

  it('invokes configured persister', async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    configureAnalyticsPersister(persist);

    await track({ ...SAMPLE_EVENT });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ eventName: SAMPLE_EVENT.eventName }));
  });

  it('no-ops when persister is not set', async () => {
    configureAnalyticsPersister(async () => {});
    await expect(track({ ...SAMPLE_EVENT })).resolves.toBeUndefined();
  });
});
