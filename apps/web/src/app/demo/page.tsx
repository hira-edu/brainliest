import Link from 'next/link';

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

export default function DemoIndexPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 py-12">
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
    </main>
  );
}
