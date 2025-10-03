import * as React from 'react';
import { Card } from '../layout/card';
import { Stack } from '../layout/stack';
import { cn } from '../lib/utils';

export interface PracticeExplanationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  summary: React.ReactNode;
  confidence?: 'low' | 'medium' | 'high';
  keyPoints?: ReadonlyArray<React.ReactNode>;
  steps?: ReadonlyArray<React.ReactNode>;
  footer?: React.ReactNode;
}

const confidenceLabel: Record<NonNullable<PracticeExplanationCardProps['confidence']>, string> = {
  low: 'Low confidence',
  medium: 'Moderate confidence',
  high: 'High confidence',
};

export function PracticeExplanationCard({
  summary,
  confidence,
  keyPoints,
  steps,
  footer,
  className,
  ...rest
}: PracticeExplanationCardProps) {
  return (
    <Card
      padding="lg"
      className={cn('space-y-4 border-primary-100 bg-primary-50/40 shadow-sm', className)}
      {...rest}
    >
      <Stack gap={2}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">AI explanation</h3>
          {confidence ? (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {confidenceLabel[confidence]}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{summary}</p>
      </Stack>

      {keyPoints && keyPoints.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key points</h4>
          <ul className="ml-5 list-disc space-y-1 text-sm text-gray-700">
            {keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {steps && steps.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps</h4>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-gray-700">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {footer ? <div className="pt-2 text-sm text-gray-600">{footer}</div> : null}
    </Card>
  );
}
