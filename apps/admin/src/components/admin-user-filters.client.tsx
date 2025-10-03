'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchableSelect, type SearchableSelectOption, Stack } from '@brainliest/ui';
import type { AdminUserFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';
import { EntitySearchBar } from './entity-search-bar';

interface AdminUserFiltersClientProps {
  readonly initialFilters: AdminUserFiltersInitialValues;
}

const ROLE_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All roles' },
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
];

const STATUS_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const normalizeRole = (value?: string): string =>
  value && ROLE_OPTIONS.some((option) => option.value === value) ? value : 'all';

const normalizeStatus = (value?: string): string =>
  value && STATUS_OPTIONS.some((option) => option.value === value) ? value : 'all';

export default function AdminUserFiltersClient({ initialFilters }: AdminUserFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(() => ({
    role: normalizeRole(initialFilters.role),
    status: normalizeStatus(initialFilters.status),
  }));

  useEffect(() => {
    setFilters({
      role: normalizeRole(initialFilters.role),
      status: normalizeStatus(initialFilters.status),
    });
  }, [initialFilters.role, initialFilters.status]);

  const pushFiltersToUrl = useCallback(
    (nextRole: string, nextStatus: string, resetSearch = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('role', nextRole);
      setParam('status', nextStatus);
      if (resetSearch) {
        params.delete('search');
      }
      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateRole = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.role === value) {
          return previous;
        }
        const next = { ...previous, role: value };
        startTransition(() => pushFiltersToUrl(value, next.status));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const updateStatus = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.status === value) {
          return previous;
        }
        const next = { ...previous, status: value };
        startTransition(() => pushFiltersToUrl(next.role, value));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const handleReset = useCallback(() => {
    setFilters({ role: 'all', status: 'all' });
    startTransition(() => pushFiltersToUrl('all', 'all', true));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.role !== 'all') total += 1;
    if (filters.status !== 'all') total += 1;
    if (initialFilters.search && initialFilters.search.trim().length > 0) total += 1;
    return total;
  }, [filters.role, filters.status, initialFilters.search]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Narrow administrators by role, status, or search."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <Stack direction="col" gap={3} className="w-full">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <EntitySearchBar
            endpoint="/api/search/admin-users"
            placeholder="Search administrators by email"
            ariaLabel="Search administrators"
            initialValue={initialFilters.search ?? ''}
            additionalParams={{
              role: filters.role !== 'all' ? filters.role : undefined,
              status: filters.status !== 'all' ? filters.status : undefined,
            }}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Role</label>
            <SearchableSelect
              options={ROLE_OPTIONS}
              value={filters.role}
              onChange={updateRole}
              placeholder="All roles"
              ariaLabel="Filter by role"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <SearchableSelect
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={updateStatus}
              placeholder="All statuses"
              ariaLabel="Filter by status"
            />
          </div>
        </div>
      </Stack>
    </FilterPanel>
  );
}
