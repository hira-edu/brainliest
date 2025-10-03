import type { PracticeSessionRecord } from '@brainliest/db';
import type { ExamRecord } from '@brainliest/db';
import { mapRecordToQuestionModel } from '@/lib/ai/map-record-to-question';
import type { QuestionRecord } from '@brainliest/db';
import type {
  PracticeSessionApiResponse,
  PracticeSessionData,
  PracticeSessionApiQuestion,
  PracticeExamInfo,
  PracticeProgressInfo,
} from './types';

const DEFAULT_PRACTICE_INFO: PracticeExamInfo = {
  slug: 'sample-exam',
  title: 'A-Level Mathematics Mock Paper',
  description: 'Timed practice session covering differentiation, integration, and applied mechanics.',
  tags: ['Timed', 'STEM', 'Adaptive'],
  durationMinutes: 45,
  passingScore: '75%',
  difficultyMix: 'E • M • H',
  attemptsAllowed: 'Unlimited',
  totalQuestions: 24,
  category: {
    slug: 'academic',
    name: 'Academic',
    type: 'academic',
  },
  subcategory: {
    slug: 'algebra',
    name: 'Algebra',
  },
};

const ensureArray = <T>(value: T[] | readonly T[] | undefined): T[] => (value ? [...value] : []);

