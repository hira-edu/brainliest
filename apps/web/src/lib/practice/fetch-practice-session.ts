import 'server-only';

/*
 * Next.js lint lacks project-aware type information for workspace imports, which triggers
 * false-positive `no-unsafe-*` diagnostics when using Drizzle repositories. Disable them locally.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import { drizzleClient, createRepositories } from '@brainliest/db';
import { mapRecordToQuestionModel } from '@/lib/ai/map-record-to-question';
import { SAMPLE_QUESTION } from '@/lib/ai/sample-question';
import { PRACTICE_DEMO_USER_ID } from '@/lib/practice/constants';
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
      'x-user-id': PRACTICE_DEMO_USER_ID,
    },
    cache: 'no-store',
    body: JSON.stringify({ examSlug, userId: PRACTICE_DEMO_USER_ID }),
  });

  if (!response.ok) {
    throw new Error(`Practice session API returned ${response.status}`);
  }

  const payload = (await response.json()) as PracticeSessionApiResponse;
  return mapApiResponseToPracticeSessionData(payload);
}

export async function buildSampleSession(examSlug: string): Promise<PracticeSessionData> {
  const repositories = createRepositories(drizzleClient);
  const examRecord = await repositories.exams.findBySlug(examSlug);
  const questionPage = await repositories.questions.findByExam(examSlug, {}, 1, 10);
  const questionRecords = questionPage.data;
  const questionModels = questionRecords.length > 0
    ? questionRecords.map((item) => mapRecordToQuestionModel(item))
    : [SAMPLE_QUESTION];

  const questions: PracticeSessionData['questions'] = questionModels.map((model, index) => ({
    questionId: model.id,
    orderIndex: index,
    selectedAnswers: [],
    isFlagged: false,
    isBookmarked: false,
    isSubmitted: false,
    hasRevealedAnswer: false,
    isCorrect: null,
    timeSpentSeconds: 0,
    question: model,
  }));

  const minimumQuestions = Math.max(questions.length, 1);
  while (questions.length < minimumQuestions) {
    const base = questions[0]?.question ?? SAMPLE_QUESTION;
    const suffix = `-sample-${questions.length + 1}`;
    const syntheticQuestion = {
      ...base,
      id: `${base.id}${suffix}` as typeof base.id,
      stemMarkdown: `${base.stemMarkdown} (practice sample ${questions.length + 1})`,
      options: base.options.map((option) => ({
        ...option,
        id: `${option.id}${suffix}`,
      })),
      correctChoiceIds: base.correctChoiceIds.map((choiceId) => `${choiceId}${suffix}`),
    };

    questions.push({
      questionId: syntheticQuestion.id,
      orderIndex: questions.length,
      selectedAnswers: [],
      isFlagged: false,
      isBookmarked: false,
      isSubmitted: false,
      hasRevealedAnswer: false,
      isCorrect: null,
      timeSpentSeconds: 0,
      question: syntheticQuestion,
    });
  }

  const totalQuestions = questions.length;
  const difficultyMix = deriveDifficultyMix(questionRecords);

  const examInfo = buildPracticeExamInfo(
    examRecord,
    totalQuestions,
    questionRecords
  );

  if (difficultyMix) {
    examInfo.difficultyMix = difficultyMix;
  }

  const question = questions[0]?.question ?? SAMPLE_QUESTION;

  const progress = buildPracticeProgress(
    examInfo,
    1,
    examInfo.totalQuestions,
    examInfo.durationMinutes ? examInfo.durationMinutes * 60 : undefined
  );

  return {
    sessionId: 'sample-session',
    sessionStatus: 'in_progress',
    exam: examInfo,
    questions,
    currentQuestionIndex: 0,
    question,
    questionState: {
      questionId: questions[0]?.questionId ?? SAMPLE_QUESTION.id,
      orderIndex: 0,
      selectedAnswers: [],
      isFlagged: false,
      isBookmarked: false,
      isSubmitted: false,
      hasRevealedAnswer: false,
      isCorrect: null,
      timeSpentSeconds: 0,
    },
    progress,
    flaggedQuestionIds: [],
    bookmarkedQuestionIds: [],
    submittedQuestionIds: [],
    revealedQuestionIds: [],
    fromSample: true,
  };
}

export async function fetchPracticeSession(examSlug: string): Promise<PracticeSessionData> {
  try {
    return await fetchSessionFromApi(examSlug);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[practice] falling back to sample data', error);
    }
    return buildSampleSession(examSlug);
  }
}

export async function fetchPracticeSessionById(sessionId: string): Promise<PracticeSessionData> {
  const response = await fetch(`${PRACTICE_API_BASE_URL}/api/practice/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': PRACTICE_DEMO_USER_ID,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Practice session ${sessionId} not found`);
  }

  const payload = (await response.json()) as PracticeSessionApiResponse;
  return mapApiResponseToPracticeSessionData(payload);
}
