// Category configuration for subject categorization
export const categoryConfig = {
  professional: {
    name: "Professional Certifications",
    keywords: ["pmp", "aws", "azure", "google cloud", "comptia", "cisco", "oracle", "kubernetes", "docker", "vmware", "certification", "professional"],
    color: "blue",
    icon: "award"
  },
  academic: {
    name: "University & College",
    keywords: ["statistics", "mathematics", "calculus", "algebra", "computer science", "programming", "physics", "chemistry", "biology", "engineering", "business", "economics", "accounting", "nursing", "medical", "anatomy", "psychology", "history", "english", "writing", "philosophy", "sociology", "political", "astronomy", "earth science", "discrete", "linear", "geometry", "pre-calculus", "biostatistics", "elementary", "intro", "ap", "ged", "teas", "hesi", "gre", "lsat", "toefl"],
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
        route: "/categories/professional/it-cloud"
      },
      {
        id: "project-management",
        title: "Project Management",
        description: "PMP, Agile, Scrum, and project leadership certifications",
        icon: "Briefcase",
        route: "/categories/professional/project-management"
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        description: "CompTIA Security+, CISSP, and security certifications",
        icon: "Shield",
        route: "/categories/professional/cybersecurity"
      },
      {
        id: "networking",
        title: "Networking",
        description: "Cisco, CompTIA Network+, and networking technologies",
        icon: "Network",
        route: "/categories/professional/networking"
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
        route: "/categories/academic/mathematics-statistics"
      },
      {
        id: "computer-science",
        title: "Computer Science",
        description: "Programming, Data Structures, Algorithms, and Software Engineering",
        icon: "Code",
        route: "/categories/academic/computer-science"
      },
      {
        id: "natural-sciences",
        title: "Natural Sciences",
        description: "Physics, Chemistry, Biology, and Earth Sciences",
        icon: "Flask",
        route: "/categories/academic/natural-sciences"
      },
      {
        id: "engineering",
        title: "Engineering",
        description: "Mechanical, Electrical, Civil, and Engineering Fundamentals",
        icon: "Cog",
        route: "/categories/academic/engineering"
      },
      {
        id: "business-economics",
        title: "Business & Economics",
        description: "Accounting, Finance, Economics, and Business Administration",
        icon: "TrendingUp",
        route: "/categories/academic/business-economics"
      },
      {
        id: "health-medical",
        title: "Health & Medical Sciences",
        description: "Nursing, Medical Sciences, Anatomy, and Healthcare",
        icon: "Stethoscope",
        route: "/categories/academic/health-medical"
      },
      {
        id: "social-sciences-humanities",
        title: "Social Sciences & Humanities",
        description: "Psychology, History, Philosophy, and Social Studies",
        icon: "Users",
        route: "/categories/academic/social-sciences-humanities"
      },
      {
        id: "test-prep",
        title: "Standardized Test Prep",
        description: "GRE, LSAT, TOEFL, and standardized test preparation",
        icon: "FileText",
        route: "/categories/academic/test-prep"
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

// Helper function to categorize subjects
export function getCategoryForSubject(subject: { name: string }): string {
  const subjectLower = subject.name.toLowerCase();
  
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => subjectLower.includes(keyword))) {
      return key;
    }
  }
  
  return "other";
}