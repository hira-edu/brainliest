import 'server-only';

/*
 * Next.js lint lacks project-aware type information for workspace imports, which triggers
 * false-positive `no-unsafe-*` diagnostics when using Drizzle repositories. Disable them locally.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import {
  drizzleClient,
  createRepositories,
  type ExamSlug,
} from '@brainliest/db';
import { mapRecordToQuestionModel } from '@/lib/ai/map-record-to-question';
import { SAMPLE_QUESTION } from '@/lib/ai/sample-question';
import type { PracticeSessionData, PracticeSessionApiResponse } from './types';
import { buildPracticeExamInfo, buildPracticeProgress, deriveDifficultyMix, mapApiResponseToPracticeSessionData } from './mappers';

const resolveBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_WEB_BASE_URL ?? process.env.WEB_BASE_URL;
  if (explicit) {
    return explicit;
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }
  return 'http://localhost:3000';
};

const PRACTICE_API_BASE_URL = resolveBaseUrl();

async function fetchSessionFromApi(examSlug: string): Promise<PracticeSessionData> {
  const response = await fetch(`${PRACTICE_API_BASE_URL}/api/practice/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'demo-user',
    },
    cache: 'no-store',
    body: JSON.stringify({ examSlug, userId: 'demo-user' }),
  });

  if (!response.ok) {
    throw new Error(`Practice session API returned ${response.status}`);
  }

  const payload = (await response.json()) as PracticeSessionApiResponse;
  return mapApiResponseToPracticeSessionData(payload);
}

async function buildFallbackSession(examSlug: string): Promise<PracticeSessionData> {
  const repositories = createRepositories(drizzleClient);
  const examRecord = await repositories.exams.findBySlug(examSlug as ExamSlug);
  const questionPage = await repositories.questions.findByExam(examSlug as ExamSlug, {}, 1, 1);

  const totalQuestions = questionPage.pagination.totalCount;
  const difficultyMix = deriveDifficultyMix(questionPage.data);

  const examInfo = buildPracticeExamInfo(
    examRecord,
    totalQuestions,
    questionPage.data
  );

  if (difficultyMix) {
    examInfo.difficultyMix = difficultyMix;
  }

  const record = questionPage.data[0];
  const question = record ? mapRecordToQuestionModel(record) : SAMPLE_QUESTION;

  const progress = buildPracticeProgress(examInfo, 1, examInfo.totalQuestions, examInfo.durationMinutes ? examInfo.durationMinutes * 60 : undefined);

  return {
    sessionId: 'sample-session',
    exam: examInfo,
    question,
    questionState: {
      questionId: record?.id ?? SAMPLE_QUESTION.id,
      orderIndex: 0,
      selectedAnswers: [],
      isFlagged: false,
      timeSpentSeconds: 0,
    },
    progress,
    fromSample: !record,
  };
}

export async function fetchPracticeSession(examSlug: string): Promise<PracticeSessionData> {
  try {
    return await fetchSessionFromApi(examSlug);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[practice] falling back to sample data', error);
    }
    return buildFallbackSession(examSlug);
  }
}
