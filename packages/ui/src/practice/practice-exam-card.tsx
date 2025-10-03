import * as React from 'react';
import { Card } from '../layout/card';
import { Badge } from '../primitives/badge';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeExamCardStat {
  label: string;
  value: string;
}

export interface PracticeExamCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  stats?: PracticeExamCardStat[];
  actions?: React.ReactNode;
}

export function PracticeExamCard({
  title,
  subtitle,
  description,
  tags,
  stats,
  actions,
  className,
  ...rest
}: PracticeExamCardProps) {
  return (
    <Card
      padding="lg"
      className={cn('flex flex-col gap-6 bg-white shadow-sm lg:flex-row lg:items-center lg:justify-between', className)}
      {...rest}
    >
      <Stack gap={3} className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {subtitle ? <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">{subtitle}</p> : null}
          {tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">{title}</h1>
        {description ? <p className="text-base text-gray-600">{description}</p> : null}
        {stats && stats.length > 0 ? (
          <dl className="grid grid-cols-2 gap-4 text-sm text-gray-600 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-medium text-gray-500">{stat.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Stack>
      {actions ? <div className="flex shrink-0 items-center gap-3 self-start lg:self-center">{actions}</div> : null}
    </Card>
  );
}
