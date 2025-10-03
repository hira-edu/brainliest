'use server';

'use server';

import 'server-only';

import { requestExplanationSchema, type ExplanationDto } from '@brainliest/shared';
import { requestServerAiExplanation } from '@/lib/ai/server';

export interface RequestExplanationActionResult {
  explanation: ExplanationDto;
  rateLimitRemaining: number;
}

export async function requestExplanationAction(input: unknown): Promise<RequestExplanationActionResult> {
  const payload = requestExplanationSchema.parse(input);

  const result = await requestServerAiExplanation({
    ...payload,
    userId: 'demo-user',
  });

  return {
    explanation: result.explanation,
    rateLimitRemaining: result.rateLimit.remaining,
  };
}
