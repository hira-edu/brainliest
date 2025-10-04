import type { PracticeSessionData } from './types';

const STORAGE_PREFIX = 'brainliest:practice:sample';
const STORAGE_VERSION = 1;

type SampleQuestionSnapshot = {
  selectedAnswers: number[];
  isFlagged: boolean;
  isBookmarked: boolean;
  isSubmitted: boolean;
  hasRevealedAnswer: boolean;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
};

type SampleSessionState = {
  sessionStatus: PracticeSessionData['sessionStatus'];
  currentQuestionIndex: number;
  flaggedQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  submittedQuestionIds: string[];
  revealedQuestionIds: string[];
  timeRemainingSeconds: number | null;
  questionStates: Record<string, SampleQuestionSnapshot>;
};

interface SampleSessionSnapshot {
  version: number;
  updatedAt: number;
  data: SampleSessionState;
}

const getStorageKey = (examSlug: string): string => `${STORAGE_PREFIX}:${examSlug}`;

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normaliseIdList = (ids: string[]): string[] => Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0)));

const clampIndex = (index: number, total: number): number => {
  if (Number.isNaN(index)) {
    return 0;
  }

  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
};

const toQuestionSnapshot = (question: PracticeSessionData['questions'][number]): SampleQuestionSnapshot => ({
  selectedAnswers: [...(question.selectedAnswers ?? [])],
  isFlagged: Boolean(question.isFlagged),
  isBookmarked: Boolean(question.isBookmarked),
  isSubmitted: Boolean(question.isSubmitted),
  hasRevealedAnswer: Boolean(question.hasRevealedAnswer),
  isCorrect: question.isCorrect ?? null,
  timeSpentSeconds:
    typeof question.timeSpentSeconds === 'number'
      ? question.timeSpentSeconds
      : question.timeSpentSeconds === null
      ? null
      : 0,
});

const buildSnapshot = (
  session: PracticeSessionData,
  overrideRemainingSeconds: number | null | undefined
): SampleSessionSnapshot => {
  const questionStates = session.questions.reduce<Record<string, SampleQuestionSnapshot>>((acc, question) => {
    acc[question.questionId] = toQuestionSnapshot(question);
    return acc;
  }, {});

  const timeRemainingSeconds =
    typeof overrideRemainingSeconds === 'number'
      ? Math.max(0, Math.floor(overrideRemainingSeconds))
      : session.progress.timeRemainingSeconds ?? null;

  return {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    data: {
      sessionStatus: session.sessionStatus,
      currentQuestionIndex: session.currentQuestionIndex,
      flaggedQuestionIds: normaliseIdList(session.flaggedQuestionIds),
      bookmarkedQuestionIds: normaliseIdList(session.bookmarkedQuestionIds),
      submittedQuestionIds: normaliseIdList(session.submittedQuestionIds),
      revealedQuestionIds: normaliseIdList(session.revealedQuestionIds),
      timeRemainingSeconds,
      questionStates,
    },
  };
};

const deriveRemainingSeconds = (
  fallback: number | null | undefined,
  snapshot: SampleSessionSnapshot
): number | null => {
  const stored = snapshot.data.timeRemainingSeconds;
  if (stored === null || stored === undefined) {
    return fallback ?? null;
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - snapshot.updatedAt) / 1000));
  const next = Math.max(0, stored - elapsed);
  if (!Number.isFinite(next)) {
    return fallback ?? null;
  }

  return next;
};

export const loadSampleSessionSnapshot = (examSlug: string): SampleSessionSnapshot | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(examSlug));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SampleSessionSnapshot | null;
    if (!parsed || typeof parsed.version !== 'number' || parsed.version !== STORAGE_VERSION) {
      return null;
    }

    if (typeof parsed.updatedAt !== 'number' || parsed.updatedAt <= 0) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[practice] unable to read sample session snapshot', error);
    return null;
  }
};

