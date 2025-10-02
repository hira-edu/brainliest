import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-2',
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
        xl: 'h-12 w-12 border-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    { className, size, label = 'Loading...', role: roleProp, 'aria-hidden': ariaHidden, 'aria-label': ariaLabelProp, ...rest },
    ref
  ) => {
    const isHidden = ariaHidden === true || ariaHidden === 'true';
    const role = isHidden ? undefined : roleProp ?? 'status';
    const ariaLabel = isHidden ? undefined : ariaLabelProp ?? label;

    return (
      <div
        ref={ref}
        role={role}
        aria-hidden={ariaHidden}
        aria-label={ariaLabel}
        className={cn(spinnerVariants({ size }), className)}
        {...rest}
      >
        {isHidden ? null : <span className="sr-only">{label}</span>}
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
