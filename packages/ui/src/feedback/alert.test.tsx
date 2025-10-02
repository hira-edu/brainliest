import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './alert';

describe('Alert', () => {
  it('renders title and description', () => {
    render(
      <Alert title="Alert" description="Details" />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('applies semantic variant class', () => {
    const { getByRole } = render(<Alert variant="success" />);
    expect(getByRole('alert').className).toContain('border-success-DEFAULT');
  });
});
