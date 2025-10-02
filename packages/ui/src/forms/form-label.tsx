import { forwardRef } from 'react';
import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  requiredIndicator?: ReactNode;
  optionalHint?: ReactNode;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  (
    { className, children, required, requiredIndicator, optionalHint, ...props },
    ref
  ) => {
    const indicator = required
      ? requiredIndicator ?? (
          <span className="text-error-DEFAULT" aria-hidden="true">
            *
          </span>
        )
      : optionalHint
      ? <span className="text-xs font-normal text-gray-500">{optionalHint}</span>
      : null;

    return (
      <label
        ref={ref}
        className={cn('flex items-center gap-1 text-sm font-medium text-gray-900', className)}
        {...props}
      >
        <span>{children}</span>
        {indicator}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';
