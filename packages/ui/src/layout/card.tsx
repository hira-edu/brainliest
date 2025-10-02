import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const cardContainerVariants = cva(
  'rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md',
  {
    variants: {
      variant: {
        default: '',
        outlined: 'border-2 border-gray-300 shadow-none',
        elevated: 'shadow-lg hover:shadow-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const paddingMap = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

const sectionPaddingMap = {
  none: 'px-0 py-0',
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-5',
} as const;

type PaddingKey = keyof typeof paddingMap;

type SectionPaddingKey = keyof typeof sectionPaddingMap;

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContainerVariants> {
  padding?: PaddingKey;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sectionPadding?: SectionPaddingKey;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding = 'md',
      header,
      footer,
      sectionPadding,
      children,
      ...props
    },
    ref
  ) => {
    const contentPadding = paddingMap[padding];
    const headerPadding = sectionPaddingMap[sectionPadding ?? padding];

    return (
      <div
        ref={ref}
        className={cn(cardContainerVariants({ variant }), className)}
        {...props}
      >
        {header ? (
          <div className={cn('border-b border-gray-200', headerPadding)}>
            {header}
          </div>
        ) : null}
        <div className={cn(contentPadding)}>
          {children}
        </div>
        {footer ? (
          <div className={cn('border-t border-gray-200', headerPadding)}>
            {footer}
          </div>
        ) : null}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { cardContainerVariants };
