import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from './header';
import type { MenuItem } from './menu';

const navigation: MenuItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Practice', href: '#practice' },
];

describe('Header', () => {
  it('renders logo, navigation, and actions', () => {
    render(
      <Header
        logo={<span>Brainliest</span>}
        navigation={navigation}
        actions={<button>Sign out</button>}
      />
    );

    expect(screen.getByText('Brainliest')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
