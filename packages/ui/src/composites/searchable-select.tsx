"use client";

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Command as CommandRoot,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import { Button } from '../primitives/button';
import { cn } from '../lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyState?: ReactNode;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  emptyState = 'No results found',
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="min-w-[12rem] justify-between"
        >
          <span className={cn(selected ? 'text-gray-900' : 'text-gray-400')}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className="h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.853a.75.75 0 111.08 1.04l-4.249 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-dropdown w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          sideOffset={8}
        >
          <CommandRoot
            label="Search options"
            className="flex flex-col"
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput
              placeholder="Search..."
              className="h-12 border-b border-gray-200 px-3 text-sm focus:outline-none"
            />
            <CommandList className="max-h-60 overflow-y-auto py-2">
              <CommandEmpty className="px-3 py-6 text-center text-sm text-gray-500">
                {emptyState}
              </CommandEmpty>
              <CommandGroup heading="Options" className="px-2">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer select-none flex-col gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-900"
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.description ? (
                      <span className="text-xs text-gray-500">{option.description}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandRoot>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
