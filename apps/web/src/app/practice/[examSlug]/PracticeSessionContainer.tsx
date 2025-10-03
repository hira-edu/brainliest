'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Breadcrumbs,
  Icon,
  PracticeLayout,
  PracticeQuestionCard,
  PracticeQuestionActions,
  PracticeQuestionStatus,
  PracticeQuestionExplanation,
  PracticeQuestionContent,
  PracticeSidebar,
  PracticeSidebarChecklistCard,
  PracticeSidebarShortcutsCard,
} from '@brainliest/ui';
import { mapApiResponseToPracticeSessionData } from '@/lib/practice/mappers';
import type {
  PracticeSessionApiQuestion,
  PracticeSessionApiResponse,
  PracticeSessionData,
} from '@/lib/practice/types';
import { PracticeClient } from './PracticeClient';
import { ExplainButton } from '../ExplainButton';

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
    }
  | {
      operation: 'submit-answer';
      questionId: string;
    }
  | {
      operation: 'reveal-answer';
      questionId: string;
    }
  | {
      operation: 'complete-session';
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

const determineLocalCorrectness = (
  question: PracticeSessionApiQuestion,
  selectedAnswers: readonly number[]
): boolean | null => {
  const options = question.question.options ?? [];
  const correctIds = new Set(question.question.correctChoiceIds ?? []);

  if (correctIds.size === 0) {
    return null;
  }

  const correctIndices = options
    .map((option, index) => (correctIds.has(option.id) ? index : null))
    .filter((value): value is number => value !== null);

  const selectedSet = new Set(
    [...selectedAnswers].filter((index) => Number.isFinite(index) && index >= 0 && index < options.length)
  );
  const correctSet = new Set(correctIndices);

  if (selectedSet.size !== correctSet.size) {
    return false;
  }

  for (const value of selectedSet) {
    if (!correctSet.has(value)) {
      return false;
    }
  }

  return true;
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
      const submittedSet = new Set(session.submittedQuestionIds);
      const revealedSet = new Set(session.revealedQuestionIds);
      const nextQuestion = session.questions[nextIndex];
      const fallbackQuestionId = nextQuestion?.questionId ?? session.questionState.questionId;
      return {
        ...session,
        currentQuestionIndex: nextIndex,
        question: nextQuestion?.question ?? session.question,
        questionState: {
          questionId: fallbackQuestionId,
          orderIndex: nextQuestion?.orderIndex ?? session.questionState.orderIndex,
          selectedAnswers: nextQuestion?.selectedAnswers
            ? [...nextQuestion.selectedAnswers]
            : [...session.questionState.selectedAnswers],
          isFlagged: flaggedSet.has(fallbackQuestionId),
          isBookmarked: bookmarkedSet.has(fallbackQuestionId),
          isSubmitted: submittedSet.has(fallbackQuestionId),
          hasRevealedAnswer: revealedSet.has(fallbackQuestionId),
          isCorrect:
            nextQuestion?.isCorrect !== undefined && nextQuestion?.isCorrect !== null
              ? nextQuestion.isCorrect
              : session.questionState.isCorrect ?? null,
          timeSpentSeconds: nextQuestion?.timeSpentSeconds ?? session.questionState.timeSpentSeconds,
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
    case 'submit-answer': {
      const submittedSet = new Set(session.submittedQuestionIds);
      submittedSet.add(payload.questionId);

      const nextQuestions: PracticeSessionApiQuestion[] = session.questions.map((question) => {
        if (question.questionId !== payload.questionId) {
          return question;
        }

        const isCorrect = determineLocalCorrectness(question, question.selectedAnswers ?? []);
        return {
          ...question,
          isSubmitted: true,
          hasRevealedAnswer: false,
          isCorrect,
        };
      });

      const targetQuestion = nextQuestions.find((question) => question.questionId === payload.questionId);
      const isActiveQuestion = session.questionState.questionId === payload.questionId;

      return {
        ...session,
        submittedQuestionIds: Array.from(submittedSet),
        questions: nextQuestions,
        questionState: isActiveQuestion
          ? {
              ...session.questionState,
              isSubmitted: true,
              hasRevealedAnswer: false,
              isCorrect: targetQuestion
                ? determineLocalCorrectness(targetQuestion, targetQuestion.selectedAnswers ?? [])
                : session.questionState.isCorrect,
            }
          : session.questionState,
      };
    }
    case 'reveal-answer': {
      const revealedSet = new Set(session.revealedQuestionIds);
      revealedSet.add(payload.questionId);

      const nextQuestions: PracticeSessionApiQuestion[] = session.questions.map((question) =>
        question.questionId === payload.questionId
          ? {
              ...question,
              hasRevealedAnswer: true,
            }
          : question
      );

      const isActiveQuestion = session.questionState.questionId === payload.questionId;

      return {
        ...session,
        revealedQuestionIds: Array.from(revealedSet),
        questions: nextQuestions,
        questionState: isActiveQuestion
          ? {
              ...session.questionState,
              hasRevealedAnswer: true,
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
    case 'complete-session': {
      return {
        ...session,
        sessionStatus: 'completed',
      };
    }
    default:
      return session;
  }
};

interface PracticeSessionContainerProps {
  initialData: PracticeSessionData;
  examSlug: string;
}

export function PracticeSessionContainer({ initialData, examSlug }: PracticeSessionContainerProps) {
  const [session, setSession] = useState<PracticeSessionData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionExplanation, setShowQuestionExplanation] = useState(false);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] = useState<number | null>(
    initialData.progress.timeRemainingSeconds ?? null
  );
  const timerSyncRef = useRef<number | null>(initialData.progress.timeRemainingSeconds ?? null);
  const router = useRouter();

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

  const handleSubmitAnswer = useCallback(async () => {
    await sendPatch({
      operation: 'submit-answer',
      questionId: activeQuestion?.questionId ?? session.questionState.questionId,
    });
  }, [activeQuestion?.questionId, sendPatch, session.questionState.questionId]);

  const handleRevealAnswer = useCallback(async () => {
    await sendPatch({
      operation: 'reveal-answer',
      questionId: activeQuestion?.questionId ?? session.questionState.questionId,
    });
  }, [activeQuestion?.questionId, sendPatch, session.questionState.questionId]);

  const handleCompleteSession = useCallback(async () => {
    const result = await sendPatch({
      operation: 'complete-session',
    });

    if (session.fromSample) {
      return;
    }

    if (result) {
      const summaryUrl = `/practice/${examSlug}/summary?sessionId=${encodeURIComponent(result.session.id)}`;
      router.push(summaryUrl);
    }
  }, [sendPatch, router, examSlug, session.fromSample]);

  const isFlagged = useMemo(
    () => session.flaggedQuestionIds.includes(activeQuestion?.questionId ?? session.questionState.questionId),
    [activeQuestion?.questionId, session.flaggedQuestionIds, session.questionState.questionId]
  );

  const isBookmarked = useMemo(
    () => session.bookmarkedQuestionIds.includes(activeQuestion?.questionId ?? session.questionState.questionId),
    [activeQuestion?.questionId, session.bookmarkedQuestionIds, session.questionState.questionId]
  );

  const isSubmitted = session.questionState.isSubmitted;
  const hasRevealedAnswer = session.questionState.hasRevealedAnswer;
  const isCorrect = session.questionState.isCorrect;

  const statusBanner = useMemo(() => {
    if (session.sessionStatus === 'completed') {
      return {
        variant: 'success' as const,
        title: 'Exam completed',
        description: 'You can review your answers or exit when ready.',
      };
    }

    if (hasRevealedAnswer) {
      if (isCorrect === true) {
        return {
          variant: 'success' as const,
          title: 'Correct answer',
          description: 'Nice work — your submitted answer matches the correct solution.',
        };
      }

      if (isCorrect === false) {
        return {
          variant: 'warning' as const,
          title: 'Review the solution',
          description: 'Compare your submitted answer with the revealed solution.',
        };
      }

      return {
        variant: 'info' as const,
        title: 'Answer revealed',
        description: 'Correct answer revealed. Review the solution and continue when ready.',
      };
    }

    if (isSubmitted) {
      return {
        variant: 'info' as const,
        title: 'Answer submitted',
        description: 'Reveal the solution when you are ready to check your work.',
      };
    }

    if (isFlagged) {
      return {
        variant: 'warning' as const,
        title: 'Flagged for review',
        description: 'This question is flagged for review.',
      };
    }

    if (isBookmarked) {
      return {
        variant: 'info' as const,
        title: 'Bookmarked',
        description: 'This question is bookmarked for quick access.',
      };
    }

    return {
      variant: 'info' as const,
      title: 'Ready to answer',
      description: 'Review the prompt and select your answer.',
    };
  }, [
    hasRevealedAnswer,
    isBookmarked,
    isCorrect,
    isFlagged,
    isSubmitted,
    session.sessionStatus,
  ]);

  useEffect(() => {
    setDisplayRemainingSeconds(session.progress.timeRemainingSeconds ?? null);
    timerSyncRef.current = session.progress.timeRemainingSeconds ?? null;
  }, [session.progress.timeRemainingSeconds, session.sessionId]);

  useEffect(() => {
    setShowQuestionExplanation(false);
  }, [session.question.id]);

  const hasTimer = displayRemainingSeconds !== null;

  const canFinalizeExam =
    !session.fromSample &&
    session.sessionStatus !== 'completed' &&
    session.currentQuestionIndex === session.questions.length - 1 &&
    session.questionState.isSubmitted &&
    session.questionState.hasRevealedAnswer;

  const navigationBreadcrumbs = useMemo(() => {
    const items: Array<{ label: string; href?: string; isCurrent?: boolean }> = [];

    const categoryLabel = session.exam.category?.name ??
      (session.exam.category?.type ? session.exam.category.type.replace(/^\w/, (char) => char.toUpperCase()) : undefined);

    if (categoryLabel) {
      items.push({ label: categoryLabel });
    } else {
      items.push({ label: 'Practice', href: '/practice' });
    }

    const subcategoryLabel = session.exam.subcategory?.name ?? session.exam.subcategory?.slug;
    if (subcategoryLabel) {
      items.push({ label: subcategoryLabel });
    }

    const examIdentifier = session.exam.slug ? `${session.exam.title} (${session.exam.slug})` : session.exam.title;
    items.push({ label: examIdentifier, isCurrent: true });

    return items;
  }, [session.exam.category?.name, session.exam.category?.type, session.exam.subcategory?.name, session.exam.subcategory?.slug, session.exam.slug, session.exam.title]);

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs items={navigationBreadcrumbs} className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="ArrowLeft" aria-hidden="true" />}
            asChild
          >
            <a href="/practice">Back to exams</a>
          </Button>
        </div>
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
          <PracticeQuestionStatus
            variant={statusBanner.variant}
            title={statusBanner.title}
            description={statusBanner.description}
          />
          <ExplainButton
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
            onSubmitAnswer={handleSubmitAnswer}
            onRevealAnswer={handleRevealAnswer}
            renderFooter={({ explanationButton, savingIndicator, onSubmit, canSubmit }) => (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {explanationButton}
                  <Button onClick={onSubmit} disabled={!canSubmit}>
                    Submit answer
                  </Button>
                  {canFinalizeExam ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        void handleCompleteSession();
                      }}
                      disabled={isSaving || session.sessionStatus === 'completed'}
                    >
                      Finish exam
                    </Button>
                  ) : null}
                </div>
                {savingIndicator ? (
                  <div className="flex justify-end text-xs text-gray-500">{savingIndicator}</div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="order-1"
                    disabled={session.currentQuestionIndex === 0}
                    onClick={() => {
                      void handleAdvance('previous');
                    }}
                  >
                    Previous
                  </Button>
                  <p className="order-3 w-full text-center text-sm text-gray-500 sm:order-2 sm:w-auto sm:flex-1">
                    {progressLabel}
                  </p>
                  <Button
                    className="order-2 sm:order-3 sm:ml-auto"
                    disabled={session.currentQuestionIndex >= session.questions.length - 1}
                    onClick={() => {
                      void handleAdvance('next');
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          />
          {isSaving ? <Badge variant="secondary">Saving…</Badge> : null}
        </PracticeQuestionContent>
      </PracticeQuestionCard>
    </PracticeLayout>
  );
}
