// Category configuration for subject categorization
export const categoryConfig = {
  professional: {
    name: "Professional Certifications",
    keywords: ["certification", "professional"],
    color: "blue",
    icon: "award"
  },
  academic: {
    name: "University & College",
    keywords: ["university", "college", "academic"],
    color: "green",
    icon: "graduation-cap"
  },
  other: {
    name: "Other Subjects",
    keywords: [],
    color: "gray",
    icon: "folder"
  }
};

// Category structure for navigation pages
export const categoryStructure = [
  {
    id: "professional",
    title: "Professional Certifications",
    description: "Industry-recognized certifications for career advancement",
    icon: "Award",
    color: "blue",
    route: "/categories/professional",
    subCategories: [
      {
        id: "it-cloud",
        title: "IT & Cloud Computing",
        description: "AWS, Azure, Google Cloud, and other cloud platforms",
        icon: "Cloud",
        route: "/categories/professional/it-cloud",
        keywords: ["aws", "azure", "google cloud", "kubernetes", "docker", "vmware", "oracle", "cloud", "devops", "solutions architect"]
      },
      {
        id: "project-management",
        title: "Project Management",
        description: "PMP, Agile, Scrum, and project leadership certifications",
        icon: "Briefcase",
        route: "/categories/professional/project-management",
        keywords: ["pmp", "agile", "scrum", "project management", "csm"]
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        description: "CompTIA Security+, CISSP, and security certifications",
        icon: "Shield",
        route: "/categories/professional/cybersecurity",
        keywords: ["comptia security", "cissp", "cybersecurity", "security"]
      },
      {
        id: "networking",
        title: "Networking",
        description: "Cisco, CompTIA Network+, and networking technologies",
        icon: "Network",
        route: "/categories/professional/networking",
        keywords: ["cisco", "ccna", "comptia network", "networking"]
      }
    ]
  },
  {
    id: "academic",
    title: "University & College",
    description: "Academic subjects for students and learners",
    icon: "GraduationCap",
    color: "green",
    route: "/categories/academic",
    subCategories: [
      {
        id: "mathematics-statistics",
        title: "Mathematics & Statistics",
        description: "Calculus, Algebra, Statistics, and Mathematical Sciences",
        icon: "Calculator",
        route: "/categories/academic/mathematics-statistics",
        keywords: ["statistics", "mathematics", "calculus", "algebra", "discrete", "linear", "geometry", "pre-calculus", "biostatistics"]
      },
      {
        id: "computer-science",
        title: "Computer Science",
        description: "Programming, Data Structures, Algorithms, and Software Engineering",
        icon: "Code",
        route: "/categories/academic/computer-science",
        keywords: ["computer science", "programming", "data structures", "algorithms", "software engineering"]
      },
      {
        id: "natural-sciences",
        title: "Natural Sciences",
        description: "Physics, Chemistry, Biology, and Earth Sciences",
        icon: "Flask",
        route: "/categories/academic/natural-sciences",
        keywords: ["physics", "chemistry", "biology", "astronomy", "earth science"]
      },
      {
        id: "engineering",
        title: "Engineering",
        description: "Mechanical, Electrical, Civil, and Engineering Fundamentals",
        icon: "Cog",
        route: "/categories/academic/engineering",
        keywords: ["engineering", "mechanical", "electrical", "civil"]
      },
      {
        id: "business-economics",
        title: "Business & Economics",
        description: "Accounting, Finance, Economics, and Business Administration",
        icon: "TrendingUp",
        route: "/categories/academic/business-economics",
        keywords: ["business", "economics", "accounting", "finance"]
      },
      {
        id: "health-medical",
        title: "Health & Medical Sciences",
        description: "Nursing, Medical Sciences, Anatomy, and Healthcare",
        icon: "Stethoscope",
        route: "/categories/academic/health-medical",
        keywords: ["nursing", "medical", "anatomy", "health"]
      },
      {
        id: "social-sciences-humanities",
        title: "Social Sciences & Humanities",
        description: "Psychology, History, Philosophy, and Social Studies",
        icon: "Users",
        route: "/categories/academic/social-sciences-humanities",
        keywords: ["psychology", "history", "english", "writing", "philosophy", "sociology", "political"]
      },
      {
        id: "test-prep",
        title: "Standardized Test Prep",
        description: "GRE, LSAT, TOEFL, and standardized test preparation",
        icon: "FileText",
        route: "/categories/academic/test-prep",
        keywords: ["ap", "ged", "teas", "hesi", "gre", "lsat", "toefl", "elementary", "intro"]
      }
    ]
  }
];

// Type definition for category structure
export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  route: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  keywords: string[];
}

// Default values
export const DEFAULT_ITEMS_PER_PAGE = 10;
export const PAGINATION_THRESHOLD = 6;

// Question limits for freemium users
export const FREEMIUM_QUESTION_LIMIT = 20;

// Cookie categories
export const COOKIE_CATEGORIES = {
  essential: 'essential',
  functional: 'functional',
  analytics: 'analytics',
  marketing: 'marketing'
} as const;

// Admin roles
export const USER_ROLES = {
  user: 'user',
  admin: 'admin',
  moderator: 'moderator'
} as const;

// Question difficulties
export const QUESTION_DIFFICULTIES = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Expert'
] as const;

// Exam difficulties  
export const EXAM_DIFFICULTIES = [
  'Beginner',
  'Intermediate',
  'Advanced', 
  'Expert'
] as const;

// Data classifications from schema
export const DATA_CLASSIFICATIONS = {
  public: 'public',
  internal: 'internal',
  sensitive: 'sensitive',
  restricted: 'restricted'
} as const;

// Severity levels from schema
export const SEVERITY_LEVELS = {
  debug: 'debug',
  info: 'info',
  warning: 'warning',
  error: 'error',
  critical: 'critical'
} as const;

// Permission types from schema
export const PERMISSION_TYPES = {
  read: 'read',
  write: 'write',
  delete: 'delete',
  admin: 'admin',
  create: 'create',
  update: 'update'
} as const;

// Retention actions from schema
export const RETENTION_ACTIONS = {
  soft_delete: 'soft_delete',
  hard_delete: 'hard_delete',
  archive: 'archive',
  anonymize: 'anonymize'
} as const;

// Helper function to categorize subjects
export function getCategorySlugsForSubject(subject: { name: string } | string): { category: string; subcategory: string | null } {
  const subjectName = typeof subject === 'string' ? subject : subject?.name;
  if (!subjectName) return { category: "other", subcategory: null };
  const subjectLower = subjectName.toLowerCase();

  for (const cat of categoryStructure) {
    for (const sub of cat.subCategories) {
      if (sub.keywords.some(keyword => subjectLower.includes(keyword.toLowerCase()))) {
        return { category: cat.id, subcategory: sub.id };
      }
    }
  }

  // Fallback to top-level category config if no subcategory match
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => subjectLower.includes(keyword.toLowerCase()))) {
      return { category: key, subcategory: null };
    }
  }

  return { category: "other", subcategory: null };
}