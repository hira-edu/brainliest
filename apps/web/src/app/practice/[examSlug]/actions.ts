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

export async function requestExplanationAction(input: unknown): Promise<RequestExplanationActionResult> {
  const payload = requestExplanationSchema.parse(input);

  const result = await requestServerAiExplanation({
    ...payload,
    userId: PRACTICE_DEMO_USER_ID,
  });

  return {
    explanation: result.explanation,
    rateLimitRemaining: result.rateLimit.remaining,
  };
}
