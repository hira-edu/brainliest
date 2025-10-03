'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Card, PracticeLayout, PracticeQuestionCard, Stack } from '@brainliest/ui';
import { mapApiResponseToPracticeSessionData } from '@/lib/practice/mappers';
import type {
  PracticeSessionApiQuestion,
  PracticeSessionApiResponse,
  PracticeSessionData,
} from '@/lib/practice/types';
import { PracticeNavigationPanel } from './PracticeNavigationPanel';
import { PracticeClient } from './PracticeClient';

type SessionPatchPayload =
  | {
      operation: 'advance';
      currentQuestionIndex: number;
    }
  | {
      operation: 'toggle-flag';
      questionId: string;
      flagged: boolean;
    }
  | {
      operation: 'toggle-bookmark';
      questionId: string;
      bookmarked: boolean;
    }
  | {
      operation: 'record-answer';
      questionId: string;
      selectedAnswers: number[];
      timeSpentSeconds?: number | null;
    }
  | {
      operation: 'update-timer';
      remainingSeconds: number;
    };

const formatTimeRemaining = (seconds?: number | null): string | undefined => {
  if (seconds === null || seconds === undefined || seconds <= 0) {
    return undefined;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const padded = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${padded}`;
};

const applyLocalPatch = (
  session: PracticeSessionData,
  payload: SessionPatchPayload
): PracticeSessionData => {
  switch (payload.operation) {
    case 'advance': {
      const nextIndex = Math.max(0, Math.min(payload.currentQuestionIndex, session.questions.length - 1));
      const flaggedSet = new Set(session.flaggedQuestionIds);
      const bookmarkedSet = new Set(session.bookmarkedQuestionIds);
      return {
        ...session,
        currentQuestionIndex: nextIndex,
        question: session.questions[nextIndex]?.question ?? session.question,
        questionState: {
          questionId: session.questions[nextIndex]?.questionId ?? session.questionState.questionId,
          orderIndex: session.questions[nextIndex]?.orderIndex ?? session.questionState.orderIndex,
          selectedAnswers:
            session.questions[nextIndex]?.selectedAnswers ?? [...session.questionState.selectedAnswers],
          isFlagged:
            flaggedSet.has(session.questions[nextIndex]?.questionId ?? session.questionState.questionId) ??
            session.questionState.isFlagged,
          isBookmarked:
            bookmarkedSet.has(session.questions[nextIndex]?.questionId ?? session.questionState.questionId) ??
            session.questionState.isBookmarked,
          timeSpentSeconds:
            session.questions[nextIndex]?.timeSpentSeconds ?? session.questionState.timeSpentSeconds,
        },
        progress: {
          ...session.progress,
          questionIndex: nextIndex + 1,
        },
      };
    }
    case 'toggle-flag': {
      const nextFlagged = payload.flagged
        ? Array.from(new Set([...session.flaggedQuestionIds, payload.questionId]))
        : session.flaggedQuestionIds.filter((id) => id !== payload.questionId);

      const nextQuestions: PracticeSessionApiQuestion[] = session.questions.map((question) =>
        question.questionId === payload.questionId
          ? {
              ...question,
              isFlagged: payload.flagged,
            }
          : question
      );

      const isActiveQuestion = session.questionState.questionId === payload.questionId;

      return {
        ...session,
        flaggedQuestionIds: nextFlagged,
        questions: nextQuestions,
        questionState: isActiveQuestion
          ? {
              ...session.questionState,
              isFlagged: payload.flagged,
              isBookmarked: session.questionState.isBookmarked,
            }
          : session.questionState,
      };
    }
    case 'toggle-bookmark': {
      const nextBookmarked = payload.bookmarked
        ? Array.from(new Set([...session.bookmarkedQuestionIds, payload.questionId]))
        : session.bookmarkedQuestionIds.filter((id) => id !== payload.questionId);

      const nextQuestions: PracticeSessionApiQuestion[] = session.questions.map((question) =>
        question.questionId === payload.questionId
          ? {
              ...question,
              isBookmarked: payload.bookmarked,
            }
          : question
      );

      const isActiveQuestion = session.questionState.questionId === payload.questionId;

      return {
        ...session,
        bookmarkedQuestionIds: nextBookmarked,
        questions: nextQuestions,
        questionState: isActiveQuestion
          ? {
              ...session.questionState,
              isFlagged: session.questionState.isFlagged,
              isBookmarked: payload.bookmarked,
            }
          : session.questionState,
      };
    }
    case 'record-answer': {
      const nextQuestions: PracticeSessionApiQuestion[] = session.questions.map((question) =>
        question.questionId === payload.questionId
          ? {
              ...question,
              selectedAnswers: [...payload.selectedAnswers],
              timeSpentSeconds:
                payload.timeSpentSeconds !== undefined && payload.timeSpentSeconds !== null
                  ? payload.timeSpentSeconds
                  : question.timeSpentSeconds ?? 0,
            }
          : question
      );

      const isActiveQuestion = session.questionState.questionId === payload.questionId;

      return {
        ...session,
        questions: nextQuestions,
        questionState: isActiveQuestion
          ? {
              ...session.questionState,
              selectedAnswers: [...payload.selectedAnswers],
              isFlagged: session.questionState.isFlagged,
              isBookmarked: session.questionState.isBookmarked,
              timeSpentSeconds:
                payload.timeSpentSeconds !== undefined && payload.timeSpentSeconds !== null
                  ? payload.timeSpentSeconds
                  : session.questionState.timeSpentSeconds,
            }
          : session.questionState,
      };
    }
    case 'update-timer': {
      return {
        ...session,
        progress: {
          ...session.progress,
          timeRemainingSeconds: Math.max(0, payload.remainingSeconds),
        },
      };
    }
    default:
      return session;
  }
};

interface PracticeSessionContainerProps {
  initialData: PracticeSessionData;
}

export function PracticeSessionContainer({ initialData }: PracticeSessionContainerProps) {
  const [session, setSession] = useState<PracticeSessionData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] = useState<number | null>(
    initialData.progress.timeRemainingSeconds ?? null
  );
  const timerSyncRef = useRef<number | null>(initialData.progress.timeRemainingSeconds ?? null);

  const activeQuestion = session.questions[session.currentQuestionIndex] ?? session.questions[0];

  const timeRemainingLabel = formatTimeRemaining(displayRemainingSeconds);
  const progressLabel = `Question ${session.progress.questionIndex} of ${session.progress.totalQuestions}`;

  const sendPatch = useCallback(
    async (payload: SessionPatchPayload): Promise<PracticeSessionApiResponse | null> => {
      if (session.fromSample) {
        setSession((current) => applyLocalPatch(current, payload));
        return null;
      }

      setIsSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/practice/sessions/${session.sessionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? 'Failed to update practice session.');
        }

        const data = (await response.json()) as PracticeSessionApiResponse;
        const nextSession = mapApiResponseToPracticeSessionData(data);
        setSession(nextSession);
        setDisplayRemainingSeconds(nextSession.progress.timeRemainingSeconds ?? null);
        timerSyncRef.current = nextSession.progress.timeRemainingSeconds ?? null;
        return data;
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Practice session update failed.';
        setError(message);
        throw requestError;
      } finally {
        setIsSaving(false);
      }
    },
    [session.fromSample, session.sessionId]
  );

  const handleAdvance = useCallback(
    async (direction: 'previous' | 'next') => {
      const nextIndex = direction === 'next'
        ? Math.min(session.currentQuestionIndex + 1, session.questions.length - 1)
        : Math.max(session.currentQuestionIndex - 1, 0);

      if (nextIndex === session.currentQuestionIndex) {
        return;
      }

      await sendPatch({
        operation: 'advance',
        currentQuestionIndex: nextIndex,
      });
    },
    [sendPatch, session.currentQuestionIndex, session.questions.length]
  );

  const handleToggleFlag = useCallback(
    async (next: boolean) => {
      await sendPatch({
        operation: 'toggle-flag',
        questionId: activeQuestion?.questionId ?? session.questionState.questionId,
        flagged: next,
      });
    },
    [activeQuestion?.questionId, sendPatch, session.questionState.questionId]
  );

  const handleToggleBookmark = useCallback(
    async (next: boolean) => {
      await sendPatch({
        operation: 'toggle-bookmark',
        questionId: activeQuestion?.questionId ?? session.questionState.questionId,
        bookmarked: next,
      });
    },
    [activeQuestion?.questionId, sendPatch, session.questionState.questionId]
  );

  const handleRecordAnswer = useCallback(
    async (selectedAnswers: number[]) => {
      await sendPatch({
        operation: 'record-answer',
        questionId: activeQuestion?.questionId ?? session.questionState.questionId,
        selectedAnswers,
      });
    },
    [activeQuestion?.questionId, sendPatch, session.questionState.questionId]
  );

  const isFlagged = useMemo(
    () => session.flaggedQuestionIds.includes(activeQuestion?.questionId ?? session.questionState.questionId),
    [activeQuestion?.questionId, session.flaggedQuestionIds, session.questionState.questionId]
  );

  const isBookmarked = useMemo(
    () => session.bookmarkedQuestionIds.includes(activeQuestion?.questionId ?? session.questionState.questionId),
    [activeQuestion?.questionId, session.bookmarkedQuestionIds, session.questionState.questionId]
  );

  useEffect(() => {
    setDisplayRemainingSeconds(session.progress.timeRemainingSeconds ?? null);
    timerSyncRef.current = session.progress.timeRemainingSeconds ?? null;
  }, [session.progress.timeRemainingSeconds, session.sessionId]);

  const hasTimer = displayRemainingSeconds !== null;

  useEffect(() => {
    if (!hasTimer) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setDisplayRemainingSeconds((previous) => {
        if (previous === null || previous <= 0) {
          return previous;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [hasTimer]);

  useEffect(() => {
    if (session.fromSample) {
      return;
    }

    if (displayRemainingSeconds === null) {
      return;
    }

    if (timerSyncRef.current === null) {
      timerSyncRef.current = displayRemainingSeconds;
      return;
    }

    const diff = timerSyncRef.current - displayRemainingSeconds;
    if (diff < 30 && displayRemainingSeconds !== 0) {
      return;
    }

    timerSyncRef.current = displayRemainingSeconds;
    void sendPatch({
      operation: 'update-timer',
      remainingSeconds: displayRemainingSeconds,
    }).catch(() => {
      // Error state handled inside sendPatch; ignore here to avoid duplicate surfacing.
    });
  }, [displayRemainingSeconds, sendPatch, session.fromSample]);

  return (
    <PracticeLayout
      sidebar={
        <Stack gap="4">
          <PracticeNavigationPanel
            progressLabel={progressLabel}
            timeRemainingLabel={timeRemainingLabel}
            disablePrevious={session.currentQuestionIndex === 0}
            disableNext={session.currentQuestionIndex >= session.questions.length - 1}
            isFlagged={isFlagged}
            onToggleFlag={(next) => {
              void handleToggleFlag(next);
            }}
            isBookmarked={isBookmarked}
            onToggleBookmark={(next) => {
              void handleToggleBookmark(next);
            }}
            onPrevious={() => {
              void handleAdvance('previous');
            }}
            onNext={() => {
              void handleAdvance('next');
            }}
          />
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Session checklist</h3>
            <ul className="ml-5 list-disc text-sm text-gray-600">
              <li>Flag questions to revisit later</li>
              <li>Toggle calculator mode when allowed</li>
              <li>Review hints before requesting AI help</li>
            </ul>
          </Card>
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Keyboard shortcuts</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <kbd className="rounded border border-slate-200 px-1 py-0.5">J</kbd> Next question
              </p>
              <p>
                <kbd className="rounded border border-slate-200 px-1 py-0.5">K</kbd> Previous question
              </p>
              <p>
                <kbd className="rounded border border-slate-200 px-1 py-0.5">/</kbd> Command palette
              </p>
            </div>
          </Card>
          {error ? <p className="text-sm text-error-600">{error}</p> : null}
        </Stack>
      }
    >
        <PracticeQuestionCard
          label={`Question ${session.progress.questionIndex}`}
          title={session.question.stemMarkdown}
          difficulty={session.question.difficulty}
      >
        <PracticeClient
          question={session.question}
          questionState={session.questionState}
          isFlagged={isFlagged}
          onToggleFlag={handleToggleFlag}
          onRecordAnswer={handleRecordAnswer}
          isSaving={isSaving}
          fromSample={session.fromSample}
        />
        {isSaving ? <Badge variant="secondary" className="mt-4">Saving…</Badge> : null}
      </PracticeQuestionCard>
    </PracticeLayout>
  );
}
