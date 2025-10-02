import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

export interface MenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  srLabel?: string;
}

export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ className, isOpen = false, srLabel = 'Toggle navigation', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        aria-label={srLabel}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors',
          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        <span className="sr-only">{srLabel}</span>
        <span
          aria-hidden="true"
          className={cn(
            'relative block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-in-out',
            isOpen ? 'translate-y-1.5 rotate-45' : '-translate-y-1.5'
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'block h-0.5 w-5 rounded-full bg-current transition-opacity duration-200 ease-in-out',
            isOpen ? 'opacity-0' : 'opacity-100'
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-in-out',
            isOpen ? '-translate-y-1.5 -rotate-45' : 'translate-y-1.5'
          )}
        />
      </button>
    );
  }
);

MenuButton.displayName = 'MenuButton';
