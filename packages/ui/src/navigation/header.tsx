import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Menu, type MenuItem } from './menu';
import { MenuButton } from './menu-button';

export interface HeaderProps extends Omit<HTMLAttributes<header>, 'children'> {
  logo?: ReactNode;
  navigation?: MenuItem[];
  actions?: ReactNode;
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, logo, navigation, actions, isMenuOpen, onMenuToggle, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-sticky w-full border-b border-gray-200 bg-white/95 backdrop-blur',
          className
        )}
        {...props}
      >
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {onMenuToggle ? (
              <MenuButton isOpen={isMenuOpen} onClick={onMenuToggle} className="lg:hidden" />
            ) : null}
            {logo ? (
              <div className="text-base font-semibold text-gray-900">{logo}</div>
            ) : null}
          </div>

          {navigation ? (
            <Menu items={navigation} className="hidden lg:flex" ariaLabel="Primary navigation" />
          ) : null}

          <div className="flex items-center gap-3">
            {actions}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
