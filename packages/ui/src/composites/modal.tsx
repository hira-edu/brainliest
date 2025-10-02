"use client";

import { forwardRef, useCallback } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeClasses;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  overlayProps?: ComponentPropsWithoutRef<typeof Dialog.Overlay>;
  contentProps?: ComponentPropsWithoutRef<typeof Dialog.Content>;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      footer,
      size = 'md',
      closeOnOverlayClick = true,
      showCloseButton = true,
      overlayProps,
      contentProps,
    },
    ref
  ) => {
    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open && isOpen) {
          onClose();
        }
      },
      [isOpen, onClose]
    );

    const { className: overlayClassName, ...overlayRest } = overlayProps ?? {};
    const { className: contentClassName, ...contentRest } = contentProps ?? {};

    return (
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-modalBackdrop bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
              overlayClassName
            )}
            {...overlayRest}
          />
          <Dialog.Content
            ref={ref}
            className={cn(
              'fixed left-1/2 top-1/2 z-modal w-[90vw] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl focus:outline-none transition duration-200 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
              sizeClasses[size],
              contentClassName
            )}
          onPointerDownOutside={(event) => {
            if (!closeOnOverlayClick) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (!closeOnOverlayClick) {
              event.preventDefault();
            }
          }}
          {...contentRest}
        >
          {(title || showCloseButton) && (
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {title ? (
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                ) : null}
              </div>
              {showCloseButton ? (
                <Dialog.Close
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  aria-label="Close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </Dialog.Close>
              ) : null}
            </div>
          )}

          {description ? (
            <Dialog.Description className="text-sm text-gray-600">
              {description}
            </Dialog.Description>
          ) : null}

          <div className="mt-4 text-sm text-gray-700">{children}</div>

          {footer ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
);

Modal.displayName = 'Modal';

export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
