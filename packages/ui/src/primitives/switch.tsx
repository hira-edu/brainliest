import { forwardRef, useId } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Label } from '@radix-ui/react-label';
import { cn } from '../lib/utils';

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const labelId = label ? `${switchId}-label` : undefined;
    const descriptionId = description ? `${switchId}-description` : undefined;

    return (
      <div className="flex items-center gap-3">
        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'data-[state=checked]:bg-primary-600 data-[state=unchecked]:bg-gray-200',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          disabled={disabled}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
              'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
        {(label || description) && (
          <div className="text-sm leading-tight">
            {label && (
              <Label
                id={labelId}
                htmlFor={switchId}
                className="cursor-pointer font-medium text-gray-900"
              >
                {label}
              </Label>
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

Switch.displayName = 'Switch';
