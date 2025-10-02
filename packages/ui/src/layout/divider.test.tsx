import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './divider';

describe('Divider', () => {
  it('renders horizontal divider by default', () => {
    const { container } = render(<Divider />);
    const divider = container.firstElementChild as HTMLElement;

    expect(divider.tagName.toLowerCase()).toBe('hr');
    expect(divider.className).toContain('border-t');
  });

  it('supports vertical orientation', () => {
    const { container } = render(<Divider orientation="vertical" />);
    const divider = container.firstElementChild as HTMLElement;

    expect(divider.className).toContain('border-l');
    expect(divider.className).toContain('h-full');
  });
});
