import 'server-only';

import type { SubcategoryFiltersInitialValues } from '@/types/filter-values';
import SubcategoryFiltersClient, { type SubcategoryFilterOption } from './subcategory-filters.client';

interface SubcategoryFiltersProps {
  readonly initialFilters: SubcategoryFiltersInitialValues;
  readonly categoryOptions: readonly SubcategoryFilterOption[];
}

export default function SubcategoryFilters({ initialFilters, categoryOptions }: SubcategoryFiltersProps) {
  return <SubcategoryFiltersClient initialFilters={initialFilters} categoryOptions={categoryOptions} />;
}
