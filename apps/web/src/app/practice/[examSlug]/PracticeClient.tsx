'use client';

/*
 * Next.js lint runs without project-aware typing for workspace imports, so we disable the unsafe operation
 * rules triggered when consuming shared types in this client module.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Stack,
  PracticeOptionList,
  PracticeFillBlank,
  PracticeExplanationCard,
  PracticeQuestionStatus,
} from '@brainliest/ui';
import type { PracticeOption } from '@brainliest/ui';
import type { QuestionModel } from '@brainliest/shared';
import type { ExplanationDtoShape } from '@brainliest/shared';
import type { PracticeSessionQuestionState } from '@/lib/practice/types';
import { requestExplanationAction } from './actions';
import { ExplainButton } from '../ExplainButton';

interface PracticeClientFooterRenderArgs {
  explanationButton: ReactNode;
  savingIndicator: ReactNode | null;
  onSubmit: () => void;
  canSubmit: boolean;
  onReveal: () => void;
  canReveal: boolean;
  isSubmitted: boolean;
  hasRevealed: boolean;
}

interface PracticeClientProps {
  question: QuestionModel;
  questionState: PracticeSessionQuestionState;
  onRecordAnswer: (selected: number[]) => Promise<void> | void;
  isSaving: boolean;
  fromSample: boolean;
  onSubmitAnswer: () => Promise<void> | void;
  onRevealAnswer: () => Promise<void> | void;
  renderFooter?: (args: PracticeClientFooterRenderArgs) => React.ReactNode;
}

type RequestState = 'idle' | 'loading' | 'success' | 'error';

const deriveSelectedChoiceId = (question: QuestionModel, state: PracticeSessionQuestionState) => {
  if (!state.selectedAnswers || state.selectedAnswers.length === 0) {
    return null;
  }

  const firstIndex = state.selectedAnswers[0] ?? null;
  if (firstIndex === null || firstIndex < 0 || firstIndex >= question.options.length) {
    return null;
  }

  return question.options[firstIndex]?.id ?? null;
};

export function PracticeClient({
  question,
  questionState,
  onRecordAnswer,
  isSaving,
  fromSample,
  onSubmitAnswer,
  onRevealAnswer,
  renderFooter,
}: PracticeClientProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    deriveSelectedChoiceId(question, questionState)
  );
  const [freeResponse, setFreeResponse] = useState('');
  const [explanation, setExplanation] = useState<ExplanationDtoShape | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RequestState>('idle');
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(questionState.isSubmitted));
  const [hasRevealed, setHasRevealed] = useState(Boolean(questionState.hasRevealedAnswer));

  const options: PracticeOption[] = useMemo(
    () =>
      question.options.map((option): PracticeOption => ({
        id: option.id,
        label: option.label,
        description: option.contentMarkdown,
      })),
    [question.options]
  );

  const hasOptions = options.length > 0;

  const correctAnswerLabel = useMemo(() => {
    return question.correctChoiceIds && question.correctChoiceIds.length > 0
      ? question.correctChoiceIds.join(', ')
      : 'Unavailable';
  }, [question.correctChoiceIds]);

  const previousQuestionIdRef = useRef(questionState.questionId);

  useEffect(() => {
    previousQuestionIdRef.current = questionState.questionId;
  }, [questionState.questionId]);

  useEffect(() => {
    if (isSyncing) {
      return;
    }

    const derived = deriveSelectedChoiceId(question, questionState);
    const hasServerSelection = Array.isArray(questionState.selectedAnswers) && questionState.selectedAnswers.length > 0;
    const sameQuestion = previousQuestionIdRef.current === questionState.questionId;

    if (derived === null && sameQuestion && !hasServerSelection && selectedChoiceId) {
      return;
    }

    setSelectedChoiceId(derived);
  }, [question, questionState, isSyncing, selectedChoiceId]);

  useEffect(() => {
    setFreeResponse('');
  }, [question.id]);

  useEffect(() => {
    setIsSubmitted(Boolean(questionState.isSubmitted));
    setHasRevealed(Boolean(questionState.hasRevealedAnswer));
  }, [questionState.questionId, questionState.isSubmitted, questionState.hasRevealedAnswer]);

  const disabled = hasOptions
    ? !selectedChoiceId || isPending
    : freeResponse.trim().length === 0 || isPending;

  const handleExplain = () => {
    const selectedIds = hasOptions
      ? selectedChoiceId
        ? [selectedChoiceId]
        : []
      : [freeResponse.trim()];

    if (selectedIds.length === 0) {
      setError('Select or enter an answer before requesting an explanation.');
      return;
    }

    setState('loading');
    setError(null);

    startTransition(() => {
      void requestExplanationAction({
        questionId: question.id,
        selectedChoiceIds: selectedIds,
      })
        .then((result) => {
          setExplanation(result.explanation as ExplanationDtoShape);
          setRateLimitRemaining(result.rateLimitRemaining ?? null);
          setState('success');
        })
        .catch((requestError: unknown) => {
          setExplanation(null);
          setRateLimitRemaining(null);
          setState('error');
          setError(requestError instanceof Error ? requestError.message : 'Failed to fetch explanation.');
        });
    });
  };

  const handleSelectionChange = (nextValue?: string) => {
    if (!hasOptions) {
      return;
    }

    setSelectedChoiceId(nextValue ?? null);

    const selectedIndex = nextValue
      ? question.options.findIndex(
          (option: QuestionModel['options'][number]) => option.id === nextValue
        )
      : -1;

    setIsSyncing(true);

    Promise.resolve(onRecordAnswer(selectedIndex >= 0 ? [selectedIndex] : []))
      .then(() => {
        setError(null);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Practice session update failed.');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const handleSubmit = () => {
    if (isSubmitted || disabled) {
      return;
    }

    setIsSubmitted(true);
    setHasRevealed(false);
    setIsSyncing(true);

    Promise.resolve(onSubmitAnswer())
      .then(() => {
        setError(null);
        return Promise.resolve(onRevealAnswer())
          .then(() => {
            setHasRevealed(true);
            setError(null);
          })
          .catch((requestError) => {
            setHasRevealed(Boolean(questionState.hasRevealedAnswer));
            setError(requestError instanceof Error ? requestError.message : 'Revealing answer failed.');
          });
      })
      .catch((requestError) => {
        setIsSubmitted(Boolean(questionState.isSubmitted));
        setHasRevealed(Boolean(questionState.hasRevealedAnswer));
        setError(requestError instanceof Error ? requestError.message : 'Submitting answer failed.');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const handleReveal = () => undefined;

  const savingIndicator =
    isSaving || isSyncing ? <span className="text-xs text-gray-500">Saving…</span> : null;

  const explanationButton = (
    <ExplainButton
      onClick={handleExplain}
      disabled={disabled}
      isLoading={isPending}
      isActive={state === 'success'}
      label="AI explanation"
      size="sm"
      aria-label="Generate answer explanation"
    />
  );

  const footerNode = renderFooter?.({
    explanationButton,
    savingIndicator,
    onSubmit: handleSubmit,
    canSubmit: !isSubmitted && !disabled,
    onReveal: handleReveal,
    canReveal: false,
    isSubmitted,
    hasRevealed,
  });

  const hasServerReveal = Boolean(questionState.hasRevealedAnswer);
  const showRevealedBanner = hasRevealed || hasServerReveal || isSubmitted;

  const revealedAnswerBanner = useMemo(() => {
    if (!showRevealedBanner) {
      return null;
    }

    const description = `Correct answer: ${correctAnswerLabel}`;

    if (questionState.isCorrect === true) {
      return {
        variant: 'success' as const,
        title: 'You answered correctly',
        description,
      };
    }

    if (questionState.isCorrect === false) {
      return {
        variant: 'warning' as const,
        title: 'Review the correct answer',
        description,
      };
    }

    return {
      variant: 'info' as const,
      title: 'Correct answer',
      description,
    };
  }, [correctAnswerLabel, questionState.isCorrect, showRevealedBanner]);

  const explanationSuccessBanner = state === 'success' && explanation
    ? {
        variant: 'info' as const,
        title: 'Explanation ready',
        description: 'Review the generated explanation below.',
      }
    : null;

  const errorBanner = error
    ? {
        variant: 'error' as const,
        title: state === 'error' ? 'Explanation request failed' : 'Practice session update failed',
        description: error,
      }
    : null;

  return (
    <Stack gap="6">
      {hasOptions ? (
        <PracticeOptionList
          options={options}
          value={selectedChoiceId ?? undefined}
          onChange={(nextValue) => {
            handleSelectionChange(nextValue);
          }}
          legend="Select one answer"
        />
      ) : (
        <PracticeFillBlank
          label="Your answer"
          value={freeResponse}
          onChange={(event) => setFreeResponse(event.target.value)}
          placeholder="Type your response"
        />
      )}

      {footerNode ?? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {explanationButton}
            <Button onClick={handleSubmit} disabled={isSubmitted || disabled}>
              Submit answer
            </Button>
          </div>
          {savingIndicator ? (
            <div className="flex justify-end text-xs text-gray-500">{savingIndicator}</div>
          ) : null}
        </div>
      )}

      {errorBanner ? (
        <PracticeQuestionStatus
          variant={errorBanner.variant}
          title={errorBanner.title}
          description={errorBanner.description}
        />
      ) : null}

      {explanationSuccessBanner ? (
        <PracticeQuestionStatus
          variant={explanationSuccessBanner.variant}
          title={explanationSuccessBanner.title}
          description={explanationSuccessBanner.description}
        />
      ) : null}

      {isSyncing && fromSample ? (
        <PracticeQuestionStatus
          variant="info"
          title="Offline cache"
          description="Changes saved locally for sample sessions."
        />
      ) : null}

      {revealedAnswerBanner ? (
        <PracticeQuestionStatus
          variant={revealedAnswerBanner.variant}
          title={revealedAnswerBanner.title}
          description={revealedAnswerBanner.description}
        />
      ) : null}

      {explanation ? (
        <PracticeExplanationCard
          summary={explanation.summary}
          confidence={explanation.confidence}
          keyPoints={explanation.keyPoints}
          steps={explanation.steps}
          footer={
            rateLimitRemaining !== null
              ? `You can request ${rateLimitRemaining} more explanations in this window.`
              : undefined
          }
        />
      ) : null}
    </Stack>
  );
}
