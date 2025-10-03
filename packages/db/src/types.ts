export type QuestionId = string;
export type ExamSlug = string;
export type SubjectSlug = string;
export type UserId = string;
export type SessionId = string;

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly pagination: PaginationMeta;
}