export function deriveDifficultyMix(questionRecords: QuestionRecord[]): string | undefined {
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

export function buildPracticeExamInfo(
  exam: ExamRecord | null,
  totalQuestions: number,
  questionRecords: QuestionRecord[]
): PracticeExamInfo {
  const fallback: PracticeExamInfo = {
    ...DEFAULT_PRACTICE_INFO,
    totalQuestions: totalQuestions || DEFAULT_PRACTICE_INFO.totalQuestions,
  };

  if (!exam) {
    return fallback;
  }

  const metadata = exam.metadata ?? {};

  const metadataTags = Array.isArray(metadata.tags)
    ? metadata.tags.filter((tag): tag is string => typeof tag === 'string')
    : undefined;
  const tags = metadataTags && metadataTags.length > 0 ? metadataTags : fallback.tags;
  const passingScore =
    typeof metadata.passingScore === 'string' && metadata.passingScore.trim().length > 0
      ? metadata.passingScore
      : fallback.passingScore;
  const attemptsAllowed =
    typeof metadata.attemptsAllowed === 'string' && metadata.attemptsAllowed.trim().length > 0
      ? metadata.attemptsAllowed
      : fallback.attemptsAllowed;

  const category = exam.subject?.categorySlug
    ? {
        slug: exam.subject.categorySlug,
        name: exam.subject.categoryName ?? exam.subject.categorySlug,
        type: exam.subject.categoryType ?? undefined,
      }
    : undefined;

  const subcategory = exam.subject?.subcategorySlug
    ? {
        slug: exam.subject.subcategorySlug,
        name: exam.subject.subcategoryName ?? exam.subject.subcategorySlug,
      }
    : undefined;

  const examInfo: PracticeExamInfo = {
    slug: exam.slug,
    title: exam.title,
    description: exam.description ?? fallback.description,
    tags,
    durationMinutes: exam.durationMinutes ?? fallback.durationMinutes,
    passingScore,
    difficultyMix: deriveDifficultyMix(questionRecords) ?? fallback.difficultyMix,
    attemptsAllowed,
    totalQuestions:
      totalQuestions > 0
        ? totalQuestions
        : exam.questionTarget && exam.questionTarget > 0
        ? exam.questionTarget
        : fallback.totalQuestions,
    category,
    subcategory,
  };

  return examInfo;
}

export function buildPracticeProgress(
  exam: PracticeExamInfo,
  currentIndex: number,
  totalQuestions: number,
  remainingSeconds?: number | null
): PracticeProgressInfo {
  const durationSeconds = (exam.durationMinutes ?? 0) * 60;
  const fallbackRemaining = durationSeconds > 0 ? durationSeconds : undefined;
  const resolvedRemaining = typeof remainingSeconds === 'number' ? Math.max(0, remainingSeconds) : fallbackRemaining;

  return {
    questionIndex: currentIndex,
    totalQuestions,
    timeRemainingSeconds: resolvedRemaining,
  };
}

export function mapSessionRecordToApiResponse(record: PracticeSessionRecord): PracticeSessionApiResponse {
  const flaggedSet = new Set(record.metadata.flaggedQuestionIds);
  const bookmarkedSet = new Set(record.metadata.bookmarkedQuestionIds ?? []);
  const submittedSet = new Set(record.metadata.submittedQuestionIds ?? []);
  const revealedSet = new Set(record.metadata.revealedQuestionIds ?? []);
  const questions: PracticeSessionApiQuestion[] = record.questions
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((item) => ({
      questionId: item.questionId,
      orderIndex: item.orderIndex,
      selectedAnswers: ensureArray(item.selectedAnswers),
      isFlagged: flaggedSet.has(item.questionId),
      isBookmarked: bookmarkedSet.has(item.questionId),
      timeSpentSeconds: item.timeSpentSeconds ?? null,
      isSubmitted: submittedSet.has(item.questionId),
      hasRevealedAnswer: revealedSet.has(item.questionId),
      isCorrect: item.isCorrect ?? null,
      question: mapRecordToQuestionModel(item.question),
    }));

  const examInfo = buildPracticeExamInfo(record.exam, questions.length, record.questions.map((item) => item.question));
  const boundedIndex = Math.max(0, Math.min(record.metadata.currentQuestionIndex, Math.max(questions.length - 1, 0)));

  return {
    session: {
      id: record.id,
      status: record.status,
      currentQuestionIndex: boundedIndex,
      totalQuestions: questions.length,
      remainingSeconds: record.metadata.remainingSeconds ?? null,
      flaggedQuestionIds: [...flaggedSet],
      bookmarkedQuestionIds: [...bookmarkedSet],
      submittedQuestionIds: [...submittedSet],
      revealedQuestionIds: [...revealedSet],
    },
    exam: examInfo,
    questions,
  };
}

export function mapApiResponseToPracticeSessionData(
  response: PracticeSessionApiResponse
): PracticeSessionData {
  const { session, exam, questions } = response;
  if (questions.length === 0) {
    throw new Error('Practice session response is missing questions.');
  }

  const boundedIndex = Math.max(0, Math.min(session.currentQuestionIndex, questions.length - 1));
  const activeQuestion = questions[boundedIndex];

  if (!activeQuestion) {
    throw new Error('Unable to resolve active practice question.');
  }

  const progress = buildPracticeProgress(exam, boundedIndex + 1, session.totalQuestions, session.remainingSeconds);

  return {
    sessionId: session.id,
    sessionStatus: session.status,
    exam,
    questions,
    currentQuestionIndex: boundedIndex,
    question: activeQuestion.question,
    questionState: {
      questionId: activeQuestion.questionId,
      orderIndex: activeQuestion.orderIndex,
      selectedAnswers: ensureArray(activeQuestion.selectedAnswers),
      isFlagged: activeQuestion.isFlagged,
      isBookmarked: activeQuestion.isBookmarked,
      isSubmitted: activeQuestion.isSubmitted ?? false,
      hasRevealedAnswer: activeQuestion.hasRevealedAnswer ?? false,
      isCorrect: activeQuestion.isCorrect ?? null,
      timeSpentSeconds: activeQuestion.timeSpentSeconds,
    },
    progress,
    flaggedQuestionIds: [...session.flaggedQuestionIds],
    bookmarkedQuestionIds: [...session.bookmarkedQuestionIds],
    submittedQuestionIds: [...(session.submittedQuestionIds ?? [])],
    revealedQuestionIds: [...(session.revealedQuestionIds ?? [])],
    fromSample: false,
  };
}
