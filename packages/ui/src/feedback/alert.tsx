import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 text-gray-900',
        info: 'bg-info-light/10 border-info-DEFAULT text-info-dark',
        success: 'bg-success-light/10 border-success-DEFAULT text-success-dark',
        warning: 'bg-warning-light/10 border-warning-DEFAULT text-warning-dark',
        error: 'bg-error-light/10 border-error-DEFAULT text-error-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {title && (
          <h5 className="mb-1 font-medium leading-none tracking-tight">
            {title}
          </h5>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
