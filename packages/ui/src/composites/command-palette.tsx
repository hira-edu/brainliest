"use client";

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Command as CommandRoot,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';

export interface CommandItem {
  id: string;
  name: string;
  group?: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  onSelect: (command: CommandItem) => void;
}

export function CommandPalette({ isOpen, onClose, commands, onSelect }: CommandPaletteProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    commands.forEach((command) => {
      const key = command.group ?? 'General';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(command);
    });
    return map;
  }, [commands]);

  const commandById = useMemo(() => {
    const map = new Map<string, CommandItem>();
    commands.forEach((command) => map.set(command.id, command));
    return map;
  }, [commands]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modalBackdrop bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-modal w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search for commands and quick actions
          </Dialog.Description>
          <CommandRoot
            label="Command palette"
            className="flex flex-col"
            loop
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput
              placeholder="Search commands"
              className="h-12 border-b border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            <CommandList className="max-h-72 overflow-y-auto py-2">
              <CommandEmpty className="px-4 py-6 text-center text-sm text-gray-500">
                No commands found.
              </CommandEmpty>
              {Array.from(grouped.entries()).map(([group, items]) => (
                <CommandGroup key={group} heading={group} className="px-2">
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      disabled={item.disabled}
                      onSelect={() => {
                        if (item.disabled) return;
                        const selected = commandById.get(item.id);
                        if (selected) {
                          onSelect(selected);
                        }
                        onClose();
                      }}
                      className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-900"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon ? <span className="text-gray-400" aria-hidden="true">{item.icon}</span> : null}
                        {item.name}
                      </span>
                      {item.shortcut ? (
                        <span className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500">
                          {item.shortcut}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </CommandRoot>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
