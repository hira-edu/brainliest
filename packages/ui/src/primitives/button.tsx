import { Slot } from '@radix-ui/react-slot';
import { forwardRef, Children } from 'react';
import type { Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
        outline: 'border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
        danger: 'bg-error-DEFAULT text-white hover:bg-error-dark focus-visible:ring-error-DEFAULT',
        success: 'bg-success-DEFAULT text-white hover:bg-success-dark focus-visible:ring-success-DEFAULT',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = 'button',
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const resolvedDisabled = Boolean(disabled) || isLoading;
    const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';
    const leadingContent = isLoading ? (
      <Spinner size={spinnerSize} aria-hidden="true" />
    ) : (
      leftIcon
    );

    if (asChild) {
      const singleChild = Children.only(children);

      return (
        <Slot
          ref={ref as Ref<HTMLElement>}
          className={cn(buttonVariants({ variant, size, fullWidth }), className)}
          aria-busy={isLoading}
          data-disabled={resolvedDisabled ? '' : undefined}
          {...props}
        >
          {singleChild}
        </Slot>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={resolvedDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {leadingContent ? (
          <span className="inline-flex items-center">
            {leadingContent}
          </span>
        ) : null}
        <span className="inline-flex items-center justify-center">
          {children}
        </span>
        {!isLoading && rightIcon ? (
          <span className="inline-flex items-center" aria-hidden>
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
