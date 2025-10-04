import type { IconName } from '@brainliest/ui';

export interface AdminNavItemConfig {
  readonly label: string;
  readonly href: string;
  readonly icon?: IconName;
  readonly badge?: string;
  readonly exact?: boolean;
}

export interface AdminNavSectionConfig {
  readonly label: string;
  readonly items: ReadonlyArray<AdminNavItemConfig>;
}

export const ADMIN_NAV_SECTIONS: ReadonlyArray<AdminNavSectionConfig> = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', exact: true },
      { label: 'AI Overview', href: '/ai/explanations', icon: 'Bot' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Exams', href: '/content/exams', icon: 'BookOpen' },
      { label: 'Questions', href: '/content/questions', icon: 'CircleHelp' },
      { label: 'Media Library', href: '/content/media', icon: 'Image' },
    ],
  },
  {
    label: 'Taxonomy',
    items: [
      { label: 'Categories', href: '/taxonomy/categories', icon: 'FolderTree' },
      { label: 'Subcategories', href: '/taxonomy/subcategories' },
      { label: 'Subjects', href: '/taxonomy/subjects', icon: 'GraduationCap' },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'Students', href: '/users/students', icon: 'Users' },
      { label: 'Admin Accounts', href: '/users/admins', icon: 'ShieldCheck' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Keys', href: '/integrations/keys', icon: 'KeySquare' },
      { label: 'Feature Flags', href: '/settings/feature-flags', icon: 'ToggleLeft' },
      { label: 'Announcements', href: '/settings/announcements', icon: 'Megaphone' },
      { label: 'Security', href: '/settings/security', icon: 'Shield' },
      { label: 'System Settings', href: '/settings/system', icon: 'SlidersHorizontal' },
    ],
  },
  {
    label: 'Audit & Logs',
    items: [
      { label: 'Audit Log', href: '/audit/logs', icon: 'History' },
    ],
  },
];

export interface AdminNavResolvedItem extends AdminNavItemConfig {
  readonly section: string;
  readonly isActive: boolean;
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }

  return pathname.length === 0 ? '/' : pathname;
}

export function resolveAdminNavItems(
  sections: ReadonlyArray<AdminNavSectionConfig>,
  pathname: string
): ReadonlyArray<AdminNavResolvedItem> {
  const normalizedPath = normalizePathname(pathname);

  return sections.flatMap((section) =>
    section.items.map((item) => {
      const normalizedHref = normalizePathname(item.href);
      const matchesExact = normalizedPath === normalizedHref;
      const matchesPrefix = normalizedPath.startsWith(`${normalizedHref}/`);
      const isActive = item.exact ? matchesExact : matchesExact || matchesPrefix;

      return {
        ...item,
        section: section.label,
        isActive,
      } satisfies AdminNavResolvedItem;
    })
  );
}
