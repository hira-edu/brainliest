import { Award, BookOpen, Code, Calculator, Microscope, Building, Heart, Users, GraduationCap, Briefcase } from "lucide-react";

export interface SubCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  keywords: string[];
  route: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  subCategories: SubCategory[];
}

export const categoryStructure: Category[] = [
  {
    id: "professional-certifications",
    title: "Professional Certifications",
    description: "Industry-recognized certifications for career advancement",
    icon: Award,
    route: "/categories/professional-certifications",
    subCategories: [
      {
        id: "it-cloud",
        title: "IT & Cloud Computing",
        description: "AWS, Azure, Google Cloud, and other cloud certifications",
        icon: Code,
        keywords: ["aws", "azure", "cloud", "microsoft", "google", "practitioner"],
        route: "/categories/professional-certifications/it-cloud"
      },
      {
        id: "project-management",
        title: "Project Management",
        description: "PMP, Agile, Scrum, and project leadership certifications",
        icon: Briefcase,
        keywords: ["pmp", "project", "management", "agile", "scrum"],
        route: "/categories/professional-certifications/project-management"
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        description: "CompTIA Security+, CISSP, and security certifications",
        icon: Award,
        keywords: ["comptia", "security", "cissp", "cybersecurity", "ethical"],
        route: "/categories/professional-certifications/cybersecurity"
      },
      {
        id: "networking",
        title: "Networking",
        description: "Cisco CCNA, Network+, and networking certifications",
        icon: Code,
        keywords: ["ccna", "cisco", "network", "routing", "switching"],
        route: "/categories/professional-certifications/networking"
      }
    ]
  },
  {
    id: "university-college",
    title: "University & College",
    description: "Academic subjects and standardized test preparation",
    icon: GraduationCap,
    route: "/categories/university-college",
    subCategories: [
      {
        id: "mathematics-statistics",
        title: "Mathematics & Statistics",
        description: "Calculus, Statistics, Algebra, and Mathematical Sciences",
        icon: Calculator,
        keywords: ["mathematics", "statistics", "calculus", "algebra", "geometry", "discrete", "pre-calculus", "biostatistics", "business statistics", "elementary statistics", "intro to statistics"],
        route: "/categories/university-college/mathematics-statistics"
      },
      {
        id: "computer-science",
        title: "Computer Science",
        description: "Programming, Data Structures, Web Development, and CS Fundamentals",
        icon: Code,
        keywords: ["computer science", "programming", "data structures", "web development", "database", "algorithms"],
        route: "/categories/university-college/computer-science"
      },
      {
        id: "natural-sciences",
        title: "Natural Sciences",
        description: "Physics, Chemistry, Biology, and Earth Sciences",
        icon: Microscope,
        keywords: ["physics", "chemistry", "biology", "anatomy", "astronomy", "earth science"],
        route: "/categories/university-college/natural-sciences"
      },
      {
        id: "engineering",
        title: "Engineering",
        description: "Mechanical, Electrical, and General Engineering",
        icon: Building,
        keywords: ["engineering", "mechanical", "electrical", "civil", "chemical"],
        route: "/categories/university-college/engineering"
      },
      {
        id: "business-economics",
        title: "Business & Economics",
        description: "Accounting, Finance, Economics, and Business Administration",
        icon: Briefcase,
        keywords: ["business", "accounting", "economics", "finance", "administration", "management"],
        route: "/categories/university-college/business-economics"
      },
      {
        id: "health-medical",
        title: "Health & Medical Sciences",
        description: "Nursing, Medical Sciences, Pharmacology, and Health Studies",
        icon: Heart,
        keywords: ["medical", "nursing", "pharmacology", "health sciences", "anatomy", "physiology"],
        route: "/categories/university-college/health-medical"
      },
      {
        id: "social-sciences",
        title: "Social Sciences & Humanities",
        description: "Psychology, History, Philosophy, and Liberal Arts",
        icon: Users,
        keywords: ["psychology", "history", "philosophy", "sociology", "political science", "english", "writing"],
        route: "/categories/university-college/social-sciences"
      },
      {
        id: "test-preparation",
        title: "Standardized Test Prep",
        description: "GED, GRE, LSAT, TOEFL, HESI, and TEAS preparation",
        icon: BookOpen,
        keywords: ["ged", "gre", "lsat", "toefl", "hesi", "teas", "sat", "act"],
        route: "/categories/university-college/test-preparation"
      }
    ]
  }
];

export function getCategoryForSubject(subjectName: string): { category: Category; subCategory: SubCategory } | null {
  const subjectLower = subjectName.toLowerCase();
  
  for (const category of categoryStructure) {
    for (const subCategory of category.subCategories) {
      if (subCategory.keywords.some(keyword => subjectLower.includes(keyword))) {
        return { category, subCategory };
      }
    }
  }
  
  return null;
}

export function getAllSubjects() {
  const allSubjects: Array<{ category: Category; subCategory: SubCategory }> = [];
  
  for (const category of categoryStructure) {
    for (const subCategory of category.subCategories) {
      allSubjects.push({ category, subCategory });
    }
  }
  
  return allSubjects;
}