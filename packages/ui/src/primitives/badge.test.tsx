import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders dot when enabled', () => {
    render(<Badge dot>Live</Badge>);
    const badge = screen.getByText('Live');
    const dot = badge.querySelector('span');
    expect(dot).not.toBeNull();
  });
});
