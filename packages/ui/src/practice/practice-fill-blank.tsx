import * as React from 'react';
import { Input } from '../primitives/input';
import { cn } from '../lib/utils';

export interface PracticeFillBlankProps extends React.ComponentProps<typeof Input> {
  label?: string;
  helperText?: string;
}

export const PracticeFillBlank = React.forwardRef<HTMLInputElement, PracticeFillBlankProps>(
  ({ label, helperText, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn('space-y-2', className)}>
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
            {label}
          </label>
        ) : null}
        <Input ref={ref} id={inputId} {...props} />
        {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
      </div>
    );
  }
);

PracticeFillBlank.displayName = 'PracticeFillBlank';
