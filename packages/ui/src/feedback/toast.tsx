import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cn } from '../lib/utils';

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = forwardRef<ElementRef<typeof ToastPrimitives.Viewport>, ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(\
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

export const Toast = forwardRef<ElementRef<typeof ToastPrimitives.Root>, ComponentPropsWithoutRef<typeof ToastPrimitives.Root>>(\
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        'group relative grid w-full gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-xl',
        'data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-right',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-swipe-out',
        className
      )}
      {...props}
    />
  )
);
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastTitle = forwardRef<ElementRef<typeof ToastPrimitives.Title>, ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(\
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('text-sm font-semibold text-gray-900', className)}
      {...props}
    />
  )
);
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = forwardRef<ElementRef<typeof ToastPrimitives.Description>, ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(\
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description
      ref={ref}
      className={cn('text-sm text-gray-600', className)}
      {...props}
    />
  )
);
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export const ToastClose = forwardRef<ElementRef<typeof ToastPrimitives.Close>, ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(\
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
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

export const ToastAction = ToastPrimitives.Action;

