import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './tooltip';

const label = 'Hover me';

describe('Tooltip', () => {
  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Helpful tooltip" delay={0}>
        <button>{label}</button>
      </Tooltip>
    );

    await user.hover(screen.getByRole('button', { name: label }));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful tooltip');
  });
});
