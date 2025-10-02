import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders progressbar role with default values', () => {
    render(<Progress value={40} max={100} />);

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '40');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  it('caps percentage within bounds', () => {
    const { getByRole } = render(<Progress value={150} max={100} />);
    const bar = getByRole('progressbar').firstElementChild as HTMLElement;

    expect(bar.style.width).toBe('100%');
  });
});
