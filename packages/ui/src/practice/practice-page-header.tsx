import * as React from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '../navigation/breadcrumbs';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';
import { cn } from '../lib/utils';

export interface PracticePageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  aside?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  backLink?: {
    href: string;
    label: string;
  };
}

export function PracticePageHeader({
  title,
  description,
  eyebrow,
  aside,
  breadcrumbs,
  backLink,
  className,
  ...rest
}: PracticePageHeaderProps) {
  const hasNavigation = Boolean((breadcrumbs && breadcrumbs.length > 0) || backLink);

  return (
    <div
      className={cn('flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between', className)}
      {...rest}
    >
      <div className="flex-1 space-y-3">
        {hasNavigation ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <Breadcrumbs items={breadcrumbs} className="flex-1" />
            ) : (
              <span className="flex-1" />
            )}
            {backLink ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a href={backLink.href} className="inline-flex items-center gap-2">
                  <Icon name="ArrowLeft" aria-hidden="true" />
                  <span>{backLink.label}</span>
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">{eyebrow}</p> : null}
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">{title}</h1>
        {description ? <p className="text-base text-gray-600">{description}</p> : null}
      </div>
      {aside ? <div className="flex items-center gap-3">{aside}</div> : null}
    </div>
  );
}
