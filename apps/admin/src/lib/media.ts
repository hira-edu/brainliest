import 'server-only';

import type { MediaAssetFilter, MediaAssetRecord, MediaAssetType, PaginatedResult } from '@brainliest/db';
import { repositories } from './repositories';

export interface ListMediaOptions extends Partial<MediaAssetFilter> {
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 24;

export async function listMediaAssets(options: ListMediaOptions = {}): Promise<PaginatedResult<MediaAssetRecord>> {
  const page = Number.isFinite(options.page) && options.page ? Math.max(1, Math.trunc(options.page)) : 1;
  const pageSize = Number.isFinite(options.pageSize) && options.pageSize ? Math.max(1, Math.trunc(options.pageSize)) : DEFAULT_PAGE_SIZE;

  const filters: MediaAssetFilter = {
    ...(options.type ? { type: options.type } : {}),
    ...(options.subjectSlug ? { subjectSlug: options.subjectSlug } : {}),
    ...(options.examSlug ? { examSlug: options.examSlug } : {}),
    ...(options.categorySlug ? { categorySlug: options.categorySlug } : {}),
    ...(options.subcategorySlug ? { subcategorySlug: options.subcategorySlug } : {}),
    ...(options.questionId ? { questionId: options.questionId } : {}),
    ...(options.search ? { search: options.search } : {}),
  };

  return repositories.media.list(filters, page, pageSize);
}

export async function countMediaByType(type: MediaAssetType): Promise<number> {
  const result = await repositories.media.list({ type }, 1, 1);
  return result.pagination.totalCount;
}

export async function summarizeMediaCounts(): Promise<{
  total: number;
  byType: Record<MediaAssetType, number>;
}> {
  const [all, images, audio, files] = await Promise.all([
    repositories.media.list({}, 1, 1),
    repositories.media.list({ type: 'image' }, 1, 1),
    repositories.media.list({ type: 'audio' }, 1, 1),
    repositories.media.list({ type: 'file' }, 1, 1),
  ]);

  return {
    total: all.pagination.totalCount,
    byType: {
      image: images.pagination.totalCount,
      audio: audio.pagination.totalCount,
      file: files.pagination.totalCount,
    },
  };
}
