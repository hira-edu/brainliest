import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, noValidate = true, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn('space-y-6', className)}
        noValidate={noValidate}
        {...props}
      />
    );
  }
);

Form.displayName = 'Form';
