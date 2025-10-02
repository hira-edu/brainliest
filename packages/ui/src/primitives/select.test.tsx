import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './select';

describe('Select', () => {
  it('renders with options', () => {
    render(
      <Select aria-label="Fruits">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );

    expect(screen.getByLabelText('Fruits')).toBeInTheDocument();
  });

  it('sets aria-invalid when state is error', () => {
    render(
      <Select aria-label="Status" state="error">
        <option value="draft">Draft</option>
      </Select>
    );

    expect(screen.getByLabelText('Status')).toHaveAttribute('aria-invalid', 'true');
  });

  it('triggers change handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select aria-label="Choices" onChange={handleChange}>
        <option value="1">One</option>
        <option value="2">Two</option>
      </Select>
    );

    await user.selectOptions(screen.getByLabelText('Choices'), '2');
    expect(handleChange).toHaveBeenCalled();
  });
});
