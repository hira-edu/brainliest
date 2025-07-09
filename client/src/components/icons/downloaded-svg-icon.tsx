/**
 * Downloaded SVG Icon Component
 * Renders SVG icons from the /public/icons directory
 */

import React from 'react';

interface DownloadedSVGIconProps {
  iconId: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export const DownloadedSVGIcon: React.FC<DownloadedSVGIconProps> = ({
  iconId,
  alt,
  className = '',
  style,
  size = 'md'
}) => {
  const iconPath = `/icons/${iconId}.svg`;
  const sizeClass = sizeClasses[size];
  
  return (
    <img 
      src={iconPath}
      alt={alt || `${iconId} icon`}
      className={`inline-block ${sizeClass} ${className}`}
      style={style}
      onError={(e) => {
        console.warn(`Failed to load downloaded icon: ${iconPath}`);
        // Replace with a fallback character
        const target = e.currentTarget;
        const fallback = document.createElement('div');
        fallback.className = `${sizeClass} ${className} bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs font-bold`;
        fallback.textContent = iconId.charAt(0).toUpperCase();
        fallback.title = `${iconId} (fallback)`;
        target.parentNode?.replaceChild(fallback, target);
      }}
    />
  );
};