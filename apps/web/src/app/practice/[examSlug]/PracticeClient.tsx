'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Button,
  Stack,
  PracticeOptionList,
  PracticeFillBlank,
  PracticeExplanationCard,
} from '@brainliest/ui';
import type { PracticeOption } from '@brainliest/ui';
import type { QuestionModel, ExplanationDtoShape } from '@brainliest/shared';
import { requestExplanationAction } from './actions';
import type { RequestExplanationActionResult } from './actions';

type RequestState = 'idle' | 'loading' | 'success' | 'error';

interface PracticeClientProps {
  question: QuestionModel;
}

export function PracticeClient({ question }: PracticeClientProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [freeResponse, setFreeResponse] = useState('');
  const [explanation, setExplanation] = useState<ExplanationDtoShape | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<RequestState>('idle');
  const [isPending, startTransition] = useTransition();

  const options: PracticeOption[] = useMemo(
    () =>
      question.options.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.contentMarkdown,
      })),
    [question.options]
  );

  const hasOptions = options.length > 0;

  const handleExplain = () => {
    const selectedIds = hasOptions ? (selectedChoiceId ? [selectedChoiceId] : []) : [freeResponse.trim()];

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
        .then((result: RequestExplanationActionResult) => {
          setExplanation(result.explanation);
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

  const disabled = hasOptions ? !selectedChoiceId || isPending : freeResponse.trim().length === 0 || isPending;

  return (
    <Stack gap={6}>
      {hasOptions ? (
        <PracticeOptionList
          options={options}
          value={selectedChoiceId}
          onChange={setSelectedChoiceId}
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
        <Button onClick={handleExplain} disabled={disabled} loading={isPending}>
          Generate explanation
        </Button>
        <p className="text-sm text-gray-500">
          {state === 'success' && rateLimitRemaining !== null
            ? `Rate limit remaining: ${rateLimitRemaining}`
            : 'Powered by the shared AI explanation service.'}
        </p>
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
