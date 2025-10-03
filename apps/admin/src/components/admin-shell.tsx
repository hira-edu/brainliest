'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Badge,
  Breadcrumbs,
  type BreadcrumbItem,
  Button,
  Header,
  type MenuItem,
  Icon,
  Sidebar,
  type SidebarItem,
  cn,
} from '@brainliest/ui';
import type { AdminNavSectionConfig } from '@/config/navigation';
import { ADMIN_NAV_SECTIONS, resolveAdminNavItems } from '@/config/navigation';

export interface AdminShellProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: ReadonlyArray<BreadcrumbItem>;
  readonly headerActions?: React.ReactNode;
  readonly pageActions?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly navSections?: ReadonlyArray<AdminNavSectionConfig>;
}

const BRAND_NAME = 'Brainliest Admin';

export function AdminShell({
  title,
  description,
  breadcrumbs,
  headerActions,
  pageActions,
  children,
  navSections = ADMIN_NAV_SECTIONS,
}: AdminShellProps) {
  const pathname = usePathname() ?? '/dashboard';
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const resolvedNavItems = useMemo(
    () => resolveAdminNavItems(navSections, pathname),
    [navSections, pathname]
  );

  const sidebarItems = useMemo<SidebarItem[]>(
    () =>
      resolvedNavItems.map((item) => ({
        href: item.href,
        isActive: item.isActive,
        label: (
          <span className="flex items-center gap-3">
            {item.icon ? <Icon name={item.icon} className="h-4 w-4 text-gray-400" aria-hidden="true" /> : null}
            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
            {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
          </span>
        ),
      })),
    [resolvedNavItems]
  );

  const headerNavigation = useMemo<MenuItem[]>(
    () =>
      resolvedNavItems.slice(0, 6).map((item) => ({
        href: item.href,
        label: item.label,
        isActive: item.isActive,
      })),
    [resolvedNavItems]
  );

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const sidebar = (
    <Sidebar
      items={sidebarItems}
      header={
        <Link href="/dashboard" prefetch={false} className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon name="LayoutDashboard" className="h-5 w-5 text-primary-600" aria-hidden="true" />
          <span>{BRAND_NAME}</span>
        </Link>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Environment</span>
          <Badge variant="secondary">Production</Badge>
        </div>
      }
      className="h-full w-full"
    />
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden h-full lg:block lg:w-72 lg:flex-shrink-0">
        <div className="sticky top-0 h-screen p-4">
          {sidebar}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <Header
          logo={
            <Link href="/dashboard" prefetch={false} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Icon name="LayoutDashboard" className="h-5 w-5 text-primary-600" aria-hidden="true" />
              <span>{BRAND_NAME}</span>
            </Link>
          }
          navigation={headerNavigation}
          actions={
            <div className="flex items-center gap-3">
              {headerActions}
              <Button asChild variant="secondary" size="sm">
                <Link href="/settings/system" prefetch={false}>
                  Settings
                </Link>
              </Button>
            </div>
          }
          isMenuOpen={isMobileNavOpen}
          onMenuToggle={() => setIsMobileNavOpen((prev) => !prev)}
          className="border-none bg-white shadow-sm"
        />

        {isMobileNavOpen ? (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-gray-900/60" aria-hidden="true" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative ml-0 flex h-full w-72 max-w-full flex-shrink-0 p-4">
              {sidebar}
            </div>
          </div>
        ) : null}

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pb-12 pt-8">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <Breadcrumbs items={breadcrumbs.map((item, index) => ({ ...item, isCurrent: item.isCurrent ?? index === breadcrumbs.length - 1 }))} />
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
                {description ? <p className="text-gray-600">{description}</p> : null}
              </div>
              {pageActions ? <div className="flex flex-col items-stretch gap-3 sm:flex-row">{pageActions}</div> : null}
            </div>

            <section className={cn('space-y-6', pageActions ? 'mt-4' : undefined)}>{children}</section>
          </div>
        </main>
      </div>
    </div>
  );
}
