import 'server-only';

import { getHierarchicalData } from '@/lib/taxonomy';
import type { SubjectFiltersInitialValues } from '@/types/filter-values';
import SubjectFiltersClient from './subject-filters.client';

interface SubjectFiltersProps {
  readonly initialFilters: SubjectFiltersInitialValues;
}

export default async function SubjectFilters({ initialFilters }: SubjectFiltersProps) {
  const hierarchy = await getHierarchicalData();

  return (
    <SubjectFiltersClient
      hierarchy={hierarchy}
      initialFilters={initialFilters}
    />
  );
}
