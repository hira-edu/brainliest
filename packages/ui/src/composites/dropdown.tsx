import { createContext, forwardRef, useContext } from 'react';
import { Menu, Transition } from '@headlessui/react';
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Fragment } from 'react';
import { cn } from '../lib/utils';
import { Button } from '../primitives/button';

interface DropdownContextValue {
  align: 'start' | 'end';
}

const DropdownContext = createContext<DropdownContextValue>({ align: 'start' });

export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  trigger: ReactNode;
  align?: 'start' | 'end';
  children: ReactNode;
}

export const Dropdown = ({ trigger, align = 'start', children, className, ...props }: DropdownProps) => (
  <DropdownContext.Provider value={{ align }}>
    <Menu as="div" className={cn('relative inline-block text-left', className)} {...props}>
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={({ open }) =>
            cn(
              'absolute z-dropdown mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl focus:outline-none',
              align === 'end' ? 'right-0' : 'left-0'
            )
          }
        >
          {children}
        </Menu.Items>
      </Transition>
    </Menu>
  </DropdownContext.Provider>
);

Dropdown.displayName = 'Dropdown';

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  icon?: ReactNode;
  shortcut?: ReactNode;
  href?: string;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, inset, icon, shortcut, href, children, ...props }, ref) => (
    <Menu.Item>
      {({ active, disabled }) => {
        const baseClasses = cn(
          'flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors',
          inset ? 'pl-8' : 'pl-2',
          active ? 'bg-primary-50 text-primary-900' : 'text-gray-700',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className
        );

        if (href && !disabled) {
          return (
            <a href={href} className={baseClasses} role="menuitem">
              <span className="flex items-center gap-2">
                {icon ? <span className="text-gray-400" aria-hidden="true">{icon}</span> : null}
                {children}
              </span>
              {shortcut ? (
                <span className="text-xs text-gray-400">{shortcut}</span>
              ) : null}
            </a>
          );
        }

        return (
          <button
            ref={ref}
            type="button"
            className={baseClasses}
            disabled={disabled}
            {...props}
          >
            <span className="flex items-center gap-2">
              {icon ? <span className="text-gray-400" aria-hidden="true">{icon}</span> : null}
              {children}
            </span>
            {shortcut ? (
              <span className="text-xs text-gray-400">{shortcut}</span>
            ) : null}
          </button>
        );
      }}
    </Menu.Item>
  )
);

DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = () => (
  <div role="separator" className="my-1 h-px w-full bg-gray-200" />
);

DropdownSeparator.displayName = 'DropdownSeparator';

export const DropdownLabel = ({ children }: { children: ReactNode }) => (
  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
    {children}
  </div>
);

DropdownLabel.displayName = 'DropdownLabel';

export const DropdownTriggerButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => (
    <Button ref={ref} variant="ghost" {...props}>
      {children}
    </Button>
  )
);

DropdownTriggerButton.displayName = 'DropdownTriggerButton';
