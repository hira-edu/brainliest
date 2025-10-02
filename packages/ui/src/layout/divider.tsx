import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const dividerVariants = cva(
  'border-gray-200',
  {
    variants: {
      orientation: {
        horizontal: 'border-t w-full',
        vertical: 'border-l h-full',
      },
      spacing: {
        none: '',
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        spacing: 'sm',
        className: 'my-2',
      },
      {
        orientation: 'horizontal',
        spacing: 'md',
        className: 'my-4',
      },
      {
        orientation: 'horizontal',
        spacing: 'lg',
        className: 'my-6',
      },
      {
        orientation: 'vertical',
        spacing: 'sm',
        className: 'mx-2',
      },
      {
        orientation: 'vertical',
        spacing: 'md',
        className: 'mx-4',
      },
      {
        orientation: 'vertical',
        spacing: 'lg',
        className: 'mx-6',
      },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      spacing: 'md',
    },
  }
);

export interface DividerProps
  extends React.HTMLAttributes<HTMLHRElement>,
    VariantProps<typeof dividerVariants> {}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation, spacing, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn(dividerVariants({ orientation, spacing }), className)}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
