import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from './stack';

describe('Stack', () => {
  it('renders children vertically by default', () => {
    render(
      <Stack data-testid="stack">
        <span>First</span>
        <span>Second</span>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack.className).toContain('flex');
    expect(stack.className).toContain('flex-col');
  });

  it('supports row direction', () => {
    render(
      <Stack data-testid="stack" direction="row" />
    );

    const stack = screen.getByTestId('stack');
    expect(stack.className).toContain('flex-row');
  });
});
