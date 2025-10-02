"use client";

import { forwardRef } from 'react';
import type {
  ComponentPropsWithoutRef,
  ElementRef,
  ReactElement,
  ReactNode,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export type TooltipProviderProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;

export interface TooltipProps
  extends Omit<ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>, 'children'> {
  children: ReactElement;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
  contentClassName?: string;
  contentProps?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;
  arrowClassName?: string;
}

export const Tooltip = forwardRef<ElementRef<typeof TooltipPrimitive.Content>, TooltipProps>(
  (
    {
      children,
      content,
      side = 'top',
      align = 'center',
      sideOffset = 8,
      contentClassName,
      contentProps,
      arrowClassName,
      delayDuration = 150,
      ...rootProps
    },
    ref
  ) => (
    <TooltipPrimitive.Root delayDuration={delayDuration} {...rootProps}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-tooltip max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out',
            contentClassName
          )}
          {...contentProps}
        >
          {content}
          <TooltipPrimitive.Arrow
            className={cn('fill-gray-900', arrowClassName)}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
);

Tooltip.displayName = 'Tooltip';
