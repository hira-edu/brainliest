import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild as HTMLElement;

    expect(skeleton.className).toContain('animate-pulse');
  });

  it('supports text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.firstElementChild as HTMLElement;

    expect(skeleton.className).toContain('h-4');
  });
});
