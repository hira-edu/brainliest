'use client';

/*
 * Next.js lint runs without project-aware typing for workspace imports, so we disable the unsafe operation
 * rules triggered when consuming shared types in this client module.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import { useMemo, useState, useTransition } from 'react';
import {
  Button,
  Stack,
  PracticeOptionList,
  PracticeFillBlank,
  PracticeExplanationCard,
  Badge,
} from '@brainliest/ui';
import type { PracticeOption } from '@brainliest/ui';
import type { QuestionModel } from '@brainliest/shared';
import type { ExplanationDtoShape } from '@brainliest/shared';
import type {
  PracticeSessionApiResponse,
  PracticeSessionQuestionState,
} from '@/lib/practice/types';
import { requestExplanationAction } from './actions';

interface PracticeClientProps {
  sessionId: string;
  question: QuestionModel;
  questionState: PracticeSessionQuestionState;
}

type RequestState = 'idle' | 'loading' | 'success' | 'error';

type PatchPayload =
  | {
      operation: 'toggle-flag';
      questionId: string;
      flagged: boolean;
    }
  | {
      operation: 'record-answer';
      questionId: string;
      selectedAnswers: number[];
      timeSpentSeconds?: number | null;
    };

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

export function PracticeClient({ sessionId, question, questionState }: PracticeClientProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    deriveSelectedChoiceId(question, questionState)
  );
  const [freeResponse, setFreeResponse] = useState('');
  const [explanation, setExplanation] = useState<ExplanationDtoShape | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RequestState>('idle');
  const [isPending, startTransition] = useTransition();
  const [isFlagged, setIsFlagged] = useState(questionState.isFlagged);
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

  const patchSession = async (payload: PatchPayload) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/practice/sessions/${sessionId}`, {
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
      const updatedQuestion = data.questions.find((item) => item.questionId === question.id);
      if (updatedQuestion) {
        const nextState: PracticeSessionQuestionState = {
          questionId: updatedQuestion.questionId,
          orderIndex: updatedQuestion.orderIndex,
          selectedAnswers: [...updatedQuestion.selectedAnswers],
          isFlagged: updatedQuestion.isFlagged,
          timeSpentSeconds: updatedQuestion.timeSpentSeconds ?? 0,
        };
        setSelectedChoiceId(deriveSelectedChoiceId(question, nextState));
        setIsFlagged(nextState.isFlagged);
      } else {
        setIsFlagged(data.session.flaggedQuestionIds.includes(question.id));
      }
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Practice session update failed.');
    } finally {
      setIsSyncing(false);
    }
  };

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

    if (selectedIndex >= 0) {
      void patchSession({
        operation: 'record-answer',
        questionId: question.id,
        selectedAnswers: [selectedIndex],
      });
    } else {
      void patchSession({
        operation: 'record-answer',
        questionId: question.id,
        selectedAnswers: [],
      });
    }
  };

  const disabled = hasOptions ? !selectedChoiceId || isPending : freeResponse.trim().length === 0 || isPending;

  return (
    <Stack gap={6}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-600">
          {isFlagged ? 'This question is flagged for review.' : 'Review the prompt and select your answer.'}
        </span>
        <Button
          variant={isFlagged ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            void patchSession({
              operation: 'toggle-flag',
              questionId: question.id,
              flagged: !isFlagged,
            });
          }}
          disabled={isSyncing}
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
        {isSyncing && <Badge variant="secondary">Saving…</Badge>}
      </div>

      {state === 'error' && error ? <p className="text-sm text-error-600">{error}</p> : null}

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
