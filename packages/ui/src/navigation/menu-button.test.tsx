import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuButton } from './menu-button';

describe('MenuButton', () => {
  it('announces expanded state', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <MenuButton aria-controls="main-menu" onClick={handleClick} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('reflects open state when provided', () => {
    render(<MenuButton isOpen />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
});
