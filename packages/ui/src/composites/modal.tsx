import { Fragment, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

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
    },
    ref
  ) => (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-modal"
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay
            data-testid="modal-overlay"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                ref={ref}
                className={`w-full transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all ${sizeClasses[size]}`}
              >
                {title ? (
                  <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                ) : null}

                {description ? (
                  <Dialog.Description className="mt-2 text-sm text-gray-600">
                    {description}
                  </Dialog.Description>
                ) : null}

                <div className="mt-4 text-gray-700">{children}</div>

                {footer ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {footer}
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
);

Modal.displayName = 'Modal';
