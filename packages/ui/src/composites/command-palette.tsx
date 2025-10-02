"use client";

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Command as CommandRoot,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem as CmdkCommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk';
import { cn } from '../lib/utils';

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
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    commands.forEach((command) => {
      const key = command.group ?? 'General';
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(command);
      } else {
        map.set(key, [command]);
      }
    });

    return Array.from(map.entries()).map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [commands]);

  const commandIndex = useMemo(() => {
    const index = new Map<string, CommandItem>();
    commands.forEach((command) => {
      index.set(command.id, command);
    });
    return index;
  }, [commands]);

  const keywordsFor = useCallback((item: CommandItem) => {
    const keywords = [item.name];
    if (item.shortcut) keywords.push(item.shortcut);
    if (item.group) keywords.push(item.group);
    return keywords;
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = useCallback(
    (commandId: string) => {
      const command = commandIndex.get(commandId);
      if (!command || command.disabled) {
        return;
      }

      onSelect(command);
      onClose();
    },
    [commandIndex, onClose, onSelect]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modalBackdrop bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-modal w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search the available commands and quick actions
          </Dialog.Description>

          <CommandRoot
            label="Command palette"
            loop
            className="flex max-h-[70vh] min-h-[18rem] flex-col bg-transparent"
          >
            <CommandInput
              placeholder="Search commands"
              autoFocus
              className="h-12 w-full border-b border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus-visible:outline-none focus-visible:ring-0"
            />
            <CommandList className="flex-1 overflow-y-auto px-2 py-3">
              <CommandEmpty className="flex h-full items-center justify-center px-4 py-6 text-sm text-gray-500">
                No commands found.
              </CommandEmpty>

              {groups.map(({ group, items }, groupIndex) => (
                <div key={group} className="space-y-1">
                  <CommandGroup
                    heading={
                      <span className="px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400">
                        {group}
                      </span>
                    }
                    className="px-2"
                  >
                    {items.map((item) => (
                      <CmdkCommandItem
                        key={item.id}
                        value={item.id}
                        disabled={item.disabled}
                        keywords={keywordsFor(item)}
                        onSelect={handleSelect}
                        className={cn(
                          'flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition',
                          'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
                          'data-[state=active]:bg-primary-50 data-[state=active]:text-primary-900'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          {item.icon ? (
                            <span className="text-gray-400" aria-hidden="true">
                              {item.icon}
                            </span>
                          ) : null}
                          <span className="text-sm font-medium text-gray-900">
                            {item.name}
                          </span>
                        </span>
                        {item.shortcut ? (
                          <span className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500">
                            {item.shortcut}
                          </span>
                        ) : null}
                      </CmdkCommandItem>
                    ))}
                  </CommandGroup>
                  {groupIndex < groups.length - 1 ? (
                    <CommandSeparator className="mx-2 h-px bg-gray-200" />
                  ) : null}
                </div>
              ))}
            </CommandList>
          </CommandRoot>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
