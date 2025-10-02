import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette, type CommandItem } from './command-palette';
import { Button } from '../primitives/button';

const commands: CommandItem[] = [
  { id: '1', name: 'Create practice set', group: 'Actions', shortcut: '⌘N' },
  { id: '2', name: 'Invite teammates', group: 'Actions' },
  { id: '3', name: 'Open dashboard', group: 'Navigation' },
  { id: '4', name: 'View analytics', group: 'Navigation' },
];

const meta: Meta<typeof CommandPalette> = {
  title: 'Composites/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CommandPalette>;

export const Playground: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastCommand, setLastCommand] = useState<CommandItem | null>(null);

    const handleSelect = (command: CommandItem) => {
      setLastCommand(command);
    };

    const summary = useMemo(() => (
      lastCommand ? `Selected: ${lastCommand.name}` : 'No command executed yet.'
    ), [lastCommand]);

    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <p className="text-sm text-gray-600">{summary}</p>
        <CommandPalette
          isOpen={open}
          onClose={() => setOpen(false)}
          commands={commands}
          onSelect={handleSelect}
        />
      </div>
    );
  },
};
