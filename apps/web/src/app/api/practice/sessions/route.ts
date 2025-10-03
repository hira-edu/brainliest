import 'server-only';

import { NextResponse } from 'next/server';
import { drizzleClient, DrizzleSessionRepository } from '@brainliest/db';
import { mapSessionRecordToApiResponse } from '@/lib/practice/mappers';

const sessionRepository = new DrizzleSessionRepository(drizzleClient);

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const examSlug = typeof (body as Record<string, unknown> | null)?.examSlug === 'string'
    ? ((body as Record<string, unknown>).examSlug as string)
    : null;
  const userId = typeof (body as Record<string, unknown> | null)?.userId === 'string'
    ? ((body as Record<string, unknown>).userId as string)
    : 'demo-user';

  if (!examSlug) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'examSlug is required to start a practice session.',
      },
      { status: 400 }
    );
  }

  try {
    const sessionRecord = await sessionRepository.startSession({
      examSlug,
      userId,
    });

    return NextResponse.json(mapSessionRecordToApiResponse(sessionRecord), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('No questions found')) {
      return NextResponse.json(
        {
          error: 'NO_QUESTIONS_FOR_EXAM',
          message: error.message,
        },
        { status: 404 }
      );
    }

    console.error('[api/practice/sessions] failed to start session', error);
    return NextResponse.json(
      {
        error: 'PRACTICE_SESSION_START_FAILED',
        message: 'Unable to initialise practice session.',
      },
      { status: 500 }
    );
  }
}
