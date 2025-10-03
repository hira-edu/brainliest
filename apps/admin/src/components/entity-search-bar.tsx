'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@brainliest/ui';

interface EntitySearchBarProps {
  readonly endpoint: string;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly initialValue?: string;
  readonly paramKey?: string;
  readonly limit?: number;
  readonly additionalParams?: Record<string, string | undefined>;
}

interface Suggestion {
  readonly value: string;
  readonly label?: string;
}

interface SuggestionResponse {
  readonly suggestions?: ReadonlyArray<{ readonly value?: unknown; readonly label?: unknown }>;
}

const MIN_QUERY_LENGTH = 2;

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const extractSuggestions = (payload: unknown): Suggestion[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const maybeSuggestions = (payload as SuggestionResponse).suggestions;
  if (!Array.isArray(maybeSuggestions)) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  for (const item of maybeSuggestions) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const value = (item as { value?: unknown }).value;
    if (typeof value !== 'string') {
      continue;
    }

    const label = (item as { label?: unknown }).label;
    suggestions.push({
      value,
      ...(typeof label === 'string' ? { label } : {}),
    });
  }

  return suggestions;
};

const buildRequestUrl = (
  endpoint: string,
  query: string,
  limit: number,
  additionalParams?: Record<string, string | undefined>
): string => {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('limit', String(limit));

  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return `${base}?${params.toString()}`;
};

export function EntitySearchBar({
  endpoint,
  placeholder,
  ariaLabel,
  initialValue = '',
  paramKey = 'search',
  limit = 6,
  additionalParams,
}: EntitySearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const datalistId = useId();
  const serializedAdditionalParams = useMemo(() => JSON.stringify(additionalParams ?? {}), [additionalParams]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsLoading(true);

    const parsedParams = JSON.parse(serializedAdditionalParams) as Record<string, string | undefined>;
    const url = buildRequestUrl(endpoint, trimmed, limit, parsedParams);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load suggestions');
        }
        const payload: unknown = await response.json().catch(() => null);
        setSuggestions(extractSuggestions(payload));
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error(error);
          setSuggestions([]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [endpoint, limit, serializedAdditionalParams, value]);

  const updateQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      const trimmed = nextValue.trim();
      if (trimmed.length === 0) {
        params.delete(paramKey);
      } else {
        params.set(paramKey, trimmed);
      }
      params.delete('page');
      const queryString = params.toString();
      router.push(queryString.length > 0 ? `${pathname}?${queryString}` : pathname);
    },
    [paramKey, pathname, router, searchParams]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateQuery(value);
    },
    [updateQuery, value]
  );

  const handleClear = useCallback(() => {
    setValue('');
    setSuggestions([]);
    updateQuery('');
  }, [updateQuery]);

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          type="search"
          name={paramKey}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          list={datalistId}
          aria-label={ariaLabel}
          className="flex-1"
        />
        <datalist id={datalistId}>
          {suggestions.map((suggestion) => (
            <option key={`${suggestion.value}-${suggestion.label ?? 'value'}`} value={suggestion.value} label={suggestion.label} />
          ))}
        </datalist>
      </div>
      <div className="flex items-center gap-2">
        {value.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isLoading}>
          Search
        </Button>
      </div>
    </form>
  );
}
