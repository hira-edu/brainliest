import * as React from 'react';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: React.ComponentProps<typeof Stack>['gap'];
}

export function PracticeSidebar({ gap = '4', className, children, ...rest }: PracticeSidebarProps) {
  return (
    <Stack gap={gap} className={cn(className)} {...rest}>
      {children}
    </Stack>
  );
}
