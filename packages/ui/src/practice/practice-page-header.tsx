import * as React from 'react';
import { cn } from '../lib/utils';

export interface PracticePageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  aside?: React.ReactNode;
}

export function PracticePageHeader({ title, description, eyebrow, aside, className, ...rest }: PracticePageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between', className)}
      {...rest}
    >
      <div className="space-y-2">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">{eyebrow}</p> : null}
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">{title}</h1>
        {description ? <p className="text-base text-gray-600">{description}</p> : null}
      </div>
      {aside ? <div className="flex items-center gap-3">{aside}</div> : null}
    </div>
  );
}
