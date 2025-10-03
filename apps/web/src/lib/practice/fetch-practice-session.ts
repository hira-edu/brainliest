import 'server-only';

/*
 * Next.js lint lacks project-aware type information for workspace imports, which triggers
 * false-positive `no-unsafe-*` diagnostics when using Drizzle repositories. Disable them locally.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

import type { QuestionModel } from '@brainliest/shared';
import {
  drizzleClient,
  createRepositories,
  type ExamSlug,
  type QuestionRecord,
  type ExamRecord,
} from '@brainliest/db';
import { mapRecordToQuestionModel } from '@/lib/ai/map-record-to-question';
import { SAMPLE_QUESTION } from '@/lib/ai/sample-question';

interface PracticeExamInfo {
  title: string;
  description?: string;
  tags: string[];
  durationMinutes?: number;
  passingScore?: string;
  difficultyMix?: string;
  attemptsAllowed?: string;
  totalQuestions: number;
}

interface PracticeProgressInfo {
  questionIndex: number;
  totalQuestions: number;
  timeRemainingSeconds?: number;
}

export interface PracticeSessionData {
  exam: PracticeExamInfo;
  question: QuestionModel;
  progress: PracticeProgressInfo;
  fromSample: boolean;
}

function buildExamInfo(exam: ExamRecord | null, totalQuestions: number): PracticeExamInfo {
  const defaultInfo: PracticeExamInfo = {
    title: 'A-Level Mathematics Mock Paper',
    description:
      'Timed practice session covering differentiation, integration, and applied mechanics.',
    tags: ['Timed', 'STEM', 'Adaptive'],
    durationMinutes: 45,
    passingScore: '75%',
    difficultyMix: 'E • M • H',
    attemptsAllowed: 'Unlimited',
    totalQuestions: totalQuestions || 24,
  };

  if (!exam) {
    return defaultInfo;
  }

  return {
    title: exam.title,
    description: exam.description ?? defaultInfo.description,
    tags: (exam.metadata?.tags as string[] | undefined) ?? defaultInfo.tags,
    durationMinutes: exam.durationMinutes ?? defaultInfo.durationMinutes,
    passingScore: exam.metadata?.passingScore as string | undefined ?? defaultInfo.passingScore,
    difficultyMix: exam.metadata?.difficultyMix as string | undefined ?? defaultInfo.difficultyMix,
    attemptsAllowed:
      exam.metadata?.attemptsAllowed as string | undefined ?? defaultInfo.attemptsAllowed,
    totalQuestions: totalQuestions || (exam.questionTarget ?? defaultInfo.totalQuestions),
  };
}

function deriveDifficultyMix(questionRecords: QuestionRecord[]): string | undefined {
  if (questionRecords.length === 0) {
    return undefined;
  }

  const counts = questionRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.difficulty] = (acc[record.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  const ordered = ['EASY', 'MEDIUM', 'HARD', 'EXPERT']
    .filter((key) => counts[key])
    .map((key) => key[0]);

  return ordered.length > 0 ? ordered.join(' • ') : undefined;
}

function buildProgress(
  exam: PracticeExamInfo,
  questionIndex: number,
  totalQuestions: number
): PracticeProgressInfo {
  const durationSeconds = (exam.durationMinutes ?? 0) * 60;
  return {
    questionIndex,
    totalQuestions,
    timeRemainingSeconds: durationSeconds > 0 ? durationSeconds : undefined,
  };
}

export async function fetchPracticeSession(examSlug: string): Promise<PracticeSessionData> {
  const fallback: PracticeSessionData = {
    exam: buildExamInfo(null, 24),
    question: SAMPLE_QUESTION,
    progress: {
      questionIndex: 1,
      totalQuestions: 24,
      timeRemainingSeconds: 45 * 60,
    },
    fromSample: true,
  };

  try {
    const repositories = createRepositories(drizzleClient);
    const examRecord = await repositories.exams.findBySlug(examSlug as ExamSlug);
    const questionPage = await repositories.questions.findByExam(
      examSlug as ExamSlug,
      {},
      1,
      1
    );

    const totalQuestions = questionPage.pagination.totalCount;
    const difficultyMix = deriveDifficultyMix(questionPage.data);

    const examInfo = buildExamInfo(
      examRecord,
      totalQuestions || fallback.exam.totalQuestions
    );

    if (difficultyMix) {
      examInfo.difficultyMix = difficultyMix;
    }

    const record = questionPage.data[0];
    const question = record ? mapRecordToQuestionModel(record) : SAMPLE_QUESTION;

    const progress = buildProgress(examInfo, 1, examInfo.totalQuestions);

    return {
      exam: examInfo,
      question,
      progress,
      fromSample: !record,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[practice] falling back to sample data', error);
      return fallback;
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to load practice session data.');
  }
}
