"use client";

import { forwardRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../lib/utils';

export interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = 'top', delay = 150 }, ref) => (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            ref={ref}
            side={side}
            sideOffset={8}
            className={cn(
              'z-tooltip rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg'
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
);

Tooltip.displayName = 'Tooltip';
