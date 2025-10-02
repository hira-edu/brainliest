import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface FormErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  icon?: ReactNode;
}

export const FormError = forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'text-sm text-error-DEFAULT',
          icon ? 'flex items-center gap-2' : undefined,
          className
        )}
        {...props}
      >
        {icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : null}
        {children}
      </p>
    );
  }
);

FormError.displayName = 'FormError';
