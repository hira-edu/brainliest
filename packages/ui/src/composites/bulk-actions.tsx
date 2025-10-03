"use client";

import type { ReactNode } from 'react';
import { Button } from '../primitives/button';
import { Icon, type IconName } from '../primitives/icon';
import { Dropdown, DropdownItem } from './dropdown';
import { cn } from '../lib/utils';

export interface BulkAction {
  readonly id: string;
  readonly label: ReactNode;
  readonly onSelect: () => void;
  readonly disabled?: boolean;
  readonly icon?: IconName;
  readonly variant?: 'default' | 'destructive';
}

export interface BulkActionsProps {
  readonly selectedCount: number;
  readonly actions: ReadonlyArray<BulkAction>;
  readonly className?: string;
  readonly label?: ReactNode;
  readonly disabled?: boolean;
}

export function BulkActions({ selectedCount, actions, className, label, disabled = false }: BulkActionsProps) {
  const effectiveDisabled = disabled || selectedCount === 0 || actions.length === 0;
  const triggerLabel = label ?? 'Bulk actions';

  return (
    <Dropdown
      className={className}
      trigger={
        <Button variant="outline" disabled={effectiveDisabled} aria-disabled={effectiveDisabled}>
          <span>{triggerLabel}</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {selectedCount}
          </span>
        </Button>
      }
    >
      {actions.map((action) => (
        <DropdownItem
          key={action.id}
          onSelect={action.onSelect}
          disabled={action.disabled}
          icon={
            action.icon ? (
              <Icon name={action.icon} className={cn(action.variant === 'destructive' ? 'text-error-500' : 'text-gray-400')} />
            ) : undefined
          }
          className={cn(
            action.variant === 'destructive'
              ? 'text-error-600 data-[highlighted]:bg-error-50 data-[highlighted]:text-error-900'
              : undefined
          )}
        >
          {action.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
