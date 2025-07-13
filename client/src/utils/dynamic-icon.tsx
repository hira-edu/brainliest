"use client"; // RSC directive for client-side dynamic icon rendering

import React from "react";
import { UnifiedIcon } from "../components/icons/unified-icon-system";

interface DynamicIconProps {
  name?: string | null;
  className?: string;
  size?: number;
  fallback?: string;
}

/**
 * Dynamic icon component that uses the unified icon system
 * @deprecated Use UnifiedIcon directly for better performance
 */
export function DynamicIcon({
  name,
  className = "w-6 h-6",
  size,
  fallback = "book-open",
}: DynamicIconProps) {
  // Extract size from className if not provided
  const extractedSize = size || (className.includes("w-") ? undefined : 24);

  return (
    <UnifiedIcon
      name={name || fallback}
      size={extractedSize}
      className={className}
      fallback={fallback}
    />
  );
}

// Backward compatibility exports
export { UnifiedIcon as Icon };
export default DynamicIcon;
