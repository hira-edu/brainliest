import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const sectionVariants = cva(
  'w-full',
  {
    variants: {
      spacing: {
        none: '',
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
        xl: 'py-24',
      },
      background: {
        none: '',
        white: 'bg-white',
        gray: 'bg-gray-50',
        primary: 'bg-primary-50',
      },
    },
    defaultVariants: {
      spacing: 'md',
      background: 'none',
    },
  }
);

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, background, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(sectionVariants({ spacing, background }), className)}
        {...props}
      />
    );
  }
);

Section.displayName = 'Section';
