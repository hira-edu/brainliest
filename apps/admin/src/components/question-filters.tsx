import 'server-only';

import { getHierarchicalData, getExamsBySubject } from '@/lib/taxonomy';
import type { HierarchicalTaxonomyData, HierarchyOption } from '@/types/taxonomy';
import QuestionFiltersClient from './question-filters.client';
import type { QuestionFiltersInitialValues } from '@/types/filter-values';

interface QuestionFiltersProps {
  readonly initialFilters: QuestionFiltersInitialValues;
}

export default async function QuestionFilters({ initialFilters }: QuestionFiltersProps) {
  const hierarchy = await getHierarchicalData();
  const initialSubject = initialFilters.subjectSlug;
  const initialExamOptions = initialSubject ? await getExamsBySubject(initialSubject) : [];

  return (
    <QuestionFiltersClient
      hierarchy={hierarchy}
      initialFilters={initialFilters}
      initialExamOptions={initialExamOptions}
    />
  );
}

export type { HierarchicalTaxonomyData, HierarchyOption };
