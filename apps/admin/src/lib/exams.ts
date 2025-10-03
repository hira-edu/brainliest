import 'server-only';

import type { ExamFilter, ExamRecord, PaginatedResult } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListExamsOptions {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: ExamFilter['status'];
  readonly difficulty?: ExamFilter['difficulty'];
  readonly subjectSlug?: ExamFilter['subjectSlug'];
}

const DEFAULT_PAGE_SIZE = 20;

export async function listExams(options: ListExamsOptions = {}): Promise<PaginatedResult<ExamRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: ExamFilter = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.difficulty ? { difficulty: options.difficulty } : {}),
    ...(options.subjectSlug ? { subjectSlug: options.subjectSlug } : {}),
  };

  return repositories.exams.list(filters, page, pageSize);
}

export async function countExamsByStatus(status: NonNullable<ExamFilter['status']>): Promise<number> {
  const result = await repositories.exams.list({ status }, 1, 1);
  return result.pagination.totalCount;
}
