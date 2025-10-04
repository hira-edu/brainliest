'use client';

import { useEffect, useState } from 'react';
import {
  mapApiResponseToPracticeSessionData,
} from '@/lib/practice/mappers';
import type {
  PracticeSessionApiResponse,
  PracticeSessionData,
} from '@/lib/practice/types';
import { PRACTICE_DEMO_USER_ID } from '@/lib/practice/constants';
import {
  loadSampleSessionSnapshot,
  mergeSampleSessionWithSnapshot,
  persistSampleSessionState,
} from '@/lib/practice/sample-persistence';
import { PracticeSessionContainer } from './PracticeSessionContainer';

interface PracticeSessionLoaderProps {
  examSlug: string;
  initialData: PracticeSessionData;
}

export function PracticeSessionLoader({ examSlug, initialData }: PracticeSessionLoaderProps) {
  const [session, setSession] = useState<PracticeSessionData>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData.fromSample) {
      return;
    }

    const snapshot = loadSampleSessionSnapshot(examSlug);
    if (snapshot) {
      const merged = mergeSampleSessionWithSnapshot(initialData, snapshot);
      setSession(merged);
      persistSampleSessionState(examSlug, merged, merged.progress.timeRemainingSeconds ?? null);
      setError(null);
      return;
    }

    persistSampleSessionState(examSlug, initialData, initialData.progress.timeRemainingSeconds ?? null);
  }, [examSlug, initialData]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function hydrate() {
      try {
        const response = await fetch('/api/practice/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': PRACTICE_DEMO_USER_ID,
          },
          body: JSON.stringify({ examSlug, userId: PRACTICE_DEMO_USER_ID }),
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to start session (${response.status})`);
        }

        const payload = (await response.json()) as PracticeSessionApiResponse;
        if (cancelled) {
          return;
        }
        setSession(mapApiResponseToPracticeSessionData(payload));
        setError(null);
      } catch (hydrateError) {
        if (cancelled) {
          return;
        }
        setError(hydrateError instanceof Error ? hydrateError.message : 'Unable to load session.');
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [examSlug]);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : null}
      <PracticeSessionContainer key={session.sessionId} initialData={session} examSlug={examSlug} />
    </div>
  );
}
