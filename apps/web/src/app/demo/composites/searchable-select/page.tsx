'use client';

/*
 * Next.js lint runs without project-aware type information for workspace packages, which
 * can surface false-positive `no-unsafe-*` diagnostics on shared types. Disable the rules locally.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-redundant-type-constituents */

import { useState } from 'react';
import { SearchableSelect, Card, Stack, Badge } from '@brainliest/ui';
import type { ExplanationDtoShape } from '@brainliest/shared';
import { SAMPLE_CHOICES, SAMPLE_QUESTION } from '@/lib/ai/sample-question';
import { requestExplanation } from '@/lib/ai/request-explanation';

type RequestState = 'idle' | 'loading' | 'success' | 'error';

export default function SearchableSelectDemo() {
  const [value, setValue] = useState<string | undefined>();
  const [explanation, setExplanation] = useState<ExplanationDtoShape | null>(null);
  const [state, setState] = useState<RequestState>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedChoice = SAMPLE_CHOICES.find((choice) => choice.value === value);

  const handleChange = async (nextValue?: string) => {
    setValue(nextValue);
    setError(null);

    if (!nextValue) {
      setExplanation(null);
      setState('idle');
      return;
    }

    setState('loading');
    try {
      const result = await requestExplanation([nextValue]);
      setExplanation(result.explanation);
      setState('success');
    } catch (requestError) {
      setExplanation(null);
      setState('error');
      setError(requestError instanceof Error ? requestError.message : 'Failed to load explanation');
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Searchable Select</h1>
      <p className="text-gray-600">
        Pick an answer choice to request a live AI explanation from the new `/api/ai/explanations` endpoint.
      </p>

      <Card padding="lg">
        <Stack gap={3}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Practice question</h2>
            <p className="mt-1 text-gray-600">{SAMPLE_QUESTION.stemMarkdown}</p>
          </div>

          <SearchableSelect
            options={SAMPLE_CHOICES}
            value={value}
            onChange={(nextValue) => {
              void handleChange(nextValue);
            }}
            placeholder="Select an answer choice"
          />

          <p className="text-sm text-gray-500">
            Selected choice: {selectedChoice ? selectedChoice.label : 'None selected'}
          </p>

          {state === 'loading' && <p className="text-sm text-slate-500">Requesting explanation…</p>}
          {state === 'error' && error ? <p className="text-sm text-error-600">{error}</p> : null}

          {explanation && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">AI explanation</h3>
                <Badge variant={explanation.confidence === 'high' ? 'success' : 'default'}>
                  Confidence: {explanation.confidence}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-gray-700">{explanation.summary}</p>

              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key points</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {explanation.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps</h4>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                  {explanation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </Stack>
      </Card>
    </div>
  );
}
