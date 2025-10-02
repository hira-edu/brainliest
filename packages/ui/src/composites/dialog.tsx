"use client";

import { forwardRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';

export interface DialogAction {
  id: string;
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const actionClasses: Record<NonNullable<DialogAction['variant']>, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
};

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: DialogAction[];
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ isOpen, onClose, title, description, children, actions = [] }, ref) => {
    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open && isOpen) {
          onClose();
        }
      },
      [isOpen, onClose]
    );

    return (
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-modalBackdrop bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
          <DialogPrimitive.Content
            ref={ref}
            className="fixed left-1/2 top-1/2 z-modal w-[90vw] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out"
          >
          {title ? (
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
              {title}
            </DialogPrimitive.Title>
          ) : null}

          {description ? (
            <DialogPrimitive.Description className="mt-2 text-sm text-gray-600">
              {description}
            </DialogPrimitive.Description>
          ) : null}

          {children ? (
            <div className="mt-4 text-sm text-gray-700">{children}</div>
          ) : null}

          {actions.length > 0 ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    actionClasses[action.variant ?? 'primary'],
                    action.disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);

Dialog.displayName = 'Dialog';
