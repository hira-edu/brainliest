import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../lib/utils';
import { FormLabel } from './form-label';
import { FormError } from './form-error';

type FieldChildProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
};

function isFieldChild(element: ReactElement | ReactNode): element is ReactElement<FieldChildProps> {
  return isValidElement<FieldChildProps>(element);
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  orientation?: 'vertical' | 'horizontal';
  controlId?: string;
  children: ReactNode;
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
    const reactId = useId();
    const isEnhancedChild = isFieldChild(children);
    const childProps: FieldChildProps = isEnhancedChild ? children.props : {};
    const fieldId = controlId ?? childProps.id ?? `${reactId}-field`;
    const descriptionId = description && isEnhancedChild ? `${fieldId}-description` : undefined;
    const errorId = error && isEnhancedChild ? `${fieldId}-error` : undefined;

    const describedByParts = [childProps['aria-describedby'], descriptionId, errorId].filter(Boolean);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const control = isEnhancedChild
      ? cloneElement(
          children,
          {
            id: fieldId,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : childProps['aria-invalid'],
          } satisfies Partial<FieldChildProps>
        )
      : children;

    const content = (
      <div className="flex flex-col gap-1">
        {control}
        {description ? (
          <p
            id={isEnhancedChild ? descriptionId : undefined}
            className="text-sm text-gray-500"
          >
            {description}
          </p>
        ) : null}
        {error ? (
          <FormError id={isEnhancedChild ? errorId : undefined}>{error}</FormError>
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
              <FormLabel htmlFor={isEnhancedChild ? fieldId : controlId} required={required ?? false}>
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
          <FormLabel htmlFor={isEnhancedChild ? fieldId : controlId} required={required ?? false}>
            {label}
          </FormLabel>
        ) : null}
        {content}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
