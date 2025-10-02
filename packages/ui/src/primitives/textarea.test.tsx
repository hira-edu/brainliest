import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders with label association', () => {
    render(
      <label>
        Notes
        <Textarea aria-label="Notes" />
      </label>
    );

    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('supports resize prop', () => {
    render(<Textarea aria-label="Resizable" resize="none" />);
    expect(screen.getByLabelText('Resizable')).toHaveClass('resize-none');
  });

  it('invokes change handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea aria-label="Message" onChange={handleChange} />);

    await user.type(screen.getByLabelText('Message'), 'Hello');
    expect(handleChange).toHaveBeenCalled();
  });
});
