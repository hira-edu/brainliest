import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from './link';

describe('Link', () => {
  it('renders anchor with href', () => {
    render(
      <Link href="https://example.com">
        Visit
      </Link>
    );

    expect(screen.getByRole('link', { name: 'Visit' })).toHaveAttribute('href', 'https://example.com');
  });

  it('applies variant classes', () => {
    render(
      <Link href="#" variant="muted">
        Muted
      </Link>
    );

    expect(screen.getByRole('link', { name: 'Muted' })).toHaveClass('text-gray-600');
  });
});
