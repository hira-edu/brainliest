'use client';

/*
 * Next.js lint runs without project-aware typing for workspace imports, so we disable the unsafe operation
 * rules triggered when consuming shared types in this client module.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button, Stack, PracticeOptionList, PracticeFillBlank, PracticeExplanationCard } from '@brainliest/ui';
import type { PracticeOption } from '@brainliest/ui';
import type { QuestionModel } from '@brainliest/shared';
import type { ExplanationDtoShape } from '@brainliest/shared';
import type { PracticeSessionQuestionState } from '@/lib/practice/types';
import { requestExplanationAction } from './actions';

interface PracticeClientProps {
  question: QuestionModel;
  questionState: PracticeSessionQuestionState;
  isFlagged: boolean;
  onToggleFlag: (next: boolean) => Promise<void> | void;
  onRecordAnswer: (selected: number[]) => Promise<void> | void;
  isSaving: boolean;
  fromSample: boolean;
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
  isFlagged,
  onToggleFlag,
  onRecordAnswer,
  isSaving,
  fromSample,
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

  useEffect(() => {
    setSelectedChoiceId(deriveSelectedChoiceId(question, questionState));
  }, [question, questionState]);

  useEffect(() => {
    setFreeResponse('');
  }, [question.id]);

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

  const disabled = hasOptions
    ? !selectedChoiceId || isPending
    : freeResponse.trim().length === 0 || isPending;

  return (
    <Stack gap="6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-600">
          {isFlagged ? 'This question is flagged for review.' : 'Review the prompt and select your answer.'}
        </span>
        <Button
          variant={isFlagged ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            setIsSyncing(true);
            Promise.resolve(onToggleFlag(!isFlagged))
              .then(() => {
                setError(null);
              })
              .catch((requestError) => {
                setError(requestError instanceof Error ? requestError.message : 'Practice session update failed.');
              })
              .finally(() => {
                setIsSyncing(false);
              });
          }}
          disabled={isSyncing || isSaving}
        >
          {isFlagged ? 'Remove flag' : 'Flag question'}
        </Button>
      </div>

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

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleExplain} disabled={disabled} isLoading={isPending}>
          Generate explanation
        </Button>
        <p className="text-sm text-gray-500">
          {state === 'success' && rateLimitRemaining !== null
            ? `Rate limit remaining: ${rateLimitRemaining}`
            : 'Powered by the shared AI explanation service.'}
        </p>
        {isSaving || isSyncing ? <span className="text-xs text-gray-500">Saving…</span> : null}
      </div>

      {state === 'error' && error ? <p className="text-sm text-error-600">{error}</p> : null}
      {isSyncing && fromSample ? (
        <p className="text-xs text-gray-500">Changes saved locally for sample sessions.</p>
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
