'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Header,
  Button,
  Input,
  Icon,
  Badge,
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTriggerButton,
} from '@brainliest/ui';
import type { MenuItem } from '@brainliest/ui';

const demoLinks = [
  {
    title: 'Composites',
    links: [
      { href: '/demo/composites/modal', label: 'Modal' },
      { href: '/demo/composites/dialog', label: 'Dialog' },
      { href: '/demo/composites/dropdown', label: 'Dropdown' },
      { href: '/demo/composites/tooltip', label: 'Tooltip' },
      { href: '/demo/composites/pagination', label: 'Pagination' },
      { href: '/demo/composites/searchable-select', label: 'Searchable Select' },
      { href: '/demo/composites/command-palette', label: 'Command Palette' },
      { href: '/demo/composites/tabs', label: 'Tabs' },
      { href: '/demo/composites/accordion', label: 'Accordion' },
      { href: '/demo/composites/popover', label: 'Popover' },
    ],
  },
  {
    title: 'Feedback',
    links: [
      { href: '/demo/feedback/toast', label: 'Toast' },
    ],
  },
];

const baseLogo = (
  <div className="flex items-center gap-2 text-gray-900">
    <Icon name="GraduationCap" size="lg" className="text-primary-600" />
    <span className="text-xl font-semibold">Brainliest</span>
  </div>
);

const headerPreviewClass = '!static !top-auto !z-auto';

const primaryNavigation: MenuItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Practice', href: '#practice' },
  { label: 'Reports', href: '#reports' },
];

const studyNavigation: MenuItem[] = [
  { label: 'Discover', href: '#discover', isActive: true },
  { label: 'Subjects', href: '#subjects' },
  { label: 'Tutors', href: '#tutors' },
  { label: 'Assignments', href: '#assignments' },
];

