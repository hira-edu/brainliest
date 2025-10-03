import * as React from 'react';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';
import { cn } from '../lib/utils';

export interface PracticeExplainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isActive?: boolean;
  isLoading?: boolean;
  size?: React.ComponentProps<typeof Button>['size'];
  variant?: React.ComponentProps<typeof Button>['variant'];
}

export function PracticeExplainButton({
  label = 'AI explanation',
  isActive = false,
  isLoading = false,
  size = 'sm',
  variant = 'secondary',
  className,
  disabled,
  ...rest
}: PracticeExplainButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-pressed={isActive}
      disabled={disabled}
      className={cn('inline-flex items-center gap-2', className)}
      isLoading={isLoading}
      {...rest}
    >
      <Icon name="Sparkles" size="sm" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
