import { Fragment, forwardRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import type { ReactNode } from 'react';

export interface DialogAction {
  id: string;
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: DialogAction[];
}

const actionClasses: Record<NonNullable<DialogAction['variant']>, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
};

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ isOpen, onClose, title, description, children, actions = [] }, ref) => (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-modal"
        onClose={onClose}
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
          <HeadlessDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                ref={ref}
                className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
              >
                {title ? (
                  <HeadlessDialog.Title className="text-lg font-semibold text-gray-900">
                    {title}
                  </HeadlessDialog.Title>
                ) : null}

                {description ? (
                  <HeadlessDialog.Description className="mt-2 text-sm text-gray-600">
                    {description}
                  </HeadlessDialog.Description>
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
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${actionClasses[action.variant ?? 'primary']}`}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
);

Dialog.displayName = 'Dialog';
