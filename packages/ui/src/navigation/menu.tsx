import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface MenuItem {
  label: ReactNode;
  href: string;
  isActive?: boolean;
  icon?: ReactNode;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

export interface MenuProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: MenuItem[];
  orientation?: 'horizontal' | 'vertical';
  ariaLabel?: string;
  gap?: keyof typeof gapClasses;
}

export const Menu = forwardRef<HTMLElement, MenuProps>(
  (
    {
      className,
      items,
      orientation = 'horizontal',
      ariaLabel = 'Main menu',
      gap = 'md',
      ...props
    },
    ref
  ) => {
    const isHorizontal = orientation === 'horizontal';

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          'flex',
          gapClasses[gap],
          isHorizontal ? 'flex-row items-center' : 'flex-col',
          className
        )}
        {...props}
      >
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={item.isActive ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              item.isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    );
  }
);

Menu.displayName = 'Menu';
