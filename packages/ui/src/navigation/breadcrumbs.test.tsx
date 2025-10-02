import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';

describe('Breadcrumbs', () => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Library', href: '/library' },
    { label: 'Data', isCurrent: true },
  ];

  it('renders navigation landmark with items', () => {
    render(<Breadcrumbs items={items} ariaLabel="Breadcrumb trail" />);

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb trail' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('marks the last item as current by default', () => {
    render(<Breadcrumbs items={items} />);

    const current = screen.getByText('Data');
    expect(current).toHaveAttribute('aria-current', 'page');
  });
});
