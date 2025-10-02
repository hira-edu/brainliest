import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  ariaLabel?: string;
}

const defaultSeparator = (
  <span className="mx-2 text-sm text-gray-300" aria-hidden="true">
    /
  </span>
);

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, separator = defaultSeparator, ariaLabel = 'Breadcrumb', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cn('flex w-full items-center text-sm text-gray-600', className)}
        {...props}
      >
        <ol className="flex flex-wrap items-center">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isCurrent = item.isCurrent ?? isLast;

            return (
              <li key={index} className="flex items-center">
                {item.icon ? (
                  <span className="mr-1 flex items-center text-gray-400" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}

                {item.href && !isCurrent ? (
                  <a
                    href={item.href}
                    className="text-gray-600 transition-colors hover:text-gray-900"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={cn('text-gray-900', isCurrent ? 'font-semibold' : undefined)}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}

                {!isLast && <span className="flex items-center">{separator}</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';
