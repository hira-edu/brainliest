/*
 * Without project-aware type resolution, Next.js lint reports false-positive unsafe operations
 * for zod helpers imported via workspace packages. Disable those rules for this route.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { invalidateCategory, invalidateExam } from '@brainliest/shared';

import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

type InvalidatePayload = {
  readonly type: 'exam' | 'category';
  readonly identifier: string;
};

function isInvalidatePayload(value: unknown): value is InvalidatePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.type === 'exam' || candidate.type === 'category') &&
    typeof candidate.identifier === 'string' &&
    candidate.identifier.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminActor();

    const json = await request.json().catch(() => null);
    if (!isInvalidatePayload(json)) {
      return NextResponse.json(
        {
          error: 'INVALID_PAYLOAD',
          message: 'Request body does not match schema',
        },
        { status: 400 }
      );
    }

    const { type, identifier } = json;

    if (type === 'exam') {
      await invalidateExam(identifier);
    } else {
      await invalidateCategory(identifier);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/cache/invalidate] unexpected error', error);
    return NextResponse.json(
      {
        error: 'CACHE_INVALIDATION_FAILED',
        message: 'Unable to invalidate cache entry',
      },
      { status: 500 }
    );
  }
}
