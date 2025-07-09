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
    id: "professional-certifications",
    title: "Professional Certifications",
    description: "Industry-recognized certifications for career advancement",
    icon: "Award",
    color: "blue",
    route: "/categories/professional-certifications",
    subCategories: [
      {
        id: "it-cloud-computing",
        title: "IT & Cloud Computing",
        description: "AWS, Azure, Google Cloud, and other cloud platforms",
        icon: "Cloud",
        route: "/categories/professional-certifications/it-cloud-computing"
      },
      {
        id: "project-management",
        title: "Project Management",
        description: "PMP, Agile, Scrum, and project leadership certifications",
        icon: "Briefcase",
        route: "/categories/professional-certifications/project-management"
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        description: "CompTIA Security+, CISSP, and security certifications",
        icon: "Shield",
        route: "/categories/professional-certifications/cybersecurity"
      },
      {
        id: "networking",
        title: "Networking",
        description: "Cisco, CompTIA Network+, and networking technologies",
        icon: "Network",
        route: "/categories/professional-certifications/networking"
      }
    ]
  },
  {
    id: "university-college",
    title: "University & College",
    description: "Academic subjects for students and learners",
    icon: "GraduationCap",
    color: "green",
    route: "/categories/university-college",
    subCategories: [
      {
        id: "mathematics-statistics",
        title: "Mathematics & Statistics",
        description: "Calculus, Algebra, Statistics, and Mathematical Sciences",
        icon: "Calculator",
        route: "/categories/university-college/mathematics-statistics"
      },
      {
        id: "computer-science",
        title: "Computer Science",
        description: "Programming, Data Structures, Algorithms, and Software Engineering",
        icon: "Code",
        route: "/categories/university-college/computer-science"
      },
      {
        id: "natural-sciences",
        title: "Natural Sciences",
        description: "Physics, Chemistry, Biology, and Earth Sciences",
        icon: "Flask",
        route: "/categories/university-college/natural-sciences"
      },
      {
        id: "engineering",
        title: "Engineering",
        description: "Mechanical, Electrical, Civil, and Engineering Fundamentals",
        icon: "Cog",
        route: "/categories/university-college/engineering"
      },
      {
        id: "business-economics",
        title: "Business & Economics",
        description: "Accounting, Finance, Economics, and Business Administration",
        icon: "TrendingUp",
        route: "/categories/university-college/business-economics"
      },
      {
        id: "health-medical-sciences",
        title: "Health & Medical Sciences",
        description: "Nursing, Medical Sciences, Anatomy, and Healthcare",
        icon: "Stethoscope",
        route: "/categories/university-college/health-medical-sciences"
      },
      {
        id: "social-sciences-humanities",
        title: "Social Sciences & Humanities",
        description: "Psychology, History, Philosophy, and Social Studies",
        icon: "Users",
        route: "/categories/university-college/social-sciences-humanities"
      },
      {
        id: "standardized-test-prep",
        title: "Standardized Test Prep",
        description: "HESI, TEAS, GRE, LSAT, TOEFL, and standardized test preparation",
        icon: "FileText",
        route: "/categories/university-college/standardized-test-prep"
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
export function getCategoryForSubject(subject: { name: string } | string): string {
  if (!subject) return "other";
  
  const subjectName = typeof subject === 'string' ? subject : subject.name;
  if (!subjectName) return "other";
  
  const subjectLower = subjectName.toLowerCase();
  
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => subjectLower.includes(keyword))) {
      return key;
    }
  }
  
  return "other";
}