import 'server-only';

import type { PaginatedResult, QuestionFilter, QuestionRecord } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListQuestionsOptions {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: QuestionFilter['status'] | 'all';
  readonly difficulty?: QuestionFilter['difficulty'] | 'all';
  readonly subjectSlug?: QuestionFilter['subjectSlug'];
  readonly categorySlug?: QuestionFilter['categorySlug'];
  readonly subcategorySlug?: QuestionFilter['subcategorySlug'];
  readonly examSlug?: QuestionFilter['examSlug'];
  readonly domain?: QuestionFilter['domain'];
  readonly year?: QuestionFilter['year'];
  readonly search?: string;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listQuestions(options: ListQuestionsOptions = {}): Promise<PaginatedResult<QuestionRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const statusFilter = options.status && options.status !== 'all' ? options.status : undefined;
  const difficultyFilter = options.difficulty && options.difficulty !== 'all' ? options.difficulty : undefined;

  const filters: QuestionFilter = {
    ...(options.subjectSlug ? { subjectSlug: options.subjectSlug } : {}),
    ...(options.categorySlug ? { categorySlug: options.categorySlug } : {}),
    ...(options.subcategorySlug ? { subcategorySlug: options.subcategorySlug } : {}),
    ...(options.examSlug ? { examSlug: options.examSlug } : {}),
    ...(options.domain ? { domain: options.domain } : {}),
    ...(options.year ? { year: options.year } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.questions.list(filters, page, pageSize);
}

export async function countQuestionsByStatus(status: NonNullable<QuestionFilter['status']>): Promise<number> {
  const result = await repositories.questions.list({ status }, 1, 1);
  return result.pagination.totalCount;
}

export async function countQuestionsByDifficulty(
  difficulty: NonNullable<QuestionFilter['difficulty']>
): Promise<number> {
  const result = await repositories.questions.list({ difficulty }, 1, 1);
  return result.pagination.totalCount;
}

export interface QuestionSearchSuggestion {
  readonly id: string;
  readonly stem: string;
  readonly subjectSlug: string;
  readonly examSlug: string | null;
}

export async function searchQuestionsSuggestions(
  query: string,
  limit = 8
): Promise<QuestionSearchSuggestion[]> {
  const term = query.trim();
  if (!term) {
    return [];
  }

  const page = await repositories.questions.list({ search: term }, 1, Math.max(1, limit));

  return page.data.map((question) => ({
    id: question.id,
    stem: question.stemMarkdown,
    subjectSlug: question.subjectSlug,
    examSlug: question.examSlug ?? null,
  }));
}

export async function getQuestionById(id: string): Promise<QuestionRecord | null> {
  if (!id) {
    return null;
  }

  return repositories.questions.findById(id);
}
