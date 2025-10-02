import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchableSelect } from './searchable-select';

const options = [
  { value: 'ai', label: 'AI Fundamentals' },
  { value: 'cloud', label: 'Cloud Architect' },
];

describe('SearchableSelect', () => {
  it('filters options when typing into the trigger field and selects a value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SearchableSelect options={options} onChange={onChange} />
    );

    const trigger = screen.getByRole('button', { name: 'Search options' });
    await user.click(trigger);

    const combobox = screen.getByRole('combobox', { name: 'Search options' });
    await user.type(combobox, 'Cloud');

    const option = await screen.findByRole('option', { name: 'Cloud Architect' });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith('cloud');
  });
});
