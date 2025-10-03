import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Card } from '../layout/card';
import { Form, type FormProps } from './form';
import { cn } from '../lib/utils';

export interface EntityFormProps extends Omit<FormProps, 'title'> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly headerActions?: ReactNode;
  readonly footer?: ReactNode;
}

export const EntityForm = forwardRef<HTMLFormElement, EntityFormProps>(
  ({ title, description, headerActions, footer, children, className, ...formProps }, ref) => {
    const header = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description ? <p className="text-sm text-gray-600">{description}</p> : null}
        </div>
        {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
      </div>
    );

    return (
      <Form ref={ref} className={cn('space-y-6', className)} {...formProps}>
        <Card padding="lg" sectionPadding="lg" header={header} footer={footer}>
          <div className="space-y-6">{children}</div>
        </Card>
      </Form>
    );
  }
);

EntityForm.displayName = 'EntityForm';

export interface EntityFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly align?: 'start' | 'end' | 'space-between';
}

const alignmentClasses: Record<NonNullable<EntityFormActionsProps['align']>, string> = {
  start: 'sm:justify-start',
  end: 'sm:justify-end',
  'space-between': 'sm:justify-between',
};

export function EntityFormActions({ align = 'end', className, ...props }: EntityFormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center',
        alignmentClasses[align],
        className
      )}
      {...props}
    />
  );
}
