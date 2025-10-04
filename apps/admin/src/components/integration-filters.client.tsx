'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchableSelect, type SearchableSelectOption, Stack } from '@brainliest/ui';
import type { IntegrationFiltersInitialValues } from '@/types/filter-values';
import { FilterPanel } from './filter-panel';
import { EntitySearchBar } from './entity-search-bar';

interface IntegrationFiltersClientProps {
  readonly initialFilters: IntegrationFiltersInitialValues;
}

const ENVIRONMENT_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All environments' },
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
];

const TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: 'all', label: 'All types' },
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'RESEND', label: 'Resend' },
  { value: 'CAPTCHA', label: 'Captcha' },
  { value: 'GOOGLE_RECAPTCHA_V2_SITE', label: 'Google reCAPTCHA v2 (site key)' },
  { value: 'GOOGLE_RECAPTCHA_V2_SECRET', label: 'Google reCAPTCHA v2 (secret key)' },
  { value: 'GOOGLE_RECAPTCHA_V3_SITE', label: 'Google reCAPTCHA v3 (site key)' },
  { value: 'GOOGLE_RECAPTCHA_V3_SECRET', label: 'Google reCAPTCHA v3 (secret key)' },
];

const normalizeOption = (value: string | undefined, options: SearchableSelectOption[]): string => {
  const fallback = options[0]?.value ?? 'all';
  return value && options.some((option) => option.value === value) ? value : fallback;
};

export default function IntegrationFiltersClient({ initialFilters }: IntegrationFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(() => ({
    environment: normalizeOption(initialFilters.environment, ENVIRONMENT_OPTIONS),
    type: normalizeOption(initialFilters.type, TYPE_OPTIONS),
  }));

  useEffect(() => {
    setFilters({
      environment: normalizeOption(initialFilters.environment, ENVIRONMENT_OPTIONS),
      type: normalizeOption(initialFilters.type, TYPE_OPTIONS),
    });
  }, [initialFilters.environment, initialFilters.type]);

  const pushFiltersToUrl = useCallback(
    (nextEnvironment: string, nextType: string, resetSearch = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const setParam = (key: string, value: string) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      };

      setParam('environment', nextEnvironment);
      setParam('type', nextType);
      if (resetSearch) {
        params.delete('search');
      }
      params.delete('page');

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateEnvironment = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.environment === value) {
          return previous;
        }
        const next = { ...previous, environment: value };
        startTransition(() => pushFiltersToUrl(value, next.type));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const updateType = useCallback(
    (value: string) => {
      setFilters((previous) => {
        if (previous.type === value) {
          return previous;
        }
        const next = { ...previous, type: value };
        startTransition(() => pushFiltersToUrl(next.environment, value));
        return next;
      });
    },
    [pushFiltersToUrl]
  );

  const handleReset = useCallback(() => {
    setFilters({ environment: 'all', type: 'all' });
    startTransition(() => pushFiltersToUrl('all', 'all', true));
  }, [pushFiltersToUrl]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (filters.environment !== 'all') total += 1;
    if (filters.type !== 'all') total += 1;
    if (initialFilters.search && initialFilters.search.trim().length > 0) total += 1;
    return total;
  }, [filters.environment, filters.type, initialFilters.search]);

  return (
    <FilterPanel
      title="Filters"
      subtitle="Locate keys by environment, integration type, or keyword."
      activeCount={activeFilterCount}
      onReset={handleReset}
      resetDisabled={isPending && activeFilterCount === 0}
    >
      <Stack direction="col" gap={3} className="w-full">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <EntitySearchBar
            endpoint="/api/search/integration-keys"
            placeholder="Search keys by integration name"
            ariaLabel="Search integration keys"
            initialValue={initialFilters.search ?? ''}
            additionalParams={{
              environment: filters.environment !== 'all' ? filters.environment : undefined,
              type: filters.type !== 'all' ? filters.type : undefined,
            }}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Environment</label>
            <SearchableSelect
              options={ENVIRONMENT_OPTIONS}
              value={filters.environment}
              onChange={updateEnvironment}
              placeholder="All environments"
              ariaLabel="Filter by environment"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Integration type</label>
            <SearchableSelect
              options={TYPE_OPTIONS}
              value={filters.type}
              onChange={updateType}
              placeholder="All types"
              ariaLabel="Filter by integration type"
            />
          </div>
        </div>
      </Stack>
    </FilterPanel>
  );
}
