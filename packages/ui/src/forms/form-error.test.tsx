import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormError } from './form-error';

describe('FormError', () => {
  it('renders with alert semantics', () => {
    render(<FormError>Error occurred</FormError>);
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('Error occurred');
    expect(message).toHaveAttribute('aria-live', 'polite');
  });
});
