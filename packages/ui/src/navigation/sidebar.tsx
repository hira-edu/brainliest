import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface SidebarItem {
  label: ReactNode;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
}

export interface SidebarProps extends Omit<HTMLAttributes<aside>, 'children'> {
  header?: ReactNode;
  footer?: ReactNode;
  items: SidebarItem[];
  ariaLabel?: string;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, header, footer, items, ariaLabel = 'Sidebar', ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn('flex h-full w-72 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm', className)}
        {...props}
      >
        {header ? (
          <div className="border-b border-gray-200 px-6 py-5">
            {header}
          </div>
        ) : null}

        <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = Boolean(item.isActive);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {item.icon ? (
                      <span className="flex h-5 w-5 items-center justify-center text-gray-400" aria-hidden="true">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="flex-1 truncate">
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="text-xs font-medium text-gray-500">{item.badge}</span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {footer ? (
          <div className="border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';
