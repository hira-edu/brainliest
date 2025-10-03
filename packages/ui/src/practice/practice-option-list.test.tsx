import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PracticeOptionList } from './practice-option-list';

const OPTIONS = [
  { id: 'a', label: 'Choice A', description: 'First option' },
  { id: 'b', label: 'Choice B', description: 'Second option' },
];

describe('PracticeOptionList', () => {
  it('renders options and invokes change handler', () => {
    const handleChange = vi.fn();
    render(<PracticeOptionList options={OPTIONS} value="a" onChange={handleChange} />);

    expect(screen.getByLabelText('Choice A')).toBeChecked();
    const optionB = screen.getByLabelText('Choice B');
    fireEvent.click(optionB);

    expect(handleChange).toHaveBeenCalledWith('b');
  });
});
