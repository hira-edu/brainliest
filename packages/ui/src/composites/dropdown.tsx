"use client";

import { forwardRef, isValidElement } from 'react';
import type {
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  Ref,
  PropsWithChildren,
} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';
import { Button } from '../primitives/button';

type DropdownItemElement = HTMLButtonElement | HTMLAnchorElement;

export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  trigger: ReactNode;
  align?: 'start' | 'center' | 'end';
  children: ReactNode;
}

export const Dropdown = ({ trigger, align = 'end', children, className, ...props }: DropdownProps) => (
  <DropdownMenu.Root>
    <div className={cn('relative inline-block text-left', className)} {...props}>
      <DropdownMenu.Trigger asChild>
        {isValidElement(trigger) ? trigger : <span>{trigger}</span>}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align={align}
          sideOffset={8}
          className="z-dropdown min-w-[14rem] origin-[var(--radix-dropdown-menu-content-transform-origin)] transform overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl outline-none transition duration-150 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:scale-95"
          style={{ zIndex: 4000, backgroundColor: '#ffffff' }}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </div>
  </DropdownMenu.Root>
);

Dropdown.displayName = 'Dropdown';

interface DropdownItemCommonProps {
  inset?: boolean;
  icon?: ReactNode;
  shortcut?: ReactNode;
  onSelect?: DropdownMenuItemProps['onSelect'];
  disabled?: boolean;
}

type DropdownItemButtonProps = DropdownItemCommonProps &
  PropsWithChildren<Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>> & {
    href?: undefined;
  };

type DropdownItemAnchorProps = DropdownItemCommonProps &
  PropsWithChildren<Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>> & {
    href: string;
  };

export type DropdownItemProps = DropdownItemButtonProps | DropdownItemAnchorProps;

export const DropdownItem = forwardRef<DropdownItemElement, DropdownItemProps>(
  ({ className, inset, icon, shortcut, href, disabled, children, onSelect, ...props }, forwardedRef) => {
    const baseClasses = cn(
      'flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-900 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 cursor-pointer',
      inset ? 'pl-8' : 'pl-2',
      className
    );

    const content = (
      <span className="flex w-full items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          {icon ? (
            <span className="text-gray-400" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span className="text-current">{children}</span>
        </span>
        {shortcut ? <span className="text-xs text-gray-400">{shortcut}</span> : null}
      </span>
    );

    if (href) {
      return (
        <DropdownMenu.Item asChild disabled={disabled} onSelect={onSelect}>
          <a
            ref={forwardedRef as Ref<HTMLAnchorElement>}
            href={href}
            className={baseClasses}
            {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            {content}
          </a>
        </DropdownMenu.Item>
      );
    }

    return (
      <DropdownMenu.Item asChild disabled={disabled} onSelect={onSelect}>
        <button
          ref={forwardedRef as Ref<HTMLButtonElement>}
          type="button"
          className={baseClasses}
          disabled={disabled}
          {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {content}
        </button>
      </DropdownMenu.Item>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = () => (
  <DropdownMenu.Separator className="my-1 h-px w-full bg-gray-200" />
);

DropdownSeparator.displayName = 'DropdownSeparator';

export const DropdownLabel = ({ children }: { children: ReactNode }) => (
  <DropdownMenu.Label className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
    {children}
  </DropdownMenu.Label>
);

DropdownLabel.displayName = 'DropdownLabel';

export const DropdownTriggerButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <Button ref={ref} variant="ghost" className={className} {...props}>
      {children}
    </Button>
  )
);

DropdownTriggerButton.displayName = 'DropdownTriggerButton';
