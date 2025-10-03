'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  PracticeLayout,
  PracticeQuestionCard,
  PracticeQuestionActions,
  PracticeQuestionStatus,
  PracticeQuestionExplanation,
  PracticeQuestionContent,
  PracticeExplainButton,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
  PracticeQuestionFooter,
} from '@brainliest/ui';
import { mapApiResponseToPracticeSessionData } from '@/lib/practice/mappers';
import type {
  PracticeSessionApiQuestion,
  PracticeSessionApiResponse,
  PracticeSessionData,
} from '@/lib/practice/types';
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
  const [showQuestionExplanation, setShowQuestionExplanation] = useState(false);
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

  const statusMessage = isFlagged
    ? 'This question is flagged for review.'
    : isBookmarked
    ? 'This question is bookmarked for quick access.'
    : 'Review the prompt and select your answer.';

  useEffect(() => {
    setDisplayRemainingSeconds(session.progress.timeRemainingSeconds ?? null);
    timerSyncRef.current = session.progress.timeRemainingSeconds ?? null;
  }, [session.progress.timeRemainingSeconds, session.sessionId]);

  useEffect(() => {
    setShowQuestionExplanation(false);
  }, [session.question.id]);

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
        <PracticeSidebar>
          <PracticeSidebarChecklistCard
            items={['Flag questions to revisit later', 'Toggle calculator mode when allowed', 'Review hints before requesting AI help']}
          />
          <PracticeSidebarShortcutsCard
            shortcuts={[
              { key: 'J', description: 'Next question' },
              { key: 'K', description: 'Previous question' },
              { key: '/', description: 'Command palette' },
            ]}
          />
          {error ? <p className="text-sm text-error-600">{error}</p> : null}
        </PracticeSidebar>
      }
    >
        <PracticeQuestionCard
          label={`Question ${session.progress.questionIndex}`}
          title={session.question.stemMarkdown}
          difficulty={session.question.difficulty}
          actions={
          <PracticeQuestionActions
            isBookmarked={isBookmarked}
            onToggleBookmark={(next) => {
              void handleToggleBookmark(next);
            }}
            isFlagged={isFlagged}
            onToggleFlag={(next) => {
              void handleToggleFlag(next);
            }}
            timerLabel={timeRemainingLabel}
          />
        }
      >
        <PracticeQuestionContent>
          <PracticeQuestionStatus message={statusMessage} />
          <PracticeExplainButton
            isActive={showQuestionExplanation}
            onClick={() => setShowQuestionExplanation((previous) => !previous)}
            label={showQuestionExplanation ? 'Hide question explanation' : 'AI explanation'}
            size="sm"
            aria-label={
              showQuestionExplanation ? 'Hide question explanation' : 'Toggle question explanation'
            }
          />
          <PracticeQuestionExplanation
            visible={showQuestionExplanation}
            content={session.question.explanationMarkdown}
          />
          <PracticeClient
            question={session.question}
            questionState={session.questionState}
            onRecordAnswer={handleRecordAnswer}
            isSaving={isSaving}
            fromSample={session.fromSample}
            renderFooter={({
              explanationButton,
              supportText,
              savingIndicator,
              onSubmit,
              canSubmit,
              onReveal,
              canReveal,
            }) => (
              <PracticeQuestionFooter
                progressLabel={progressLabel}
                disablePrevious={session.currentQuestionIndex === 0}
                disableNext={session.currentQuestionIndex >= session.questions.length - 1}
                onPrevious={() => {
                  void handleAdvance('previous');
                }}
                onNext={() => {
                  void handleAdvance('next');
                }}
                leadingSlot={
                  <div className="flex flex-col gap-1">
                    {explanationButton}
                    {supportText}
                    {savingIndicator}
                  </div>
                }
                trailingSlot={
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={onSubmit} disabled={!canSubmit}>
                      Submit answer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onReveal}
                      disabled={!canReveal}
                    >
                      Reveal correct answer
                    </Button>
                  </div>
                }
              />
            )}
          />
          {isSaving ? <Badge variant="secondary">Saving…</Badge> : null}
        </PracticeQuestionContent>
      </PracticeQuestionCard>
    </PracticeLayout>
  );
}
