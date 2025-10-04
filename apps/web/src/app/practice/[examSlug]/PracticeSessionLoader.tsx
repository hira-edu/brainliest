'use client';

import { useEffect, useRef, useState } from 'react';
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
  const snapshotRef = useRef<ReturnType<typeof loadSampleSessionSnapshot> | null>(null);
  const [session, setSession] = useState<PracticeSessionData>(() => {
    if (initialData.fromSample) {
      snapshotRef.current = loadSampleSessionSnapshot(examSlug);
      if (snapshotRef.current) {
        const merged = mergeSampleSessionWithSnapshot(initialData, snapshotRef.current);
        // eslint-disable-next-line no-console
        console.log('[practice] loader init with snapshot', {
          examSlug,
          flagged: merged.flaggedQuestionIds,
          bookmarked: merged.bookmarkedQuestionIds,
        });
        return merged;
      }
    }

    return initialData;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData.fromSample) {
      return;
    }

    if (!snapshotRef.current) {
      persistSampleSessionState(examSlug, initialData, initialData.progress.timeRemainingSeconds ?? null);
    }
  }, [examSlug, initialData, initialData.fromSample]);

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
        const mapped = mapApiResponseToPracticeSessionData(payload);

        if (initialData.fromSample) {
          const sampleSession: PracticeSessionData = {
            ...mapped,
            fromSample: true,
          };
          const snapshot = snapshotRef.current ?? loadSampleSessionSnapshot(examSlug);
          const merged = snapshot ? mergeSampleSessionWithSnapshot(sampleSession, snapshot) : sampleSession;
          persistSampleSessionState(examSlug, merged, merged.progress.timeRemainingSeconds ?? null);
          snapshotRef.current = loadSampleSessionSnapshot(examSlug);
          // eslint-disable-next-line no-console
          console.log('[practice] loader merged session', {
            flagged: merged.flaggedQuestionIds,
            bookmarked: merged.bookmarkedQuestionIds,
            hadSnapshot: Boolean(snapshot),
          });
          setSession(merged);
          setError(null);
          return;
        }

        setSession(mapped);
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
  }, [examSlug, initialData.fromSample]);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-error-600">{error}</p>
      ) : null}
      <PracticeSessionContainer key={session.sessionId} initialData={session} examSlug={examSlug} />
    </div>
  );
}
