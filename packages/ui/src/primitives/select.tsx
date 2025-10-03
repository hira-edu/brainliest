"use client";

import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const triggerVariants = cva(
  'inline-flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      state: {
        default: 'border-gray-300 text-gray-800 hover:border-gray-400',
        error: 'border-error-DEFAULT text-gray-800 focus-visible:ring-error-DEFAULT',
        success: 'border-success-DEFAULT text-gray-800 focus-visible:ring-success-DEFAULT',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

const contentClasses = cn(
  'z-dropdown min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl'
);

const itemClasses = cn(
  'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition-colors',
  'data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary-900 data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-900',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
);

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'defaultValue' | 'onChange' | 'value'>,
    VariantProps<typeof triggerVariants> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  name?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Select an option',
      ariaLabel,
      name,
      disabled,
      size,
      state,
      ...rest
    },
    ref
  ) => {
    const firstEnabledOptionValue = useMemo(
      () => options.find((option) => !option.disabled)?.value,
      [options]
    );

    const [internalValue, setInternalValue] = useState<string | undefined>(
      value ?? defaultValue ?? firstEnabledOptionValue
    );

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleChange = useCallback(
      (nextValue: string) => {
        if (value === undefined) {
          setInternalValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
      [onValueChange, value]
    );

    const currentValue = value ?? internalValue;
    const hiddenInputValue = currentValue ?? '';

    const rootProps: SelectPrimitive.SelectProps = {
      onValueChange: handleChange,
      disabled,
      defaultValue: defaultValue ?? firstEnabledOptionValue,
    };

    if (value !== undefined) {
      rootProps.value = value;
    }

    return (
      <SelectPrimitive.Root {...rootProps}>
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(triggerVariants({ size, state }), className)}
          aria-label={ariaLabel}
          aria-invalid={state === 'error' ? true : undefined}
          {...rest}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-gray-400">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.853a.75.75 0 111.08 1.04l-4.249 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={contentClasses}
            position="popper"
            style={{ zIndex: 4000, backgroundColor: '#ffffff' }}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-2 text-gray-500">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.916l-3.71 3.853a.75.75 0 11-1.08-1.04l4.249-4.41a.75.75 0 011.08 0l4.249 4.41a.75.75 0 01-.02 1.06z" />
              </svg>
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="max-h-60 overflow-y-auto p-2">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={itemClasses}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center text-primary-600">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8l2.5 2.5L12 5" />
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-2 text-gray-500">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.853a.75.75 0 111.08 1.04l-4.249 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
              </svg>
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
        {name ? (
          <input type="hidden" name={name} value={hiddenInputValue} />
        ) : null}
      </SelectPrimitive.Root>
    );
  }
);

Select.displayName = 'Select';

export type { VariantProps as SelectVariantProps };
export { triggerVariants as selectTriggerVariants };