export const persistSampleSessionState = (
  examSlug: string,
  session: PracticeSessionData,
  overrideRemainingSeconds?: number | null
): void => {
  if (!isBrowser() || !session.fromSample) {
    return;
  }

  try {
    const snapshot = buildSnapshot(session, overrideRemainingSeconds ?? null);
    window.localStorage.setItem(getStorageKey(examSlug), JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[practice] unable to persist sample session snapshot', error);
  }
};

export const clearSampleSessionState = (examSlug: string): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(getStorageKey(examSlug));
  } catch (error) {
    console.warn('[practice] unable to clear sample session snapshot', error);
  }
};

export const mergeSampleSessionWithSnapshot = (
  base: PracticeSessionData,
  snapshot: SampleSessionSnapshot
): PracticeSessionData => {
  const totalQuestions = base.questions.length;
  const resolvedIndex = clampIndex(snapshot.data.currentQuestionIndex, totalQuestions);

  const flaggedSet = new Set(normaliseIdList(snapshot.data.flaggedQuestionIds));
  const bookmarkedSet = new Set(normaliseIdList(snapshot.data.bookmarkedQuestionIds));
  const submittedSet = new Set(normaliseIdList(snapshot.data.submittedQuestionIds));
  const revealedSet = new Set(normaliseIdList(snapshot.data.revealedQuestionIds));

  const nextQuestions = base.questions.map((question) => {
    const override = snapshot.data.questionStates[question.questionId];
    const selectedAnswers = override ? [...override.selectedAnswers] : [...question.selectedAnswers];
    const isSubmitted = override?.isSubmitted ?? (submittedSet.has(question.questionId) ? true : Boolean(question.isSubmitted));
    const hasRevealedAnswer =
      override?.hasRevealedAnswer ?? (revealedSet.has(question.questionId) ? true : Boolean(question.hasRevealedAnswer));

    const timeSpentSeconds = (() => {
      if (!override) {
        return question.timeSpentSeconds ?? 0;
      }
      if (typeof override.timeSpentSeconds === 'number') {
        return override.timeSpentSeconds;
      }
      if (override.timeSpentSeconds === null) {
        return null;
      }
      return question.timeSpentSeconds ?? 0;
    })();

    return {
      ...question,
      selectedAnswers,
      isFlagged: flaggedSet.has(question.questionId),
      isBookmarked: bookmarkedSet.has(question.questionId),
      isSubmitted,
      hasRevealedAnswer,
      isCorrect: override?.isCorrect ?? question.isCorrect ?? null,
      timeSpentSeconds,
    };
  });

  const activeQuestion = nextQuestions[resolvedIndex] ?? nextQuestions[0] ?? base.questions[0];
  const remainingSeconds = deriveRemainingSeconds(base.progress.timeRemainingSeconds ?? null, snapshot);

  const nextQuestionState = activeQuestion
    ? {
        questionId: activeQuestion.questionId,
        orderIndex: activeQuestion.orderIndex,
        selectedAnswers: [...activeQuestion.selectedAnswers],
        isFlagged: flaggedSet.has(activeQuestion.questionId),
        isBookmarked: bookmarkedSet.has(activeQuestion.questionId),
        isSubmitted: Boolean(activeQuestion.isSubmitted),
        hasRevealedAnswer: Boolean(activeQuestion.hasRevealedAnswer),
        isCorrect: activeQuestion.isCorrect ?? null,
        timeSpentSeconds:
          typeof activeQuestion.timeSpentSeconds === 'number'
            ? activeQuestion.timeSpentSeconds
            : activeQuestion.timeSpentSeconds === null
            ? null
            : 0,
      }
    : base.questionState;

  return {
    ...base,
    sessionStatus: snapshot.data.sessionStatus ?? base.sessionStatus,
    questions: nextQuestions,
    currentQuestionIndex: resolvedIndex,
    question: activeQuestion?.question ?? base.question,
    questionState: nextQuestionState,
    progress: {
      ...base.progress,
      questionIndex: Math.min(resolvedIndex + 1, Math.max(base.progress.totalQuestions, 1)),
      timeRemainingSeconds: remainingSeconds ?? base.progress.timeRemainingSeconds ?? null,
    },
    flaggedQuestionIds: Array.from(flaggedSet),
    bookmarkedQuestionIds: Array.from(bookmarkedSet),
    submittedQuestionIds: Array.from(submittedSet),
    revealedQuestionIds: Array.from(revealedSet),
    fromSample: true,
  };
};
