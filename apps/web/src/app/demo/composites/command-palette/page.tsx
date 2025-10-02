'use client';

import { useState } from 'react';
import { CommandPalette, Button } from '@brainliest/ui';
import type { CommandItem } from '@brainliest/ui';

const commands: CommandItem[] = [
  { id: 'create', name: 'Create practice set', group: 'Actions', shortcut: '⌘N' },
  { id: 'import', name: 'Import questions', group: 'Actions' },
  { id: 'analytics', name: 'View analytics', group: 'Navigation' },
  { id: 'settings', name: 'Open settings', group: 'Navigation', shortcut: '⌘,' },
];

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents
  const [lastCommand, setLastCommand] = useState<CommandItem | null>(null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Command Palette</h1>
      <p className="text-gray-600">
        Power users can quickly navigate and trigger actions from anywhere in the product.
      </p>

      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <p className="text-sm text-gray-500">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
        {lastCommand ? `Executed: ${lastCommand.name}` : 'No command executed yet.'}
      </p>

      <CommandPalette
        isOpen={open}
        onClose={() => setOpen(false)}
        commands={commands}
        onSelect={(command) => setLastCommand(command)}
      />
    </div>
  );
}
