import 'server-only';

import type { CategoryFiltersInitialValues } from '@/types/filter-values';
import CategoryFiltersClient from './category-filters.client';

interface CategoryFiltersProps {
  readonly initialFilters: CategoryFiltersInitialValues;
  readonly availableTypes: readonly string[];
}

export default function CategoryFilters({ initialFilters, availableTypes }: CategoryFiltersProps) {
  return <CategoryFiltersClient initialFilters={initialFilters} availableTypes={availableTypes} />;
}
