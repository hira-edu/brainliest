import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './form-field';
import { Input } from '../primitives/input';

describe('FormField', () => {
  it('associates label, description, and error with control', () => {
    render(
      <FormField
        label="Email"
        description="We will send confirmations to this address."
        error="Email is required"
        required
      >
        <Input placeholder="email@example.com" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const description = screen.getByText('We will send confirmations to this address.');
    const error = screen.getByText('Email is required');

    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(description.getAttribute('id') ?? '');
    expect(describedBy).toContain(error.getAttribute('id') ?? '');
  });

  it('supports horizontal layout', () => {
    const { container } = render(
      <FormField orientation="horizontal" label="Name">
        <Input />
      </FormField>
    );

    expect(container.firstElementChild?.className).toContain('md:grid');
  });
});