const creatorNavigation: MenuItem[] = [
  { label: 'Overview', href: '#overview', isActive: true },
  { label: 'My Library', href: '#library' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Community', href: '#community' },
];

const examNavigation: MenuItem[] = [
  { label: 'Algebra II Midterm', href: '#exam', isActive: true },
  { label: 'Question 12 of 24', href: '#progress' },
];

const marketingNavigation: MenuItem[] = [
  { label: 'Features', href: '#features', isActive: true },
  { label: 'Curriculum', href: '#curriculum' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Districts', href: '#districts' },
];

type HeaderVariation = {
  name: string;
  description: string;
  render: () => JSX.Element;
  content: ReactNode;
  containerClassName?: string;
  contentClassName?: string;
};

const headerVariations: HeaderVariation[] = [
  {
    name: 'Product Navigation',
    description:
      'Application shell for authenticated dashboards with quick access to support and account actions.',
    render: () => (
      <Header
        logo={baseLogo}
        navigation={primaryNavigation}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="ghost">Support</Button>
            <Button size="sm">Sign in</Button>
          </div>
        }
        className={headerPreviewClass}
      />
    ),
    content: (
      <p>
        Use this header for core product areas like the student dashboard. Desktop navigation uses the menu
        component while actions highlight the primary authentication flow.
      </p>
    ),
  },
  {
    name: 'Study Experience with Search',
    description:
      'Focused learning surface that surfaces global search and upgrade prompts alongside subject navigation.',
    render: () => (
      <Header
        logo={baseLogo}
        navigation={studyNavigation}
        actions={
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Icon
                name="Search"
                size="sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                size="sm"
                placeholder="Search subjects or tutors"
                className="w-64 pl-9"
                aria-label="Search study resources"
              />
            </div>
            <Button variant="ghost">Help Center</Button>
            <Button size="sm" variant="secondary">
              Upgrade
            </Button>
          </div>
        }
        className={headerPreviewClass}
      />
    ),
    content: (
      <p>
        Highlight discovery and search when students are exploring coursework. The upgrade button showcases how to
        introduce monetization pathways without overwhelming the navigation.
      </p>
    ),
  },
  {
    name: 'Creator Dashboard',
    description:
      'Creator-focused layout with notifications, quick publishing, and an account dropdown anchored to the avatar.',
    render: () => (
      <Header
        logo={baseLogo}
        navigation={creatorNavigation}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="info" size="sm" className="hidden lg:inline-flex">
              3 drafts
            </Badge>
            <Button variant="ghost" className="hidden lg:inline-flex">
              <Icon name="Bell" />
            </Button>
            <Button size="sm" className="hidden sm:inline-flex">
              New lesson
            </Button>
            <Dropdown
              trigger={
                <DropdownTriggerButton className="px-1">
                  <span className="flex items-center gap-2">
                    <Avatar size="sm" fallback="JL" />
                    <Icon name="ChevronDown" size="sm" className="text-gray-400" />
                  </span>
                </DropdownTriggerButton>
              }
            >
              <DropdownLabel>Signed in as</DropdownLabel>
              <DropdownItem disabled className="cursor-default text-gray-500">
                jordan@brainliest.com
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<Icon name="User" size="sm" />}>Profile</DropdownItem>
              <DropdownItem icon={<Icon name="Settings" size="sm" />}>Settings</DropdownItem>
              <DropdownItem icon={<Icon name="LifeBuoy" size="sm" />}>Support</DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<Icon name="LogOut" size="sm" />}>
                Sign out
              </DropdownItem>
            </Dropdown>
          </div>
        }
        className={`${headerPreviewClass} shadow-sm`}
      />
    ),
    content: (
      <p>
        Give content creators direct access to their stats and publishing flow. The avatar dropdown demonstrates how
        Radix-powered menus integrate into the header pattern.
      </p>
    ),
  },
  {
    name: 'Exam Mode',
    description:
      'High-focus exam experience with progress breadcrumbs, countdown timer, and primary submission controls.',
    render: () => (
      <Header
        logo={
          <div className="flex items-center gap-2 text-gray-900">
            <Icon name="BookOpen" size="lg" className="text-primary-600" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-500">Midterm Exam</span>
              <span className="text-lg font-semibold text-gray-900">Algebra II</span>
            </div>
          </div>
        }
        navigation={examNavigation}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="warning" size="sm" className="font-semibold uppercase tracking-wide">
              12:24 remaining
            </Badge>
            <Button variant="ghost" className="hidden sm:inline-flex">
              Save &amp; exit
            </Button>
            <Button size="sm" variant="secondary" className="hidden sm:inline-flex">
              Flag question
            </Button>
            <Button size="sm">Submit exam</Button>
          </div>
        }
        className={`${headerPreviewClass} shadow-sm backdrop-blur`}
      />
    ),
    content: (
      <div className="space-y-2">
        <p>Ideal for timed assessments and practice exams where progress and actions must always stay visible.</p>
        <p className="text-gray-500">
          Combine with the pagination component for per-question navigation and use the badge to surface the timer.
        </p>
      </div>
    ),
    containerClassName: 'bg-white/95 backdrop-blur-sm',
  },
  {
    name: 'Marketing Landing',
    description:
      'Public marketing header featuring primary navigation, sales CTA, and a gradient backdrop for hero pages.',
    render: () => (
      <Header
        logo={baseLogo}
        navigation={marketingNavigation}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Contact sales
            </Button>
            <Button size="sm">Start free trial</Button>
          </div>
        }
        className={`${headerPreviewClass} !border-b-0 bg-gradient-to-r from-primary-50 via-white to-primary-50 shadow-none`}
      />
    ),
    content: (
      <p>
        Pair this header with landing pages or open marketing surfaces. The gradient background draws attention to the
        top navigation while keeping call-to-action buttons prominent.
      </p>
    ),
    containerClassName: 'border border-primary-100 bg-white shadow-sm',
    contentClassName: 'bg-white/70',
  },
];

export default function DemoIndexPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 py-12">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold text-gray-900">Brainliest UI Demos</h1>
        <p className="text-lg text-gray-600">
          Explore interactive examples of the shared component library. Each demo is implemented with Radix primitives and is ready for Playwright automation.
        </p>
      </header>

      <section className="space-y-8">
        {demoLinks.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex h-full w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-800"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Header Variations</h2>
          <p className="text-gray-600">
            Five ready-to-use compositions built from the navigation primitives. Each example maps 1:1 with the
            Storybook stories for rapid QA while browsing the demo gallery.
          </p>
        </div>

        <div className="space-y-10">
          {headerVariations.map((variant) => (
            <article key={variant.name} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-900">{variant.name}</h3>
                <p className="text-gray-600">{variant.description}</p>
              </div>
              <div
                className={`overflow-hidden rounded-2xl border border-gray-200 shadow-sm ${variant.containerClassName ?? 'bg-white'}`}
              >
                {variant.render()}
                <div
                  className={`border-t border-gray-200 px-6 py-8 text-sm text-gray-600 ${variant.contentClassName ?? 'bg-gray-50'}`}
                >
                  {variant.content}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
