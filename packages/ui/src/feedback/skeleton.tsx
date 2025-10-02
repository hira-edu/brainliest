import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
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
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  announce?: string | false;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, announce = 'Loading…', ...props }, ref) => {
    const accessibilityProps =
      announce === false
        ? { 'aria-hidden': true }
        : {
            role: 'status' as const,
            'aria-live': 'polite' as const,
            'aria-busy': 'true' as const,
            'aria-label': announce,
          };

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant }), className)}
        {...accessibilityProps}
        {...props}
      >
        {announce && announce !== '' ? (
          <span className="sr-only">{announce}</span>
        ) : null}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';
