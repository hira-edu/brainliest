import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormLabel } from './form-label';

describe('FormLabel', () => {
  it('renders children', () => {
    render(<FormLabel>Email</FormLabel>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows required indicator by default', () => {
    render(<FormLabel required>Email</FormLabel>);
    const label = screen.getByText('Email').closest('label');
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute('data-required');
  });

  it('renders optional hint when provided', () => {
    render(
      <FormLabel optionalHint="Optional">
        Phone
      </FormLabel>
    );

    expect(screen.getByText('Optional')).toBeInTheDocument();
  });
});
