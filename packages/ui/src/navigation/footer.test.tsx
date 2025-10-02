import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './footer';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
];

describe('Footer', () => {
  it('renders brand, columns, and bottom content', () => {
    render(
      <Footer
        brand={<span>Brainliest</span>}
        columns={columns}
        bottom={<span>© 2025 Brainliest</span>}
      />
    );

    expect(screen.getByText('Brainliest')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('© 2025 Brainliest')).toBeInTheDocument();
  });
});
