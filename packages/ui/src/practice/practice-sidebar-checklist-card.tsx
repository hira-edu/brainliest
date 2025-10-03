import * as React from 'react';
import { Card } from '../layout/card';
import { cn } from '../lib/utils';

export interface PracticeSidebarChecklistCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  items: ReadonlyArray<React.ReactNode>;
}

export function PracticeSidebarChecklistCard({ title = 'Session checklist', items, className, ...rest }: PracticeSidebarChecklistCardProps) {
  return (
    <Card padding="md" className={cn('space-y-3', className)} {...rest}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="ml-5 list-disc text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
