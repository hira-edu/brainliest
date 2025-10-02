import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Icon } from './icon';

describe('Icon', () => {
  it('renders lucide icon by name', () => {
    const { container } = render(<Icon name="Check" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles unknown icon gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<Icon name={'NotReal' as never} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
