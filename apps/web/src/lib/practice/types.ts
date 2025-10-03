import type { QuestionModel } from '@brainliest/shared';

export interface PracticeExamInfo {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  durationMinutes?: number;
  passingScore?: string;
  difficultyMix?: string;
  attemptsAllowed?: string;
  totalQuestions: number;
  category?: {
    slug: string;
    name: string;
    type?: string;
  };
  subcategory?: {
    slug: string;
    name: string;
  };
}

export interface PracticeProgressInfo {
  questionIndex: number;
  totalQuestions: number;
  timeRemainingSeconds?: number;
}

export interface PracticeSessionQuestionState {
  questionId: string;
  orderIndex: number;
  selectedAnswers: number[];
  isFlagged: boolean;
  isBookmarked: boolean;
  isSubmitted: boolean;
  hasRevealedAnswer: boolean;
  isCorrect: boolean | null;
  timeSpentSeconds?: number | null;
}

export interface PracticeSessionData {
  sessionId: string;
  sessionStatus: string;
  exam: PracticeExamInfo;
  questions: PracticeSessionApiQuestion[];
  currentQuestionIndex: number;
  question: QuestionModel;
  questionState: PracticeSessionQuestionState;
  progress: PracticeProgressInfo;
  flaggedQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  submittedQuestionIds: string[];
  revealedQuestionIds: string[];
  fromSample: boolean;
}

export interface PracticeSessionApiQuestion extends PracticeSessionQuestionState {
  question: QuestionModel;
}

export interface PracticeSessionApiResponse {
  session: {
    id: string;
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    remainingSeconds: number | null;
    flaggedQuestionIds: string[];
    bookmarkedQuestionIds: string[];
    submittedQuestionIds: string[];
    revealedQuestionIds: string[];
  };
  exam: PracticeExamInfo;
  questions: PracticeSessionApiQuestion[];
}
