'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchableSelect, type SearchableSelectOption, Stack } from '@brainliest/ui';
import type { StudentUserFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';
import { EntitySearchBar } from './entity-search-bar';

interface StudentUserFiltersClientProps {
  readonly initialFilters: StudentUserFiltersInitialValues;
}

const STATUS_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
];

const SUBSCRIPTION_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All plans' },
  { value: 'free', label: 'Free plan' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'team', label: 'Team' },
];

const normalize = (value: string | undefined, options: SearchableSelectOption[]): string => {
  const fallback = options[0]?.value ?? 'all';
  return value && options.some((option) => option.value === value) ? value : fallback;
};

export default function StudentUserFiltersClient({ initialFilters }: StudentUserFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(() => ({
    status: normalize(initialFilters.status, STATUS_OPTIONS),
    subscriptionTier: normalize(initialFilters.subscriptionTier, SUBSCRIPTION_OPTIONS),
  }));

  useEffect(() => {
    setFilters({
      status: normalize(initialFilters.status, STATUS_OPTIONS),
      subscriptionTier: normalize(initialFilters.subscriptionTier, SUBSCRIPTION_OPTIONS),
    });
  }, [initialFilters.status, initialFilters.subscriptionTier]);

  const pushFiltersToUrl = useCallback(
    (nextStatus: string, nextSubscription: string, resetSearch = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('status', nextStatus);
      setParam('subscription', nextSubscription);
      params.set('role', 'STUDENT');
      if (resetSearch) {
        params.delete('search');
      }
      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateStatus = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.status === value) {
          return previous;
        }
        const next = { ...previous, status: value };
        startTransition(() => pushFiltersToUrl(value, next.subscriptionTier));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const updateSubscription = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.subscriptionTier === value) {
          return previous;
        }
        const next = { ...previous, subscriptionTier: value };
        startTransition(() => pushFiltersToUrl(next.status, value));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const handleReset = useCallback(() => {
    setFilters({ status: 'all', subscriptionTier: 'all' });
    startTransition(() => pushFiltersToUrl('all', 'all', true));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.status !== 'all') total += 1;
    if (filters.subscriptionTier !== 'all') total += 1;
    if (initialFilters.search && initialFilters.search.trim().length > 0) total += 1;
    return total;
  }, [filters.status, filters.subscriptionTier, initialFilters.search]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Search and segment students by status or subscription tier."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <Stack direction="col" gap={3} className="w-full">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <EntitySearchBar
            endpoint="/api/search/users"
            placeholder="Search students by email"
            ariaLabel="Search students"
            initialValue={initialFilters.search ?? ''}
            additionalParams={{
              role: 'STUDENT',
              status: filters.status !== 'all' ? filters.status : undefined,
              subscription: filters.subscriptionTier !== 'all' ? filters.subscriptionTier : undefined,
            }}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
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
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Subscription</label>
            <SearchableSelect
              options={SUBSCRIPTION_OPTIONS}
              value={filters.subscriptionTier}
              onChange={updateSubscription}
              placeholder="All plans"
              ariaLabel="Filter by subscription tier"
            />
          </div>
        </div>
      </Stack>
    </FilterPanel>
  );
}
