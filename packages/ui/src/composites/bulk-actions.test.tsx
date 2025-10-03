import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BulkActions } from './bulk-actions';

describe('BulkActions', () => {
  it('disables trigger when nothing selected', () => {
    const { getByRole } = render(
      <BulkActions selectedCount={0} actions={[]} />
    );

    expect(getByRole('button', { name: /bulk actions/i })).toBeDisabled();
  });

  it('invokes action when selected', async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <BulkActions
        selectedCount={3}
        actions={[
          { id: 'delete', label: 'Delete', onSelect: handleDelete, variant: 'destructive' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: /bulk actions/i });
    expect(trigger).toBeEnabled();

    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }));

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
