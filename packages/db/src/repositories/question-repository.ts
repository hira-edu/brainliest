import type { ExamSlug, PaginatedResult, QuestionId, SubjectSlug } from '../types';

export interface QuestionOptionInput {
  readonly id: string;
  readonly label: string;
  readonly contentMarkdown: string;
  readonly isCorrect?: boolean;
}

export interface QuestionOptionRecord extends QuestionOptionInput {
  readonly isCorrect: boolean;
  readonly sortOrder: number;
}

export interface QuestionRecord {
  readonly id: QuestionId;
  readonly subjectSlug: SubjectSlug;
  readonly examSlug?: ExamSlug;
  readonly type: 'single' | 'multi';
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly domain?: string | null;
  readonly stemMarkdown: string;
  readonly currentVersionId?: string | null;
  readonly explanationMarkdown?: string;
  readonly options: ReadonlyArray<QuestionOptionRecord>;
  readonly correctChoiceIds: ReadonlyArray<string>;
  readonly source?: string;
  readonly year?: number;
  readonly published: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface QuestionFilter {
  readonly subjectSlug?: SubjectSlug;
  readonly domain?: string;
  readonly difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly year?: number;
  readonly status?: 'draft' | 'published' | 'unpublished';
}

export interface CreateQuestionInput {
  readonly text: string;
  readonly options: ReadonlyArray<QuestionOptionInput>;
  readonly correctAnswer?: number;
  readonly correctAnswers?: number[];
  readonly allowMultiple: boolean;
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly explanation?: string;
  readonly domain: string;
  readonly subjectSlug: SubjectSlug;
  readonly examSlug?: ExamSlug;
  readonly source?: string;
  readonly year?: number;
  readonly status?: 'draft' | 'published';
}

export interface UpdateQuestionInput extends Partial<CreateQuestionInput> {
  readonly id: QuestionId;
}

export interface QuestionRepository {
  findById(id: QuestionId): Promise<QuestionRecord | null>;
  findByExam(
    examSlug: ExamSlug,
    filters: QuestionFilter,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<QuestionRecord>>;
  create(payload: CreateQuestionInput, actorId: string): Promise<QuestionId>;
  update(payload: UpdateQuestionInput, actorId: string): Promise<void>;
  delete(id: QuestionId, actorId: string): Promise<void>;
  bulkCreate(payloads: CreateQuestionInput[], actorId: string): Promise<QuestionId[]>;
}
