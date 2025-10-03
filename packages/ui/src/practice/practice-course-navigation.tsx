import * as React from 'react';
import { cn } from '../lib/utils';
import { Sidebar, type SidebarItem } from '../navigation/sidebar';
import { Menu, type MenuItem, type MenuProps } from '../navigation/menu';

export interface PracticeCourseNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  courseLabel: React.ReactNode;
  collectionLabel: React.ReactNode;
  sidebarItems: SidebarItem[];
  menuItems: MenuItem[];
  footerAction?: React.ReactNode;
  menuDescription?: React.ReactNode;
  menuTitle?: React.ReactNode;
  menuProps?: Omit<MenuProps, 'items'>;
}

export function PracticeCourseNavigation({
  courseLabel,
  collectionLabel,
  sidebarItems,
  menuItems,
  footerAction,
  menuDescription = 'Use the menu for quick filters or secondary navigation inside the main content column.',
  menuTitle = 'Quick filters',
  menuProps,
  className,
  ...rest
}: PracticeCourseNavigationProps) {
  return (
    <div
      className={cn('grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]', className)}
      {...rest}
    >
      <Sidebar
        items={sidebarItems}
        header={
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{courseLabel}</p>
            <h3 className="text-lg font-semibold text-gray-900">{collectionLabel}</h3>
          </div>
        }
        footer={footerAction ? <div className="pt-2">{footerAction}</div> : undefined}
      />

      <div className="space-y-4 rounded-2xl border border-dashed border-gray-200 p-6">
        {menuTitle ? (
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{menuTitle}</h4>
        ) : null}
        <Menu items={menuItems} ariaLabel="Course navigation" gap="md" orientation="horizontal" {...menuProps} />
        {menuDescription ? <p className="text-sm text-gray-600">{menuDescription}</p> : null}
      </div>
    </div>
  );
}

PracticeCourseNavigation.displayName = 'PracticeCourseNavigation';
