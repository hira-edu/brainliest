/*
 * Without project-aware type resolution, Next.js lint reports false-positive unsafe operations
 * for zod helpers imported via workspace packages. Disable those rules for this route.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { invalidateCategory, invalidateExam } from '@brainliest/shared';

const invalidateSchema = z.object({
  type: z.enum(['exam', 'category']),
  identifier: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = invalidateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Request body does not match schema',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, identifier } = parsed.data;

  try {
    if (type === 'exam') {
      await invalidateExam(identifier);
    } else {
      await invalidateCategory(identifier);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
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
