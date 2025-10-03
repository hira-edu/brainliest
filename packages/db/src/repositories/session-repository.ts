import type { ExamSlug, QuestionId, SessionId, UserId } from '../types';
import type { QuestionRecord } from './question-repository';
import type { ExamRecord } from './exam-repository';

export type ExamSessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'expired';

type PrimitiveMetadata = Record<string, unknown>;

export interface PracticeSessionMetadata {
  readonly currentQuestionIndex: number;
  readonly flaggedQuestionIds: readonly QuestionId[];
  readonly bookmarkedQuestionIds: readonly QuestionId[];
  readonly submittedQuestionIds: readonly QuestionId[];
  readonly revealedQuestionIds: readonly QuestionId[];
  readonly remainingSeconds?: number | null;
  readonly extra?: PrimitiveMetadata;
}

export interface PracticeSessionQuestionState {
  readonly questionId: QuestionId;
  readonly orderIndex: number;
  readonly selectedAnswers: readonly number[];
  readonly isCorrect: boolean | null;
  readonly timeSpentSeconds: number | null;
  readonly question: QuestionRecord;
  readonly isFlagged: boolean;
  readonly isBookmarked: boolean;
}

export interface PracticeSessionRecord {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly examSlug: ExamSlug;
  readonly status: ExamSessionStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly metadata: PracticeSessionMetadata;
  readonly exam: ExamRecord;
  readonly questions: readonly PracticeSessionQuestionState[];
}

export interface StartSessionInput {
  readonly userId: UserId;
  readonly examSlug: ExamSlug;
  readonly remainingSeconds?: number;
}

export interface AdvanceQuestionInput {
  readonly sessionId: SessionId;
  readonly currentQuestionIndex: number;
}

export interface ToggleFlagInput {
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
  readonly flagged: boolean;
}

export interface ToggleBookmarkInput {
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
  readonly bookmarked: boolean;
}

export interface SubmitAnswerInput {
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
}

export interface RevealAnswerInput {
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
}

export interface UpdateRemainingSecondsInput {
  readonly sessionId: SessionId;
  readonly remainingSeconds: number;
}

export interface RecordQuestionProgressInput {
  readonly sessionId: SessionId;
  readonly questionId: QuestionId;
  readonly selectedAnswers: readonly number[];
  readonly timeSpentSeconds?: number | null;
}

export interface CompleteSessionInput {
  readonly sessionId: SessionId;
}

export interface SessionRepository {
  startSession(input: StartSessionInput): Promise<PracticeSessionRecord>;
  getSession(sessionId: SessionId): Promise<PracticeSessionRecord | null>;
  advanceQuestion(input: AdvanceQuestionInput): Promise<void>;
  toggleFlag(input: ToggleFlagInput): Promise<void>;
  toggleBookmark(input: ToggleBookmarkInput): Promise<void>;
  updateRemainingSeconds(input: UpdateRemainingSecondsInput): Promise<void>;
  recordQuestionProgress(input: RecordQuestionProgressInput): Promise<void>;
  submitAnswer(input: SubmitAnswerInput): Promise<void>;
  revealAnswer(input: RevealAnswerInput): Promise<void>;
  completeSession(input: CompleteSessionInput): Promise<void>;
}
