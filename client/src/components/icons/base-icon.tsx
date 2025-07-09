/**
 * Base Icon Component - Foundation for all icons
 * Implements consistent styling, accessibility, and theming
 */

import React, { forwardRef } from 'react';
import { cn } from '../../utils/utils';
import { IconProps, IconSize, IconColor, IconVariant } from './types';

// Size mappings following design system
const SIZE_MAP: Record<IconSize, string> = {
  'xs': 'w-3 h-3',      // 12px
  'sm': 'w-4 h-4',      // 16px  
  'md': 'w-5 h-5',      // 20px
  'lg': 'w-6 h-6',      // 24px
  'xl': 'w-8 h-8',      // 32px
  '2xl': 'w-12 h-12',   // 48px
  '3xl': 'w-16 h-16'    // 64px
};

// Color mappings using CSS custom properties
const COLOR_MAP: Record<IconColor, string> = {
  'primary': 'text-primary',
  'secondary': 'text-secondary',
  'accent': 'text-accent',
  'muted': 'text-muted-foreground',
  'destructive': 'text-destructive',
  'success': 'text-green-600',
  'warning': 'text-yellow-600',
  'info': 'text-blue-600',
  'foreground': 'text-foreground',
  'background': 'text-background',
  'current': 'text-current'
};

// Variant style mappings
const VARIANT_MAP: Record<IconVariant, string> = {
  'filled': 'fill-current',
  'outlined': 'fill-none stroke-current stroke-2',
  'light': 'fill-none stroke-current stroke-1',
  'bold': 'fill-current stroke-current stroke-1',
  'duotone': 'fill-current opacity-60'
};

/**
 * Base icon component that provides consistent styling and behavior
 */
export const BaseIcon = forwardRef<SVGSVGElement, IconProps>(
  ({
    size = 'md',
    color = 'current',
    variant = 'filled',
    loading = false,
    interactive = false,
    className,
    children,
    'aria-label': ariaLabel,
    title,
    ...props
  }, ref) => {
    // Handle custom size values
    const sizeClass = typeof size === 'string' && size in SIZE_MAP 
      ? SIZE_MAP[size as IconSize]
      : typeof size === 'number' 
        ? `w-[${size}px] h-[${size}px]`
        : typeof size === 'string'
          ? `w-[${size}] h-[${size}]`
          : SIZE_MAP.md;

    // Handle custom color values
    const colorClass = typeof color === 'string' && color in COLOR_MAP
      ? COLOR_MAP[color as IconColor]
      : '';

    // Custom color styles for non-predefined colors
    const customColorStyle = typeof color === 'string' && !(color in COLOR_MAP)
      ? { color }
      : {};

    // Variant styling
    const variantClass = VARIANT_MAP[variant];

    // Compute final className
    const finalClassName = cn(
      // Base styles
      'inline-block flex-shrink-0',
      
      // Size
      sizeClass,
      
      // Color
      colorClass,
      
      // Variant
      variantClass,
      
      // Loading state
      loading && 'animate-spin',
      
      // Interactive state
      interactive && 'cursor-pointer transition-colors duration-200 hover:opacity-80',
      
      // Custom className
      className
    );

    // Accessibility props
    const accessibilityProps = {
      role: 'img',
      'aria-label': ariaLabel,
      'aria-hidden': !ariaLabel ? 'true' : undefined,
      focusable: 'false' as const
    };

    return (
      <svg
        ref={ref}
        className={finalClassName}
        style={customColorStyle}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...accessibilityProps}
        {...props}
      >
        {title && <title>{title}</title>}
        {children}
      </svg>
    );
  }
);

BaseIcon.displayName = 'BaseIcon';

/**
 * Higher-order component to create icon components with consistent behavior
 */
export function createIcon(
  iconContent: React.ReactNode,
  displayName: string,
  defaultProps?: Partial<IconProps>
) {
  const IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <BaseIcon ref={ref} {...defaultProps} {...props}>
      {iconContent}
    </BaseIcon>
  ));

  IconComponent.displayName = displayName;
  return IconComponent;
}

/**
 * Loading placeholder icon for lazy loading
 */
export const LoadingIcon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <BaseIcon ref={ref} loading {...props}>
    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3">
      <animate attributeName="stroke-dasharray" dur="1.5s" repeatCount="indefinite" values="0 126;63 63;0 126" />
      <animate attributeName="stroke-dashoffset" dur="1.5s" repeatCount="indefinite" values="0;-63;-126" />
    </circle>
  </BaseIcon>
));

LoadingIcon.displayName = 'LoadingIcon';

/**
 * Fallback icon for missing icons
 */
export const FallbackIcon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <BaseIcon ref={ref} {...props}>
    <rect x="20" y="20" width="60" height="60" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M40 40 L60 60 M60 40 L40 60" stroke="currentColor" strokeWidth="2" />
  </BaseIcon>
));

FallbackIcon.displayName = 'FallbackIcon';