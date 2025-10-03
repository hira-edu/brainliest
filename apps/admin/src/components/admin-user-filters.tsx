import 'server-only';

import type { AdminUserFiltersInitialValues } from '@/types/filter-values';
import AdminUserFiltersClient from './admin-user-filters.client';

interface AdminUserFiltersProps {
  readonly initialFilters: AdminUserFiltersInitialValues;
}

export default function AdminUserFilters({ initialFilters }: AdminUserFiltersProps) {
  return <AdminUserFiltersClient initialFilters={initialFilters} />;
}
