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
  clearSampleSessionState,
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
      const storedSnapshot = snapshotRef.current ?? loadSampleSessionSnapshot(examSlug);
      snapshotRef.current = storedSnapshot;
      const storedSessionId = storedSnapshot?.data.sessionId;

      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': PRACTICE_DEMO_USER_ID,
      } as const;

      try {
        let payload: PracticeSessionApiResponse | null = null;

        if (storedSessionId && storedSessionId !== 'sample-session') {
          try {
            const resumeResponse = await fetch(`/api/practice/sessions/${storedSessionId}`, {
              method: 'GET',
              headers,
              signal: controller.signal,
              cache: 'no-store',
            });

            if (resumeResponse.ok) {
              payload = (await resumeResponse.json()) as PracticeSessionApiResponse;
            } else if (resumeResponse.status === 404) {
              clearSampleSessionState(examSlug);
              snapshotRef.current = null;
            }
          } catch (resumeError) {
            // eslint-disable-next-line no-console
            if (!cancelled) {
              console.warn('[practice] failed to resume session', resumeError);
            }
          }
        }

        if (!payload) {
          const startResponse = await fetch('/api/practice/sessions', {
            method: 'POST',
            headers,
            body: JSON.stringify({ examSlug, userId: PRACTICE_DEMO_USER_ID }),
            signal: controller.signal,
            cache: 'no-store',
          });

          if (!startResponse.ok) {
            throw new Error(`Failed to start session (${startResponse.status})`);
          }

          payload = (await startResponse.json()) as PracticeSessionApiResponse;
        }

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
