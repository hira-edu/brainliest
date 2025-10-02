import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sidebar, type SidebarItem } from './sidebar';

const items: SidebarItem[] = [
  { label: 'Overview', href: '/overview', isActive: true },
  { label: 'Assignments', href: '/assignments' },
];

describe('Sidebar', () => {
  it('renders header, items, and footer', () => {
    render(
      <Sidebar
        header={<span>Workspace</span>}
        footer={<span>Version 1.0</span>}
        items={items}
      />
    );

    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
  });
});
