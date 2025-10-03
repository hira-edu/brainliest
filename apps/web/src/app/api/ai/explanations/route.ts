/*
 * Next.js lint runs without project-aware type information for workspace packages, which
 * causes false-positive `no-unsafe-*` diagnostics on zod helpers sourced from @brainliest/shared.
 * Safe parses are still guarded via schema validation, so we locally disable those rules.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requestExplanationSchema } from '@brainliest/shared';
import {
  AiExplanationDependencyError,
  AiExplanationQuestionNotFoundError,
  AiExplanationRateLimitError,
  requestAiExplanation,
} from '@brainliest/shared';
import { ensureAiExplanationBootstrap } from '@/lib/ai';

ensureAiExplanationBootstrap();

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const payloadResult = requestExplanationSchema.safeParse(body);

  if (!payloadResult.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Request body does not match schema',
        details: payloadResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const userId = request.headers.get('x-user-id') ?? 'anonymous';
  const rateLimitIdentifier =
    request.headers.get('x-rate-limit-id') ?? userId ?? request.ip ?? 'anonymous';

  try {
    const { explanation, rateLimit } = await requestAiExplanation({
      questionId: payloadResult.data.questionId,
      selectedChoiceIds: payloadResult.data.selectedChoiceIds,
      locale: payloadResult.data.locale,
      userId,
      rateLimitIdentifier,
    });

    return NextResponse.json({
      explanation,
      meta: {
        rateLimitRemaining: rateLimit.remaining,
      },
    });
  } catch (error) {
    if (error instanceof AiExplanationRateLimitError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          remaining: error.remaining,
        },
        { status: 429 }
      );
    }

    if (error instanceof AiExplanationQuestionNotFoundError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error instanceof AiExplanationDependencyError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.error('[api/ai/explanations] unexpected error', error);
    return NextResponse.json(
      {
        error: 'AI_EXPLANATION_UNKNOWN',
        message: 'Failed to generate explanation',
      },
      { status: 500 }
    );
  }
}
