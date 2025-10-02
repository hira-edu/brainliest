import { forwardRef } from 'react';
import type { SVGAttributes } from 'react';
import { icons as lucideIcons } from 'lucide-react';
import { cn } from '../lib/utils';

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconName = keyof typeof lucideIcons;

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  name: IconName;
  size?: keyof typeof iconSizes;
  strokeWidth?: number;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', className, strokeWidth = 1.5, ...props }, ref) => {
    const LucideIcon = lucideIcons[name];

    if (!LucideIcon) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Icon '${name}' does not exist in lucide-react icon set.`);
      }
      return null;
    }

    return (
      <LucideIcon
        ref={ref}
        className={cn('flex-shrink-0', className)}
        size={iconSizes[size]}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';
