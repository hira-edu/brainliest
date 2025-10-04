'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchableSelect, type SearchableSelectOption, Stack } from '@brainliest/ui';
import type { AuditLogFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';
import { EntitySearchBar } from './entity-search-bar';

interface AuditLogFiltersClientProps {
  readonly initialFilters: AuditLogFiltersInitialValues;
}

const ACTOR_TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All actors' },
  { value: 'admin', label: 'Admins' },
  { value: 'user', label: 'Users' },
  { value: 'system', label: 'System' },
];

const TIMEFRAME_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const normalizeActorType = (value?: string): string =>
  value && ACTOR_TYPE_OPTIONS.some((option) => option.value === value) ? value : 'all';

const normalizeTimeframe = (value?: string): string =>
  value && TIMEFRAME_OPTIONS.some((option) => option.value === value) ? value : 'all';

export default function AuditLogFiltersClient({ initialFilters }: AuditLogFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(() => ({
    actorType: normalizeActorType(initialFilters.actorType),
    timeframe: normalizeTimeframe(initialFilters.timeframe),
  }));

  useEffect(() => {
    setFilters({
      actorType: normalizeActorType(initialFilters.actorType),
      timeframe: normalizeTimeframe(initialFilters.timeframe),
    });
  }, [initialFilters.actorType, initialFilters.timeframe]);

  const pushFiltersToUrl = useCallback(
    (nextActorType: string, nextTimeframe: string, resetSearch?: boolean) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('actorType', nextActorType);
      setParam('timeframe', nextTimeframe);

      if (resetSearch) {
        params.delete('actorEmail');
        params.delete('search');
      }

      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateActorType = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.actorType === value) {
          return previous;
        }
        const next = { ...previous, actorType: value };
        startTransition(() => pushFiltersToUrl(value, next.timeframe));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const updateTimeframe = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.timeframe === value) {
          return previous;
        }
        const next = { ...previous, timeframe: value };
        startTransition(() => pushFiltersToUrl(next.actorType, value));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const handleReset = useCallback(() => {
    setFilters({ actorType: 'all', timeframe: 'all' });
    startTransition(() => pushFiltersToUrl('all', 'all', true));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.actorType !== 'all') total += 1;
    if (filters.timeframe !== 'all') total += 1;
    if (initialFilters.actorEmail && initialFilters.actorEmail.trim().length > 0) total += 1;
    if (initialFilters.search && initialFilters.search.trim().length > 0) total += 1;
    return total;
  }, [filters.actorType, filters.timeframe, initialFilters.actorEmail, initialFilters.search]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Refine the audit trail by actor, timeframe, or keyword."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <Stack direction="col" gap={3} className="w-full">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Actor email</label>
          <EntitySearchBar
            endpoint="/api/search/audit-actors"
            placeholder="Search admins or users"
            ariaLabel="Search actors by email"
            initialValue={initialFilters.actorEmail ?? ''}
            paramKey="actorEmail"
            additionalParams={{
              actorType: filters.actorType !== 'all' ? filters.actorType : undefined,
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Keyword</label>
          <EntitySearchBar
            endpoint="/api/search/audit-actions"
            placeholder="Search actions, entities, IP addresses, or user agents"
            ariaLabel="Search audit logs"
            initialValue={initialFilters.search ?? ''}
            paramKey="search"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Actor type</label>
            <SearchableSelect
              options={ACTOR_TYPE_OPTIONS}
              value={filters.actorType}
              onChange={updateActorType}
              placeholder="All actors"
              ariaLabel="Filter by actor type"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Timeframe</label>
            <SearchableSelect
              options={TIMEFRAME_OPTIONS}
              value={filters.timeframe}
              onChange={updateTimeframe}
              placeholder="All time"
              ariaLabel="Filter by timeframe"
            />
          </div>
        </div>
      </Stack>
    </FilterPanel>
  );
}
