import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const stackVariants = cva(
  'flex',
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse',
      },
      gap: {
        '0': 'gap-0',
        '1': 'gap-1',
        '2': 'gap-2',
        '3': 'gap-3',
        '4': 'gap-4',
        '6': 'gap-6',
        '8': 'gap-8',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
      },
    },
    defaultVariants: {
      direction: 'col',
      gap: '4',
      align: 'stretch',
      justify: 'start',
    },
  }
);

type StackGap = VariantProps<typeof stackVariants>['gap'];

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof stackVariants>, 'gap'> {
  gap?: StackGap | number;
}

const normalizeGap = (gap?: StackProps['gap']): StackGap | undefined => {
  if (gap === undefined) {
    return undefined;
  }

  if (typeof gap === 'number') {
    return String(gap) as StackGap;
  }

  return gap;
};

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, gap, align, justify, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ direction, gap: normalizeGap(gap), align, justify }), className)}
        {...props}
      />
    );
  }
);

Stack.displayName = 'Stack';
