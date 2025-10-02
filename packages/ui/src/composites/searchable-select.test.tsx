import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchableSelect } from './searchable-select';

const options = [
  { value: 'ai', label: 'AI Fundamentals' },
  { value: 'cloud', label: 'Cloud Architect' },
];

describe('SearchableSelect', () => {
  it('filters options based on input and triggers onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SearchableSelect options={options} onChange={onChange} />
    );

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByRole('combobox', { name: 'Search options' });
    await user.type(searchInput, 'Cloud');

    const option = screen.getByText('Cloud Architect');
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith('cloud');
  });
});
