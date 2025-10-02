"use client";

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';

export interface TabsProps extends TabsPrimitive.TabsProps {
  defaultValue?: string;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Root
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    />
  )
);

Tabs.displayName = 'Tabs';

export const TabsList = forwardRef<
  HTMLDivElement,
  TabsPrimitive.TabsListProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500',
      className
    )}
    {...props}
  />
));

TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  TabsPrimitive.TabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5',
      'text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  HTMLDivElement,
  TabsPrimitive.TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';
