import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title and optional description', () => {
    render(
      <EmptyState title="No results" description="Try adjusting your filters." />
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(
      <EmptyState title="No data" action={<button>Refresh</button>} />
    );

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
