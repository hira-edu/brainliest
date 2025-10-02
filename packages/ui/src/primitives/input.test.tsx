import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders with placeholder text', () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('supports left and right addons', () => {
    render(
      <Input
        aria-label="Search"
        leftAddon={<span role="img" aria-hidden>🔍</span>}
        rightAddon={<span role="img" aria-hidden>⌘K</span>}
      />
    );

    expect(screen.getByLabelText('Search')).toHaveClass('pl-10');
    expect(screen.getByLabelText('Search')).toHaveClass('pr-10');
  });

  it('sets aria-invalid when state is error', () => {
    render(<Input state="error" aria-label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input aria-label="Query" onChange={handleChange} />);

    await user.type(screen.getByLabelText('Query'), 'hi');
    expect(handleChange).toHaveBeenCalled();
  });
});
