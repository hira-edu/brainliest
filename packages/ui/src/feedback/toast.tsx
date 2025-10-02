import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitives.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        'fixed bottom-6 right-6 z-toast flex max-h-screen w-full max-w-sm flex-col gap-3',
        'p-0 outline-none sm:bottom-8 sm:right-8',
        className
      )}
      {...props}
    />
  )
);
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group relative grid w-full gap-2 rounded-xl border p-4 shadow-xl transition-colors',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white text-gray-900',
        success: 'border-success-DEFAULT bg-success-light/10 text-success-dark',
        warning: 'border-warning-DEFAULT bg-warning-light/10 text-warning-dark',
        error: 'border-error-DEFAULT bg-error-light/10 text-error-dark',
        info: 'border-info-DEFAULT bg-info-light/10 text-info-dark',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const toastAnimationClasses = cn(
  'data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-right',
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-swipe-out'
);

export interface ToastProps
  extends ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {}

export const Toast = forwardRef<ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => {
    const resolvedVariant = variant ?? 'default';

    return (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant: resolvedVariant }), toastAnimationClasses, className)}
        data-variant={resolvedVariant}
        role="status"
        {...props}
      />
    );
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitives.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('text-sm font-semibold text-current', className)}
      {...props}
    />
  )
);
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitives.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description
      ref={ref}
      className={cn(
        'text-sm text-gray-600 group-data-[variant=success]:text-success-dark group-data-[variant=warning]:text-warning-dark group-data-[variant=error]:text-error-dark group-data-[variant=info]:text-info-dark',
        className
      )}
      {...props}
    />
  )
);
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitives.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'group-data-[variant=success]:text-success-dark group-data-[variant=success]:hover:bg-success-light/20 group-data-[variant=success]:hover:text-success-dark',
        'group-data-[variant=warning]:text-warning-dark group-data-[variant=warning]:hover:bg-warning-light/20 group-data-[variant=warning]:hover:text-warning-dark',
        'group-data-[variant=error]:text-error-dark group-data-[variant=error]:hover:bg-error-light/20 group-data-[variant=error]:hover:text-error-dark',
        'group-data-[variant=info]:text-info-dark group-data-[variant=info]:hover:bg-info-light/20 group-data-[variant=info]:hover:text-info-dark',
        className
      )}
      {...props}
    >
      <span className="sr-only">Close</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </ToastPrimitives.Close>
  )
);
ToastClose.displayName = ToastPrimitives.Close.displayName;

export const ToastAction = forwardRef<
  ElementRef<typeof ToastPrimitives.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        'group-data-[variant=success]:bg-success-DEFAULT group-data-[variant=success]:hover:bg-success-dark group-data-[variant=success]:focus-visible:ring-success-dark',
        'group-data-[variant=warning]:bg-warning-DEFAULT group-data-[variant=warning]:hover:bg-warning-dark group-data-[variant=warning]:focus-visible:ring-warning-dark',
        'group-data-[variant=error]:bg-error-DEFAULT group-data-[variant=error]:hover:bg-error-dark group-data-[variant=error]:focus-visible:ring-error-dark',
        'group-data-[variant=info]:bg-info-DEFAULT group-data-[variant=info]:hover:bg-info-dark group-data-[variant=info]:focus-visible:ring-info-dark',
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = ToastPrimitives.Action.displayName;
