import type { QuestionAsset } from '../schema';
import type { PaginatedResult } from '../types';

export type MediaAssetType = QuestionAsset['type'];

export interface MediaAssetRecord {
  readonly id: string;
  readonly questionId: string;
  readonly type: MediaAssetType;
  readonly url: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly subjectSlug: string;
  readonly examSlug: string | null;
  readonly stemMarkdown: string | null;
}

export interface MediaAssetFilter {
  readonly type?: MediaAssetType;
  readonly subjectSlug?: string;
  readonly examSlug?: string;
  readonly categorySlug?: string;
  readonly subcategorySlug?: string;
  readonly questionId?: string;
  readonly search?: string;
}

export interface CreateMediaAssetInput {
  readonly questionId: string;
  readonly type: MediaAssetType;
  readonly url: string;
  readonly metadata?: Record<string, unknown>;
}

export interface MediaRepository {
  list(filters: MediaAssetFilter, page: number, pageSize: number): Promise<PaginatedResult<MediaAssetRecord>>;
  createMany(assets: ReadonlyArray<CreateMediaAssetInput>): Promise<void>;
}
