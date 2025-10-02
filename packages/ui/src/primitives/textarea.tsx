import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      state: {
        default: '',
        error: 'border-error-DEFAULT focus-visible:ring-error-DEFAULT',
        success: 'border-success-DEFAULT focus-visible:ring-success-DEFAULT',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      state: 'default',
      resize: 'vertical',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, resize, ...props }, ref) => {
    const isError = state === 'error';

    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ state, resize }), className)}
        aria-invalid={isError}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { textareaVariants };
