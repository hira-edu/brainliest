import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface FooterLink {
  label: ReactNode;
  href: string;
}

export interface FooterColumn {
  title?: ReactNode;
  links: FooterLink[];
}

export interface FooterProps extends Omit<HTMLAttributes<footer>, 'children'> {
  brand?: ReactNode;
  columns?: FooterColumn[];
  bottom?: ReactNode;
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ className, brand, columns = [], bottom, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn('border-t border-gray-200 bg-gray-50', className)}
        {...props}
      >
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)]">
            {brand ? (
              <div className="text-sm text-gray-600">
                {brand}
              </div>
            ) : null}

            {columns.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-3">
                    {column.title ? (
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        {column.title}
                      </h4>
                    ) : null}
                    <ul className="space-y-2 text-sm text-gray-600">
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            className="transition-colors hover:text-gray-900"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {bottom ? (
            <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
              {bottom}
            </div>
          ) : null}
        </div>
      </footer>
    );
  }
);

Footer.displayName = 'Footer';
