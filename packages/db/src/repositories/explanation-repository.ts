import type { PaginatedResult, QuestionId } from '../types';

export interface ExplanationRecord {
  readonly id: string;
  readonly questionId: QuestionId;
  readonly questionVersionId: string;
  readonly answerPattern: string;
  readonly content: string;
  readonly model: string;
  readonly language: string;
  readonly tokensTotal: number;
  readonly costCents: number;
  readonly createdAt: Date;
}

export interface CreateExplanationInput {
  readonly questionId: QuestionId;
  readonly questionVersionId: string;
  readonly answerPattern: string;
  readonly content: string;
  readonly model: string;
  readonly language: string;
  readonly tokensTotal: number;
  readonly costCents: number;
}

export interface ExplanationSummary extends ExplanationRecord {
  readonly examSlug: string | null;
  readonly subjectSlug: string;
  readonly questionStem: string;
}

export interface ExplanationListRecentOptions {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ExplanationRepository {
  findByQuestionAndPattern(questionId: QuestionId, answerPattern: string): Promise<ExplanationRecord | null>;
  create(record: CreateExplanationInput): Promise<string>;
  listRecent(options?: ExplanationListRecentOptions): Promise<PaginatedResult<ExplanationSummary>>;
}
