import * as React from 'react';
import { Card } from '../layout/card';
import { cn } from '../lib/utils';

export interface PracticeSidebarShortcut {
  readonly key: React.ReactNode;
  readonly description: React.ReactNode;
}

export interface PracticeSidebarShortcutsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  shortcuts: ReadonlyArray<PracticeSidebarShortcut>;
}

export function PracticeSidebarShortcutsCard({
  title = 'Keyboard shortcuts',
  shortcuts,
  className,
  ...rest
}: PracticeSidebarShortcutsCardProps) {
  return (
    <Card padding="md" className={cn('space-y-3', className)} {...rest}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-1 text-xs text-gray-600">
        {shortcuts.map((shortcut, index) => (
          <p key={index} className="flex items-center gap-2">
            <kbd className="rounded border border-slate-200 px-1 py-0.5">{shortcut.key}</kbd>
            <span>{shortcut.description}</span>
          </p>
        ))}
      </div>
    </Card>
  );
}
