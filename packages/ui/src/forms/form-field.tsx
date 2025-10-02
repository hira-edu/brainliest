import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { FormLabel } from './form-label';
import { FormError } from './form-error';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  orientation?: 'vertical' | 'horizontal';
  controlId?: string;
  children: ReactElement;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      description,
      error,
      required,
      orientation = 'vertical',
      controlId,
      children,
      ...props
    },
    ref
  ) => {
    if (!isValidElement(children)) {
      throw new Error('FormField expects a single React element child.');
    }

    const reactId = useId();
    const childProps = children.props as { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean };
    const fieldId = controlId ?? childProps.id ?? `${reactId}-field`;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const existingDescribedBy = childProps['aria-describedby'];
    const describedBy = [existingDescribedBy, descriptionId, errorId]
      .filter(Boolean)
      .join(' ') || undefined;

    const control = cloneElement(children, {
      id: fieldId,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : childProps['aria-invalid'],
    } as Partial<unknown>);

    const content = (
      <div className="flex flex-col gap-1">
        {control}
        {description ? (
          <p id={descriptionId} className="text-sm text-gray-500">
            {description}
          </p>
        ) : null}
        {error ? (
          <FormError id={errorId}>{error}</FormError>
        ) : null}
      </div>
    );

    if (orientation === 'horizontal') {
      return (
        <div
          ref={ref}
          className={cn(
            'gap-2 md:grid md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-start md:gap-6',
            className
          )}
          {...props}
        >
          <div className="md:pt-2">
            {label ? (
              <FormLabel htmlFor={fieldId} required={required ?? false}>
                {label}
              </FormLabel>
            ) : null}
          </div>
          {content}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
        {label ? (
          <FormLabel htmlFor={fieldId} required={required ?? false}>
            {label}
          </FormLabel>
        ) : null}
        {content}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
