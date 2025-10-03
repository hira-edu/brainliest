import { Card, type CardProps, Icon } from '@brainliest/ui';
import type { IconName } from '@brainliest/ui';

export interface MetricCardProps extends Omit<CardProps, 'header' | 'children'> {
  readonly label: string;
  readonly value: string;
  readonly helperText?: string;
  readonly icon?: IconName;
  readonly footer?: React.ReactNode;
}

export function MetricCard({ label, value, helperText, icon, footer, padding = 'md', ...cardProps }: MetricCardProps) {
  return (
    <Card
      padding={padding}
      header={
        <span className="flex items-center justify-between text-sm font-medium uppercase tracking-wide text-gray-500">
          <span>{label}</span>
          {icon ? <Icon name={icon} className="h-4 w-4 text-gray-400" aria-hidden="true" /> : null}
        </span>
      }
      footer={footer}
      {...cardProps}
    >
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {helperText ? <p className="mt-1 text-sm text-gray-500">{helperText}</p> : null}
    </Card>
  );
}
