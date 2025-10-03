import 'server-only';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { drizzleClient, DrizzleSessionRepository } from '@brainliest/db';
import { mapSessionRecordToApiResponse } from '@/lib/practice/mappers';

const sessionRepository = new DrizzleSessionRepository(drizzleClient);

interface AdvancePayload {
  operation: 'advance';
  currentQuestionIndex: number;
}

interface ToggleFlagPayload {
  operation: 'toggle-flag';
  questionId: string;
  flagged: boolean;
}

interface ToggleBookmarkPayload {
  operation: 'toggle-bookmark';
  questionId: string;
  bookmarked: boolean;
}

interface UpdateTimerPayload {
  operation: 'update-timer';
  remainingSeconds: number;
}

interface RecordAnswerPayload {
  operation: 'record-answer';
  questionId: string;
  selectedAnswers: number[];
  timeSpentSeconds?: number | null;
}

type PatchPayload =
  | AdvancePayload
  | ToggleFlagPayload
  | ToggleBookmarkPayload
  | UpdateTimerPayload
  | RecordAnswerPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function parsePatchPayload(raw: unknown): PatchPayload | null {
  if (!isRecord(raw) || typeof raw.operation !== 'string') {
    return null;
  }

  switch (raw.operation) {
    case 'advance': {
      if (!('currentQuestionIndex' in raw) || typeof raw.currentQuestionIndex !== 'number') {
        return null;
      }
      return {
        operation: 'advance',
        currentQuestionIndex: raw.currentQuestionIndex,
      };
    }
    case 'toggle-flag': {
      if (typeof raw.questionId !== 'string' || typeof raw.flagged !== 'boolean') {
        return null;
      }
      return {
        operation: 'toggle-flag',
        questionId: raw.questionId,
        flagged: raw.flagged,
      };
    }
    case 'toggle-bookmark': {
      if (typeof raw.questionId !== 'string' || typeof raw.bookmarked !== 'boolean') {
        return null;
      }
      return {
        operation: 'toggle-bookmark',
        questionId: raw.questionId,
        bookmarked: raw.bookmarked,
      };
    }
    case 'update-timer': {
      if (typeof raw.remainingSeconds !== 'number') {
        return null;
      }
      return {
        operation: 'update-timer',
        remainingSeconds: raw.remainingSeconds,
      };
    }
    case 'record-answer': {
      if (typeof raw.questionId !== 'string' || !Array.isArray(raw.selectedAnswers)) {
        return null;
      }
      const selectedAnswers = raw.selectedAnswers
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
      const timeSpentSeconds =
        raw.timeSpentSeconds === null || raw.timeSpentSeconds === undefined
          ? null
          : Number(raw.timeSpentSeconds);
      return {
        operation: 'record-answer',
        questionId: raw.questionId,
        selectedAnswers,
        timeSpentSeconds: Number.isFinite(timeSpentSeconds) ? timeSpentSeconds : null,
      };
    }
    default:
      return null;
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await sessionRepository.getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      {
        error: 'SESSION_NOT_FOUND',
        message: `Practice session ${sessionId} was not found.`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(mapSessionRecordToApiResponse(session));
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;

  let payload: PatchPayload | null = null;
  try {
    payload = parsePatchPayload(await request.json());
  } catch {
    payload = null;
  }

  if (!payload) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Request body must include a valid operation field.',
      },
      { status: 400 }
    );
  }

  try {
    switch (payload.operation) {
      case 'advance': {
        await sessionRepository.advanceQuestion({
          sessionId,
          currentQuestionIndex: Math.max(0, Math.trunc(Number(payload.currentQuestionIndex))),
        });
        break;
      }
      case 'toggle-flag': {
        await sessionRepository.toggleFlag({
          sessionId,
          questionId: payload.questionId,
          flagged: Boolean(payload.flagged),
        });
        break;
      }
      case 'toggle-bookmark': {
        await sessionRepository.toggleBookmark({
          sessionId,
          questionId: payload.questionId,
          bookmarked: Boolean(payload.bookmarked),
        });
        break;
      }
      case 'update-timer': {
        await sessionRepository.updateRemainingSeconds({
          sessionId,
          remainingSeconds: Math.max(0, Math.trunc(Number(payload.remainingSeconds))),
        });
        break;
      }
      case 'record-answer': {
        await sessionRepository.recordQuestionProgress({
          sessionId,
          questionId: payload.questionId,
          selectedAnswers: payload.selectedAnswers
            .map((value) => Math.trunc(Number(value)))
            .filter((value) => Number.isFinite(value)),
          timeSpentSeconds:
            payload.timeSpentSeconds !== undefined && payload.timeSpentSeconds !== null
              ? Math.max(0, Math.trunc(Number(payload.timeSpentSeconds)))
              : null,
        });
        break;
      }
    }

    const session = await sessionRepository.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          error: 'SESSION_NOT_FOUND',
          message: `Practice session ${sessionId} was not found after update.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(mapSessionRecordToApiResponse(session));
  } catch (error) {
    console.error('[api/practice/sessions] PATCH failed', error);
    return NextResponse.json(
      {
        error: 'PRACTICE_SESSION_UPDATE_FAILED',
        message: 'Unable to update practice session.',
      },
      { status: 500 }
    );
  }
}
