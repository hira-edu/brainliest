 // RSC directive for client-side dynamic icon rendering

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { SafeIconWrapper } from '../components/icons/suspense-wrapper';

interface DynamicIconProps {
  name?: string | null;
  className?: string;
  size?: number;
  fallback?: React.ComponentType<any>;
}

interface DefaultIconProps {
  className?: string;
  size?: number;
}

// Default gradient border icon component
export function DefaultIcon({ className = "w-8 h-8", size }: DefaultIconProps) {
  return (
    <div 
      className={`${className} rounded-lg p-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center`}
      style={size ? { width: size, height: size } : {}}
    >
      <div className="w-full h-full bg-white rounded-md" />
    </div>
  );
}

// Dynamic icon component that maps string names to Lucide React icons
export function DynamicIcon({ 
  name, 
  className = "w-6 h-6", 
  size,
  fallback: FallbackIcon = DefaultIcon 
}: DynamicIconProps) {
  // If no name provided, show fallback
  if (!name) {
    return <FallbackIcon className={className} size={size} />;
  }

  // Normalize the icon name to proper format
  const normalizedName = normalizeIconName(name);
  
  // Get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[normalizedName];
  
  if (!IconComponent) {
    return (
      <SafeIconWrapper>
        <FallbackIcon className={className} size={size} />
      </SafeIconWrapper>
    );
  }

  return (
    <SafeIconWrapper>
      <IconComponent className={className} size={size} />
    </SafeIconWrapper>
  );
}

// Hook to dynamically get a Lucide icon component
export function useDynamicIcon(name?: string) {
  if (!name) return null;
  
  const IconComponent = (LucideIcons as any)[name];
  return IconComponent || null;
}

// Map common icon names to ensure they work
export const iconNameMap: Record<string, string> = {
  'award': 'Award',
  'graduation-cap': 'GraduationCap', 
  'folder': 'Folder',
  'cloud': 'Cloud',
  'briefcase': 'Briefcase',
  'shield': 'Shield',
  'network': 'Network',
  'calculator': 'Calculator',
  'code': 'Code',
  'flask': 'Flask',
  'cog': 'Cog',
  'trending-up': 'TrendingUp',
  'stethoscope': 'Stethoscope',
  'users': 'Users',
  'file-text': 'FileText'
};

// Normalize icon name to correct format
export function normalizeIconName(name: string): string {
  // Check if it's already in correct format
  if ((LucideIcons as any)[name]) {
    return name;
  }
  
  // Check mapped names
  const mapped = iconNameMap[name.toLowerCase()];
  if (mapped && (LucideIcons as any)[mapped]) {
    return mapped;
  }
  
  // Try converting kebab-case to PascalCase
  const pascalCase = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
    
  if ((LucideIcons as any)[pascalCase]) {
    return pascalCase;
  }
  
  return name; // Return original if no match found
}