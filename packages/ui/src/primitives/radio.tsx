import { forwardRef, useId } from 'react';
import { cn } from '../lib/utils';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, name, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;
    const descriptionId = description ? `${radioId}-description` : undefined;

    return (
      <div className="flex items-start gap-3">
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={radioId}
            name={name}
            type="radio"
            className={cn(
              'h-4 w-4 border-gray-300 text-primary-600 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            aria-describedby={descriptionId}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label
                htmlFor={radioId}
                className="font-medium text-gray-900"
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-gray-500"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
