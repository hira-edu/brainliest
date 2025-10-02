import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, type CommandItem } from './command-palette';

const commands: CommandItem[] = [
  { id: '1', name: 'Create note', group: 'Actions' },
  { id: '2', name: 'Open settings', group: 'Navigation' },
];

describe('CommandPalette', () => {
  it('filters commands and calls onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <CommandPalette isOpen onClose={onClose} commands={commands} onSelect={onSelect} />
    );

    await user.type(screen.getByRole('combobox', { name: 'Command palette' }), 'settings');
    const option = screen.getByText('Open settings');
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(commands[1]);
    expect(onClose).toHaveBeenCalled();
  });
});
