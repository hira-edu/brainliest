import type { TaxonomySelectionState } from './taxonomy';

export interface QuestionFiltersInitialValues extends TaxonomySelectionState {
  readonly status?: string;
  readonly difficulty?: string;
  readonly search?: string;
}

export interface ExamFiltersInitialValues extends TaxonomySelectionState {
  readonly status?: string;
  readonly difficulty?: string;
  readonly search?: string;
}

export interface MediaFiltersInitialValues extends TaxonomySelectionState {
  readonly type?: string;
  readonly search?: string;
}

export interface AdminUserFiltersInitialValues {
  readonly role?: string;
  readonly status?: string;
  readonly search?: string;
}

export interface StudentUserFiltersInitialValues {
  readonly status?: string;
  readonly subscriptionTier?: string;
  readonly search?: string;
}

export interface IntegrationFiltersInitialValues {
  readonly environment?: string;
  readonly type?: string;
  readonly search?: string;
}

export interface CategoryFiltersInitialValues {
  readonly type?: string;
  readonly search?: string;
}

export interface SubcategoryFiltersInitialValues {
  readonly categorySlug?: string;
  readonly search?: string;
}

export interface SubjectFiltersInitialValues extends TaxonomySelectionState {
  readonly difficulty?: string;
  readonly status?: string;
  readonly search?: string;
}

export interface AuditLogFiltersInitialValues {
  readonly actorType?: string;
  readonly timeframe?: string;
  readonly actorEmail?: string;
  readonly search?: string;
}
