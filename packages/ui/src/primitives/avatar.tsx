import { forwardRef, useCallback, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [hasImageError, setHasImageError] = useState(false);

    const handleImageError = useCallback(() => {
      setHasImageError(true);
    }, []);

    const showFallback = !src || hasImageError;
    const accessibleLabel = alt ?? (typeof fallback === 'string' ? fallback : undefined);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...(showFallback && accessibleLabel
          ? { role: 'img', 'aria-label': accessibleLabel }
          : showFallback
            ? { 'aria-hidden': true }
            : undefined)}
        {...props}
      >
        {!showFallback ? (
          <img
            src={src}
            alt={alt ?? ''}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <span className="font-medium text-gray-700">
            {fallback || '?'}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
