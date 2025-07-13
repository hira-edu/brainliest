/**
 * Unified Icon System - Single source of truth for all icons
 * Fixes: Multiple competing registries, lazy loading issues, missing fallbacks
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  forwardRef,
} from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "../../utils/utils";

// Centralized icon mapping for subjects and categories
const ICON_MAPPING = {
  // Professional Certifications
  pmp: "Award",
  aws: "Cloud",
  azure: "Cloud",
  "google-cloud": "Cloud",
  comptia: "Shield",
  cisco: "Network",
  vmware: "Server",
  oracle: "Database",
  kubernetes: "Boxes",
  docker: "Package",

  // Academic Subjects
  mathematics: "Calculator",
  statistics: "BarChart3",
  physics: "Atom",
  chemistry: "Flask",
  biology: "Dna",
  "computer-science": "Code",
  engineering: "Cog",
  business: "Briefcase",
  medical: "Stethoscope",
  nursing: "Heart",

  // Categories
  "professional-certifications": "Award",
  "university-college": "GraduationCap",
  technology: "Laptop",
  cybersecurity: "Shield",
  "it-cloud-computing": "Cloud",
  "project-management": "Calendar",
  "mathematics-statistics": "Calculator",
  "natural-sciences": "Flask",

  // Common icons
  academic: "BookOpen",
  certification: "Award",
  folder: "Folder",
  "book-open": "BookOpen",
  "graduation-cap": "GraduationCap",
  briefcase: "Briefcase",
  calculator: "Calculator",
  flask: "Flask",
  code: "Code",
  laptop: "Laptop",
  shield: "Shield",
  cloud: "Cloud",
  award: "Award",
  network: "Network",
  server: "Server",
  database: "Database",
  cog: "Cog",
  users: "Users",
  "trending-up": "TrendingUp",
  "file-text": "FileText",
  search: "Search",
  home: "Home",
  settings: "Settings",
  menu: "Menu",
  x: "X",
  check: "Check",
  alert: "AlertTriangle",
  info: "Info",
  loading: "Loader2",
};

// Icon context for global state
interface IconContextType {
  isInitialized: boolean;
  getIcon: (name: string) => React.ComponentType<any> | null;
}

const IconContext = createContext<IconContextType>({
  isInitialized: false,
  getIcon: () => null,
});

// Icon provider component
export function UnifiedIconProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(true); // Lucide icons are available immediately

  const getIcon = (name: string): React.ComponentType<any> | null => {
    if (!name) return null;

    // Normalize the icon name
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Try direct mapping first
    const mappedName =
      ICON_MAPPING[normalizedName as keyof typeof ICON_MAPPING];
    if (mappedName && (LucideIcons as any)[mappedName]) {
      return (LucideIcons as any)[mappedName];
    }

    // Try the original name with proper casing
    const pascalCaseName = normalizedName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    if ((LucideIcons as any)[pascalCaseName]) {
      return (LucideIcons as any)[pascalCaseName];
    }

    // Fallback to BookOpen icon
    return LucideIcons.BookOpen;
  };

  return (
    <IconContext.Provider value={{ isInitialized, getIcon }}>
      {children}
    </IconContext.Provider>
  );
}

// Hook to access icon context
export function useUnifiedIcons() {
  return useContext(IconContext);
}

// Main icon component interface
interface UnifiedIconProps {
  name?: string;
  size?: number | string;
  className?: string;
  "aria-label"?: string;
  fallback?: string;
}

// Main unified icon component
export const UnifiedIcon = forwardRef<SVGSVGElement, UnifiedIconProps>(
  (
    {
      name,
      size = 20,
      className,
      "aria-label": ariaLabel,
      fallback = "book-open",
    },
    ref
  ) => {
    const { getIcon } = useUnifiedIcons();

    if (!name) {
      const FallbackIcon = getIcon(fallback);
      return FallbackIcon ? (
        <FallbackIcon
          ref={ref}
          size={size}
          className={cn("inline-block", className)}
          aria-label={ariaLabel}
        />
      ) : null;
    }

    const IconComponent = getIcon(name);

    if (!IconComponent) {
      const FallbackIcon = getIcon(fallback);
      return FallbackIcon ? (
        <FallbackIcon
          ref={ref}
          size={size}
          className={cn("inline-block", className)}
          aria-label={ariaLabel || `${fallback} icon`}
        />
      ) : null;
    }

    return (
      <IconComponent
        ref={ref}
        size={size}
        className={cn("inline-block", className)}
        aria-label={ariaLabel || `${name} icon`}
      />
    );
  }
);

UnifiedIcon.displayName = "UnifiedIcon";

// Subject-specific icon component
const SubjectIcon = forwardRef<SVGSVGElement, UnifiedIconProps>(
  ({ name, ...props }, ref) => {
    const subjectIconName = name ? getSubjectIconName(name) : "academic";
    return <UnifiedIcon ref={ref} name={subjectIconName} {...props} />;
  }
);

SubjectIcon.displayName = "SubjectIcon";

// Category-specific icon component
const CategoryIcon = forwardRef<
  SVGSVGElement,
  UnifiedIconProps & { category?: string }
>(({ category, name, ...props }, ref) => {
  const iconName = category ? getCategoryIconName(category) : name || "folder";
  return <UnifiedIcon ref={ref} name={iconName} {...props} />;
});

CategoryIcon.displayName = "CategoryIcon";

// Helper function to get subject-specific icon name
function getSubjectIconName(subjectName: string): string {
  const normalized = subjectName.toLowerCase();

  // PMP and Project Management
  if (normalized.includes("pmp") || normalized.includes("project management")) {
    return "pmp";
  }

  // AWS
  if (normalized.includes("aws")) {
    return "aws";
  }

  // Azure
  if (normalized.includes("azure")) {
    return "azure";
  }

  // CompTIA
  if (normalized.includes("comptia")) {
    return "comptia";
  }

  // Cisco
  if (normalized.includes("cisco")) {
    return "cisco";
  }

  // Mathematics
  if (
    normalized.includes("math") ||
    normalized.includes("calculus") ||
    normalized.includes("algebra")
  ) {
    return "mathematics";
  }

  // Statistics
  if (normalized.includes("statistics") || normalized.includes("stats")) {
    return "statistics";
  }

  // Science subjects
  if (
    normalized.includes("physics") ||
    normalized.includes("chemistry") ||
    normalized.includes("biology")
  ) {
    return "natural-sciences";
  }

  // Computer Science
  if (normalized.includes("computer") || normalized.includes("programming")) {
    return "computer-science";
  }

  // Business
  if (normalized.includes("business") || normalized.includes("economics")) {
    return "business";
  }

  // Medical
  if (normalized.includes("medical") || normalized.includes("nursing")) {
    return "medical";
  }

  // Default fallback
  return "academic";
}

// Helper function to get category-specific icon name
function getCategoryIconName(categoryName: string): string {
  const normalized = categoryName.toLowerCase();

  if (
    normalized.includes("professional") ||
    normalized.includes("certification")
  ) {
    return "professional-certifications";
  }

  if (
    normalized.includes("university") ||
    normalized.includes("college") ||
    normalized.includes("academic")
  ) {
    return "university-college";
  }

  if (normalized.includes("technology") || normalized.includes("tech")) {
    return "technology";
  }

  if (normalized.includes("cyber") || normalized.includes("security")) {
    return "cybersecurity";
  }

  return "folder";
}

// Export the main components
export { UnifiedIcon as Icon, SubjectIcon, CategoryIcon };
export default UnifiedIcon;
