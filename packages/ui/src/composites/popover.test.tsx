import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Popover } from './popover';
import { Button } from '../primitives/button';

describe('Popover', () => {
  it('shows content when trigger clicked', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<Button>More info</Button>}
      >
        <div role="dialog">Popover content</div>
      </Popover>
    );

    await user.click(screen.getByRole('button', { name: 'More info' }));

    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });
});
