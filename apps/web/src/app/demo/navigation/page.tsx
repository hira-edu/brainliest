'use client';

import { useState } from 'react';
import {
  Badge,
  Breadcrumbs,
  Button,
  Footer,
  Header,
  Icon,
  Input,
  Menu,
  MenuButton,
  Sidebar,
  Stack,
} from '@brainliest/ui';
import type { MenuItem, SidebarItem } from '@brainliest/ui';

const brand = (
  <div className="flex items-center gap-2 text-gray-900">
    <Icon name="GraduationCap" className="text-primary-600" />
    <span className="text-lg font-semibold">Brainliest</span>
  </div>
);

const dashboardNavigation: MenuItem[] = [
  { label: 'Overview', href: '#overview', isActive: true },
  { label: 'Practice', href: '#practice' },
  { label: 'Reports', href: '#reports' },
  { label: 'Settings', href: '#settings' },
];

const sidebarItems: SidebarItem[] = [
  { label: 'Assignments', href: '#assignments', isActive: true, icon: <Icon name="Notebook" /> },
  { label: 'Bookmarks', href: '#bookmarks', badge: <Badge size="sm">14</Badge>, icon: <Icon name="Bookmark" /> },
  { label: 'Flagged questions', href: '#flagged', icon: <Icon name="Flag" /> },
  { label: 'Analytics', href: '#analytics', icon: <Icon name="BarChart3" /> },
];

export default function NavigationPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Navigation</p>
        <h1 className="text-3xl font-bold text-gray-900">Headers, menus, and sidebars</h1>
        <p className="max-w-3xl text-gray-600">
          Combine the navigation primitives to build desktop and mobile shells. The samples demonstrate typical Brainliest
          layouts with search, account controls, and contextual breadcrumbs.
        </p>
      </header>

      <Stack gap={6}>
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Product header</h2>
            <p className="text-sm text-gray-600">Use the `Header` component for authenticated shells.</p>
          </div>
          <Header
            logo={brand}
            navigation={dashboardNavigation}
            actions={
              <div className="flex items-center gap-3">
                <div className="hidden lg:block">
                  <Input size="sm" placeholder="Search students" className="w-64" leftAddon={<Icon name="Search" />} />
                </div>
                <Button variant="ghost">Support</Button>
                <Button size="sm">Upgrade</Button>
              </div>
            }
            isMenuOpen={isMobileMenuOpen}
            onMenuToggle={() => setIsMobileMenuOpen((open) => !open)}
            className="!static !shadow-md"
          />
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
            <MenuButton aria-label="Open mobile navigation" />
            <span>Use the standalone menu button when composing fully custom shells.</span>
          </div>
          <p className="text-sm text-gray-500">
            On mobile, swap the inline navigation for `MenuButton` and render the nav items in a drawer using the same
            data source passed to `Menu`.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Sidebar + menu</h2>
            <p className="text-sm text-gray-600">Combine `Sidebar` with `Menu` to provide course navigation.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Sidebar
              items={sidebarItems}
              header={
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Algebra II</p>
                  <h3 className="text-lg font-semibold text-gray-900">Midterm prep set</h3>
                </div>
              }
              footer={<Button variant="ghost">Create collection</Button>}
            />
            <div className="space-y-4 rounded-2xl border border-dashed border-gray-200 p-6">
              <Menu items={dashboardNavigation} ariaLabel="Secondary navigation" gap="md" />
              <p className="text-sm text-gray-600">
                Use the menu for quick filters or secondary navigation inside the main content column.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Breadcrumbs</h2>
            <p className="text-sm text-gray-600">Provide hierarchical context for nested routes.</p>
          </div>
          <Breadcrumbs
            items={[
              { label: 'Practice', href: '#' },
              { label: 'Subjects', href: '#' },
              { label: 'Mathematics', href: '#' },
              { label: 'Differential calculus', href: '#', isCurrent: true },
            ]}
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Footer</h2>
            <p className="text-sm text-gray-600">Organise legal links and marketing pathways.</p>
          </div>
          <Footer
            brand={
              <div className="space-y-2">
                {brand}
                <p className="text-sm text-gray-600">Helping students master exams with curated practice and feedback.</p>
              </div>
            }
            columns={[
              {
                title: 'Platform',
                links: [
                  { label: 'Subjects', href: '#subjects' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Tutors', href: '#tutors' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#about' },
                  { label: 'Careers', href: '#careers' },
                  { label: 'Press', href: '#press' },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Help center', href: '#help' },
                  { label: 'Community', href: '#community' },
                  { label: 'Status', href: '#status' },
                ],
              },
            ]}
            bottom="© 2025 Brainliest. All rights reserved."
          />
        </section>
      </Stack>
    </main>
  );
}
