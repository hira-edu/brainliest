import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders with label and description', () => {
    render(<Switch label="Enable feature" description="Toggle the feature" />);

    expect(screen.getByText('Enable feature')).toBeInTheDocument();
    expect(screen.getByText('Toggle the feature')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-labelledby');
  });

  it('calls onCheckedChange when toggled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Switch label="Notifications" onCheckedChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Switch label="Disabled" disabled onCheckedChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
