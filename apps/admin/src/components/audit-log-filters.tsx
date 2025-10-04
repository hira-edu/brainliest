import 'server-only';

import type { AuditLogFiltersInitialValues } from '@/types/filter-values';
import AuditLogFiltersClient from './audit-log-filters.client';

interface AuditLogFiltersProps {
  readonly initialFilters: AuditLogFiltersInitialValues;
}

export default function AuditLogFilters({ initialFilters }: AuditLogFiltersProps) {
  return <AuditLogFiltersClient initialFilters={initialFilters} />;
}
