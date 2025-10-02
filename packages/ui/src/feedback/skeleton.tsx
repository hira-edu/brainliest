import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-gray-200',
  {
    variants: {
      variant: {
        text: 'h-4 w-full',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'rectangular',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
