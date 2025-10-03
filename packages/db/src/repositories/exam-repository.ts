import type { ExamSlug, PaginatedResult, SubjectSlug } from '../types';

export interface ExamRecord {
  readonly slug: ExamSlug;
  readonly subjectSlug: SubjectSlug;
  readonly title: string;
  readonly description: string | null;
  readonly difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | null;
  readonly durationMinutes: number | null;
  readonly questionTarget: number | null;
  readonly status: 'draft' | 'published' | 'archived';
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly subject?: ExamSubjectSummary;
}

export interface ExamSubjectSummary {
  readonly slug: SubjectSlug;
  readonly name: string;
  readonly categorySlug: string;
  readonly categoryName?: string;
  readonly categoryType?: string;
  readonly subcategorySlug?: string | null;
  readonly subcategoryName?: string | null;
}

export interface ExamFilter {
  readonly subjectSlug?: SubjectSlug;
  readonly status?: 'draft' | 'published' | 'archived';
  readonly difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

export interface CreateExamInput {
  readonly slug: ExamSlug;
  readonly subjectSlug: SubjectSlug;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  readonly durationMinutes?: number;
  readonly questionTarget?: number;
  readonly status?: 'draft' | 'published' | 'archived';
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateExamInput extends Partial<CreateExamInput> {
  readonly slug: ExamSlug;
}

export interface ExamRepository {
  findBySlug(slug: ExamSlug): Promise<ExamRecord | null>;
  list(filters: ExamFilter, page: number, pageSize: number): Promise<PaginatedResult<ExamRecord>>;
  create(input: CreateExamInput, actorId: string): Promise<ExamSlug>;
  update(input: UpdateExamInput, actorId: string): Promise<void>;
  delete(slug: ExamSlug, actorId: string): Promise<void>;
}
