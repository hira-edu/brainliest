import 'server-only';

import { getHierarchicalData, getExamsBySubject } from '@/lib/taxonomy';
import ExamFiltersClient from './exam-filters.client';
import type { ExamFiltersInitialValues } from '@/types/filter-values';
import type { HierarchicalTaxonomyData, HierarchyOption } from '@/types/taxonomy';

interface ExamFiltersProps {
  readonly initialFilters: ExamFiltersInitialValues;
}

export interface ExamFiltersClientProps {
  readonly hierarchy: HierarchicalTaxonomyData;
  readonly initialFilters: ExamFiltersInitialValues;
  readonly initialExamOptions: ReadonlyArray<HierarchyOption>;
}

export default async function ExamFilters({ initialFilters }: ExamFiltersProps) {
  const hierarchy = await getHierarchicalData();
  const initialSubject = initialFilters.subjectSlug;
  const initialExamOptions = initialSubject ? await getExamsBySubject(initialSubject) : [];

  return (
    <ExamFiltersClient
      hierarchy={hierarchy}
      initialFilters={initialFilters}
      initialExamOptions={initialExamOptions}
    />
  );
}
