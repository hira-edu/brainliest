import 'server-only';

import type { ExamFilter, ExamRecord, PaginatedResult } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListExamsOptions {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: ExamFilter['status'];
  readonly difficulty?: ExamFilter['difficulty'];
  readonly subjectSlug?: ExamFilter['subjectSlug'];
  readonly categorySlug?: ExamFilter['categorySlug'];
  readonly subcategorySlug?: ExamFilter['subcategorySlug'];
  readonly examSlug?: ExamFilter['examSlug'];
  readonly search?: string;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listExams(options: ListExamsOptions = {}): Promise<PaginatedResult<ExamRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: ExamFilter = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.difficulty ? { difficulty: options.difficulty } : {}),
    ...(options.subjectSlug ? { subjectSlug: options.subjectSlug } : {}),
    ...(options.categorySlug ? { categorySlug: options.categorySlug } : {}),
    ...(options.subcategorySlug ? { subcategorySlug: options.subcategorySlug } : {}),
    ...(options.examSlug ? { examSlug: options.examSlug } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.exams.list(filters, page, pageSize);
}

export async function countExamsByStatus(status: NonNullable<ExamFilter['status']>): Promise<number> {
  const result = await repositories.exams.list({ status }, 1, 1);
  return result.pagination.totalCount;
}

export async function getExamBySlug(slug: string) {
  if (!slug) {
    return null;
  }

  return repositories.exams.findBySlug(slug);
}

export interface ExamSearchSuggestion {
  readonly slug: string;
  readonly title: string;
  readonly subjectSlug: string;
  readonly status: NonNullable<ExamFilter['status']>;
}

export async function searchExamSuggestions(query: string, limit = 8): Promise<ExamSearchSuggestion[]> {
  const term = query.trim();
  if (!term) {
    return [];
  }

  const page = await repositories.exams.list({ search: term }, 1, Math.max(1, limit));

  return page.data.map((exam) => ({
    slug: exam.slug,
    title: exam.title,
    subjectSlug: exam.subjectSlug,
    status: exam.status,
  }));
}
