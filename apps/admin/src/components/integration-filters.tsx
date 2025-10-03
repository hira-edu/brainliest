import 'server-only';

import type { IntegrationFiltersInitialValues } from '@/types/filter-values';
import IntegrationFiltersClient from './integration-filters.client';

interface IntegrationFiltersProps {
  readonly initialFilters: IntegrationFiltersInitialValues;
}

export default function IntegrationFilters({ initialFilters }: IntegrationFiltersProps) {
  return <IntegrationFiltersClient initialFilters={initialFilters} />;
}
