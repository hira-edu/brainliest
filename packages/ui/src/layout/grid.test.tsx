import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid } from './grid';

describe('Grid', () => {
  it('renders items in a grid', () => {
    render(
      <Grid data-testid="grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('grid');
    expect(grid.childElementCount).toBe(2);
  });

  it('applies responsive column variant', () => {
    render(
      <Grid data-testid="grid" cols="4" />
    );

    const grid = screen.getByTestId('grid');
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('lg:grid-cols-4');
  });
});
