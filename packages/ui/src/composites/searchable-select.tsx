"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: ReadonlyArray<SearchableSelectOption>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyState?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  emptyState = 'No results found',
  disabled = false,
  ariaLabel = 'Search options',
  searchPlaceholder = 'Search...',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [open]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled) {
        return;
      }

      setOpen(nextOpen);
    },
    [disabled]
  );

  const handleSelect = useCallback(
    (optionValue: string) => {
      const option = options.find((item) => item.value === optionValue);
      if (!option || option.disabled) {
        return;
      }

      onChange(option.value);
      setOpen(false);
    },
    [onChange, options]
  );

  const triggerLabel = selectedOption?.label ?? placeholder;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex w-full min-w-[12rem] items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-400'
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={selectedOption ? `Selected ${selectedOption.label}. ${ariaLabel}` : ariaLabel}
          disabled={disabled}
        >
          <span
            className={cn(
              'flex-1 truncate text-left',
              selectedOption ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            {triggerLabel}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-400" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-dropdown w-72 rounded-xl border border-gray-200 bg-white shadow-xl"
          style={{ zIndex: 4000, backgroundColor: '#ffffff' }}
          sideOffset={8}
          align="start"
        >
          <Command label={ariaLabel} loop className="flex w-full flex-col bg-transparent">
            <CommandInput
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
              aria-label={ariaLabel}
              aria-controls={listId}
              aria-expanded={open}
              role="combobox"
              className="w-full border-b border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus-visible:outline-none focus-visible:ring-0"
            />
            <CommandList id={listId} className="max-h-60 overflow-y-auto py-2">
              <CommandEmpty className="px-3 py-6 text-center text-sm text-gray-500">
                {emptyState}
              </CommandEmpty>
              <CommandGroup className="px-2">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    keywords={
                      typeof option.description === 'string'
                        ? [option.description]
                        : undefined
                    }
                    onSelect={handleSelect}
                    className="flex w-full cursor-pointer select-none items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-900"
                  >
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-xs text-gray-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {option.value === value ? (
                      <Check className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
