import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Menu, type MenuItem } from './menu';

describe('Menu', () => {
  const items: MenuItem[] = [
    { label: 'Home', href: '#home', isActive: true },
    { label: 'Practice', href: '#practice' },
  ];

  it('renders navigation items with aria attributes', () => {
    render(<Menu items={items} ariaLabel="Primary" />);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page');
  });
});
