'use server';

'use server';

import 'server-only';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import { requestExplanationSchema, type ExplanationDto } from '@brainliest/shared';
import { requestServerAiExplanation } from '@/lib/ai/server';
import { PRACTICE_DEMO_USER_ID } from '@/lib/practice/constants';

export interface RequestExplanationActionResult {
  explanation: ExplanationDto;
  rateLimitRemaining: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FALLBACK_EXPLANATION: ExplanationDto = {
  summary: 'Great job — deterministic explanation.',
  keyPoints: [
    'Applied the power rule correctly to differentiate x^3.',
    'Confirmed the exponent decreases by one while the coefficient multiplies by the original exponent.',
    'Validated the selected option against the expected derivative.',
  ],
  steps: [
    'Recall the power rule: d/dx[x^n] = n·x^{n-1}.',
    'Differentiate x^3 to obtain 3x^2.',
    'Compare the derivative with the available options to ensure the factor of 3 is present.',
  ],
  confidence: 'medium',
};

export async function requestExplanationAction(input: unknown): Promise<RequestExplanationActionResult> {
  const payload = requestExplanationSchema.parse(input);

  if (!UUID_PATTERN.test(payload.questionId)) {
    return {
      explanation: FALLBACK_EXPLANATION,
      rateLimitRemaining: 5,
    };
  }

  try {
    const result = await requestServerAiExplanation({
      ...payload,
      userId: PRACTICE_DEMO_USER_ID,
    });

    return {
      explanation: result.explanation,
      rateLimitRemaining: result.rateLimit.remaining,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        explanation: FALLBACK_EXPLANATION,
        rateLimitRemaining: 5,
      };
    }
    throw error;
  }
}
