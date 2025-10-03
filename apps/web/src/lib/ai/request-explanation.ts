'use client';

/*
 * Fetch helpers rely on `response.json()` which is untyped at runtime. Disable unsafe-operation
 * lint rules for these controlled assignments.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import type { ExplanationDtoShape } from '@brainliest/shared';
import { SAMPLE_QUESTION } from './sample-question';

interface RequestExplanationOptions {
  questionId?: string;
  locale?: string;
  signal?: AbortSignal;
}

interface RequestExplanationResult {
  explanation: ExplanationDtoShape;
  rateLimitRemaining?: number;
}

export async function requestExplanation(
  selectedChoiceIds: string[],
  options: RequestExplanationOptions = {}
): Promise<RequestExplanationResult> {
  const questionId = options.questionId ?? SAMPLE_QUESTION.id;
  const locale = options.locale ?? 'en';

  const response = await fetch('/api/ai/explanations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'demo-user',
    },
    body: JSON.stringify({
      questionId,
      selectedChoiceIds,
      locale,
    }),
    signal: options.signal,
  });

  const data: {
    explanation?: ExplanationDtoShape;
    meta?: { rateLimitRemaining?: number };
    message?: string;
    error?: string;
  } = await response.json().catch(() => ({}));

  if (!response.ok || !data.explanation) {
    const errorMessage = data.message ?? data.error ?? 'Unable to generate explanation.';
    throw new Error(errorMessage);
  }

  return {
    explanation: data.explanation,
    rateLimitRemaining: data.meta?.rateLimitRemaining,
  };
}
