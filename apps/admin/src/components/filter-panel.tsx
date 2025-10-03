'use client';

import type { ReactNode } from 'react';
import { Button, Icon } from '@brainliest/ui';

interface FilterPanelProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly activeCount?: number;
  readonly onReset?: () => void;
  readonly resetDisabled?: boolean;
  readonly children: ReactNode;
}

export function FilterPanel({
  title = 'Filters',
  subtitle,
  activeCount = 0,
  onReset,
  resetDisabled = false,
  children,
}: FilterPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {(title || subtitle || onReset) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {title ? <h3 className="text-sm font-semibold text-gray-900">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
          </div>
          {onReset ? (
            <div className="flex items-center gap-2">
              {activeCount > 0 ? <span className="text-xs text-gray-500">{activeCount} active</span> : null}
              <Button variant="ghost" size="sm" onClick={onReset} disabled={resetDisabled}>
                <Icon name="RotateCcw" className="h-4 w-4" aria-hidden="true" />
                Reset
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
