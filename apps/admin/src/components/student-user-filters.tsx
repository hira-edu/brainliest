import 'server-only';

import type { StudentUserFiltersInitialValues } from '@/types/filter-values';
import StudentUserFiltersClient from './student-user-filters.client';

interface StudentUserFiltersProps {
  readonly initialFilters: StudentUserFiltersInitialValues;
}

export default function StudentUserFilters({ initialFilters }: StudentUserFiltersProps) {
  return <StudentUserFiltersClient initialFilters={initialFilters} />;
}
