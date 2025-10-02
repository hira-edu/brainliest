import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './select';

describe('Select', () => {
  it('renders with options', () => {
    render(
      <Select
        ariaLabel="Fruits"
        options={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Fruits' })).toBeInTheDocument();
  });

  it('sets aria-invalid when state is error', () => {
    render(
      <Select
        ariaLabel="Status"
        state="error"
        options={[{ value: 'draft', label: 'Draft' }]}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('triggers change handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select
        ariaLabel="Choices"
        onValueChange={handleChange}
        options={[
          { value: '1', label: 'One' },
          { value: '2', label: 'Two' },
        ]}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Choices' }));
    await user.click(screen.getByRole('option', { name: 'Two' }));

    expect(handleChange).toHaveBeenCalledWith('2');
  });
});
