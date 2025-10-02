import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export type FormSectionColumns = 1 | 2;

export interface FormSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  columns?: FormSectionColumns;
}

export const FormSection = forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, columns = 1, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn('flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
            {description ? <p className="text-sm text-gray-600">{description}</p> : null}
          </div>
        )}
        <div
          className={cn(
            'grid gap-6',
            columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'
          )}
        >
          {children}
        </div>
      </section>
    );
  }
);

FormSection.displayName = 'FormSection';
