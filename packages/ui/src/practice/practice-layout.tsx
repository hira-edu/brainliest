import * as React from 'react';
import { cn } from '../lib/utils';

export interface PracticeLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  sidebarClassName?: string;
}

export function PracticeLayout({
  children,
  sidebar,
  className,
  contentClassName,
  sidebarClassName,
}: PracticeLayoutProps) {
  return (
    <div
      className={cn(
        'grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]',
        'xl:grid-cols-[minmax(0,1fr)_360px]',
        className
      )}
    >
      <div className={cn('space-y-6', contentClassName)}>{children}</div>
      {sidebar ? (
        <aside className={cn('space-y-4 lg:sticky lg:top-28', sidebarClassName)}>{sidebar}</aside>
      ) : null}
    </div>
  );
}
