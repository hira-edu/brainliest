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
    const showDefaultIndicator = Boolean(required) && !requiredIndicator;

    return (
      <label
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 text-sm font-medium text-gray-900',
          showDefaultIndicator && "after:ml-0.5 after:text-error-DEFAULT after:content-['*']",
          className
        )}
        data-required={required ? '' : undefined}
        {...props}
      >
        <span>{children}</span>
        {required && requiredIndicator ? (
          <span aria-hidden="true">{requiredIndicator}</span>
        ) : null}
        {!required && optionalHint ? (
          <span className="text-xs font-normal text-gray-500">{optionalHint}</span>
        ) : null}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';
