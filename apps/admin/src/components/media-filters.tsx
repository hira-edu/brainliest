import 'server-only';

import { getHierarchicalData, getExamsBySubject } from '@/lib/taxonomy';
import type { MediaFiltersInitialValues } from '@/types/filter-values';
import type { HierarchyOption } from '@/types/taxonomy';
import MediaFiltersClient from './media-filters.client';

interface MediaFiltersProps {
  readonly initialFilters: MediaFiltersInitialValues;
}

export default async function MediaFilters({ initialFilters }: MediaFiltersProps) {
  const hierarchy = await getHierarchicalData();
  const initialSubject = initialFilters.subjectSlug;
  const initialExamOptions: ReadonlyArray<HierarchyOption> = initialSubject
    ? await getExamsBySubject(initialSubject)
    : [];

  return (
    <MediaFiltersClient
      hierarchy={hierarchy}
      initialFilters={initialFilters}
      initialExamOptions={initialExamOptions}
    />
  );
}
