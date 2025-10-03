import * as React from 'react';
import { cn } from '../lib/utils';
import { Radio } from '../primitives/radio';
import { Stack } from '../layout/stack';

export interface PracticeOption {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface PracticeOptionListProps {
  options: PracticeOption[];
  value?: string | null;
  onChange?: (value: string) => void;
  name?: string;
  layout?: 'stacked' | 'compact';
  className?: string;
  legend?: React.ReactNode;
}

export function PracticeOptionList({
  options,
  value,
  onChange,
  name,
  layout = 'stacked',
  className,
  legend,
}: PracticeOptionListProps) {
  const generatedName = React.useId();
  const groupName = name ?? generatedName;
  const handleChange = (optionId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onChange?.(optionId);
  };

  return (
    <fieldset className={cn('space-y-4', className)}>
      {legend ? <legend className="text-sm font-semibold text-gray-900">{legend}</legend> : null}
      <Stack gap={layout === 'compact' ? 2 : 3}>
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow',
              'hover:shadow-sm focus-within:border-primary-500 focus-within:shadow focus-within:shadow-primary-100',
              option.disabled && 'cursor-not-allowed opacity-60'
            )}
            onClick={() => {
              if (option.disabled) {
                return;
              }
              onChange?.(option.id);
            }}
          >
            <Radio
              name={groupName}
              value={option.id}
              checked={value === option.id}
              onChange={handleChange(option.id)}
              disabled={option.disabled}
              aria-label={typeof option.label === 'string' ? option.label : undefined}
            />
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{option.label}</p>
              {option.description ? <p className="text-sm text-gray-600">{option.description}</p> : null}
            </div>
          </label>
        ))}
      </Stack>
    </fieldset>
  );
}
