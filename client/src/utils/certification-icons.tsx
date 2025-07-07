import React from 'react';

// Official certification logos as SVG components for better scalability and performance

export const PMPIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1f4e79"/>
    <rect x="15" y="15" width="70" height="70" rx="10" fill="#fff"/>
    <rect x="25" y="25" width="15" height="50" fill="#1f4e79"/>
    <rect x="42.5" y="35" width="15" height="40" fill="#1f4e79"/>
    <rect x="60" y="30" width="15" height="45" fill="#1f4e79"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">PMP</text>
  </svg>
);

export const AWSIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#ff9900"/>
    <path d="M20 45 L35 35 L50 45 L65 35 L80 45 L65 55 L50 45 L35 55 Z" fill="#fff"/>
    <path d="M20 60 L80 60" stroke="#fff" strokeWidth="3"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">AWS</text>
  </svg>
);

export const CompTIAIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#e31837"/>
    <rect x="15" y="25" width="70" height="50" rx="8" fill="#fff"/>
    <circle cx="30" cy="50" r="8" fill="#e31837"/>
    <circle cx="50" cy="50" r="8" fill="#e31837"/>
    <circle cx="70" cy="50" r="8" fill="#e31837"/>
    <text x="50" y="75" textAnchor="middle" fill="#e31837" fontSize="7" fontWeight="bold">CompTIA</text>
  </svg>
);

export const CiscoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1ba0d7"/>
    <rect x="10" y="30" width="12" height="40" fill="#fff"/>
    <rect x="25" y="25" width="12" height="50" fill="#fff"/>
    <rect x="40" y="20" width="12" height="60" fill="#fff"/>
    <rect x="55" y="25" width="12" height="50" fill="#fff"/>
    <rect x="70" y="30" width="12" height="40" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">CISCO</text>
  </svg>
);

export const AzureIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0078d4"/>
    <path d="M25 70 L40 30 L60 40 L75 25 L60 75 L25 70" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">AZURE</text>
  </svg>
);

export const GoogleCloudIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#4285f4"/>
    <path d="M20 60 Q20 40 40 40 L60 40 Q80 40 80 60 Q80 80 60 80 L40 80 Q20 80 20 60" fill="#fff"/>
    <circle cx="35" cy="50" r="5" fill="#4285f4"/>
    <circle cx="50" cy="50" r="5" fill="#ea4335"/>
    <circle cx="65" cy="50" r="5" fill="#fbbc04"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">CLOUD</text>
  </svg>
);

export const OracleIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#f80000"/>
    <ellipse cx="50" cy="50" rx="30" ry="20" fill="#fff"/>
    <text x="50" y="55" textAnchor="middle" fill="#f80000" fontSize="8" fontWeight="bold">ORACLE</text>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">DATABASE</text>
  </svg>
);

export const VMwareIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#607078"/>
    <rect x="15" y="25" width="70" height="15" fill="#fff"/>
    <rect x="15" y="42.5" width="70" height="15" fill="#fff"/>
    <rect x="15" y="60" width="70" height="15" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">VMware</text>
  </svg>
);

export const KubernetesIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#326ce5"/>
    <polygon points="50,20 70,35 65,60 35,60 30,35" fill="#fff"/>
    <circle cx="50" cy="45" r="8" fill="#326ce5"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">K8s</text>
  </svg>
);

export const DockerIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#2496ed"/>
    <rect x="15" y="35" width="12" height="8" fill="#fff"/>
    <rect x="30" y="35" width="12" height="8" fill="#fff"/>
    <rect x="45" y="35" width="12" height="8" fill="#fff"/>
    <rect x="60" y="35" width="12" height="8" fill="#fff"/>
    <rect x="30" y="45" width="12" height="8" fill="#fff"/>
    <rect x="45" y="45" width="12" height="8" fill="#fff"/>
    <rect x="45" y="25" width="12" height="8" fill="#fff"/>
    <path d="M75 40 Q85 35 85 45 Q85 55 75 50" fill="#fff"/>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">Docker</text>
  </svg>
);

// Academic Subject Icons

export const MathIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#4f46e5"/>
    <text x="50" y="35" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">π</text>
    <text x="30" y="55" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">∑</text>
    <text x="70" y="55" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">∫</text>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">√x</text>
  </svg>
);

export const StatisticsIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#059669"/>
    <rect x="15" y="60" width="10" height="20" fill="#fff"/>
    <rect x="30" y="45" width="10" height="35" fill="#fff"/>
    <rect x="45" y="35" width="10" height="45" fill="#fff"/>
    <rect x="60" y="50" width="10" height="30" fill="#fff"/>
    <rect x="75" y="55" width="10" height="25" fill="#fff"/>
    <path d="M15 30 Q30 25 45 30 Q60 35 75 25" stroke="#fff" strokeWidth="2" fill="none"/>
  </svg>
);

export const ScienceIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#dc2626"/>
    <path d="M40 30 L40 45 L25 70 L75 70 L60 45 L60 30 L55 30 L55 40 L45 40 L45 30 Z" fill="#fff"/>
    <circle cx="35" cy="55" r="3" fill="#dc2626"/>
    <circle cx="50" cy="60" r="2" fill="#dc2626"/>
    <circle cx="65" cy="58" r="2.5" fill="#dc2626"/>
    <rect x="38" y="25" width="24" height="3" fill="#fff"/>
  </svg>
);

export const EngineeringIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#7c3aed"/>
    <rect x="30" y="25" width="40" height="8" fill="#fff"/>
    <rect x="25" y="40" width="50" height="6" fill="#fff"/>
    <rect x="20" y="52" width="60" height="6" fill="#fff"/>
    <rect x="25" y="64" width="50" height="6" fill="#fff"/>
    <rect x="30" y="76" width="40" height="6" fill="#fff"/>
    <circle cx="20" cy="25" r="3" fill="#fff"/>
    <circle cx="80" cy="25" r="3" fill="#fff"/>
  </svg>
);

export const BusinessIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0891b2"/>
    <rect x="20" y="30" width="60" height="45" fill="#fff"/>
    <rect x="25" y="35" width="15" height="8" fill="#0891b2"/>
    <rect x="45" y="35" width="15" height="8" fill="#0891b2"/>
    <rect x="65" y="35" width="10" height="8" fill="#0891b2"/>
    <rect x="25" y="48" width="15" height="8" fill="#0891b2"/>
    <rect x="45" y="48" width="15" height="8" fill="#0891b2"/>
    <rect x="65" y="48" width="10" height="8" fill="#0891b2"/>
    <rect x="25" y="61" width="50" height="8" fill="#0891b2"/>
  </svg>
);

export const MedicalIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#dc2626"/>
    <rect x="35" y="25" width="30" height="8" fill="#fff"/>
    <rect x="46" y="14" width="8" height="30" fill="#fff"/>
    <rect x="20" y="50" width="60" height="30" rx="5" fill="#fff"/>
    <rect x="30" y="60" width="15" height="3" fill="#dc2626"/>
    <rect x="30" y="67" width="20" height="3" fill="#dc2626"/>
    <rect x="55" y="60" width="15" height="3" fill="#dc2626"/>
    <rect x="55" y="67" width="10" height="3" fill="#dc2626"/>
  </svg>
);

// Icon mapping for easy lookup
export const CertificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'pmp': PMPIcon,
  'aws': AWSIcon,
  'comptia': CompTIAIcon,
  'cisco': CiscoIcon,
  'azure': AzureIcon,
  'googlecloud': GoogleCloudIcon,
  'oracle': OracleIcon,
  'vmware': VMwareIcon,
  'kubernetes': KubernetesIcon,
  'docker': DockerIcon,
  'math': MathIcon,
  'mathematics': MathIcon,
  'statistics': StatisticsIcon,
  'science': ScienceIcon,
  'engineering': EngineeringIcon,
  'business': BusinessIcon,
  'medical': MedicalIcon,
};

// Function to get icon component for a subject name
export function getIconComponent(subjectName: string): React.ComponentType<{ className?: string }> | null {
  // Direct mapping of subject names to icon keys
  const exactIconMapping: Record<string, string> = {
    // Professional Certifications
    'PMP Certification': 'pmp',
    'AWS Cloud Practitioner': 'aws',
    'AWS Solutions Architect': 'aws',
    'AWS Developer': 'aws',
    'AWS SysOps Administrator': 'aws',
    'CompTIA Security+': 'comptia',
    'CompTIA Network+': 'comptia',
    'CompTIA A+': 'comptia',
    'Cisco CCNA': 'cisco',
    'Cisco CCNP': 'cisco',
    'Azure Fundamentals': 'azure',
    'Azure Administrator': 'azure',
    'Google Cloud Professional': 'googlecloud',
    'Oracle Database': 'oracle',
    'VMware vSphere': 'vmware',
    'Kubernetes Administrator': 'kubernetes',
    'Docker Certified Associate': 'docker',
    
    // Computer Science & Technology
    'Programming': 'science',
    'Data Structures': 'science',
    'Algorithms': 'science',
    'Computer Science': 'science',
    'Web Development': 'science',
    'Database Design': 'science',
    'Computer Science Fundamentals': 'science',
    
    // Mathematics & Statistics
    'Mathematics': 'math',
    'Calculus': 'math',
    'Linear Algebra': 'math',
    'Discrete Mathematics': 'math',
    'Geometry': 'math',
    'Pre-Calculus': 'math',
    'Statistics': 'statistics',
    'AP Statistics': 'statistics',
    'Biostatistics': 'statistics',
    'Business Statistics': 'statistics',
    'Elementary Statistics': 'statistics',
    'Intro to Statistics': 'statistics',
    
    // Natural Sciences
    'Physics': 'science',
    'Chemistry': 'science',
    'Biology': 'science',
    'Astronomy': 'science',
    'Earth Science': 'science',
    
    // Engineering
    'Engineering': 'engineering',
    'Mechanical Engineering': 'engineering',
    'Electrical Engineering': 'engineering',
    
    // Business & Economics
    'Business': 'business',
    'Accounting': 'business',
    'Economics': 'business',
    'Finance': 'business',
    'Business Administration': 'business',
    
    // Medical & Health Sciences
    'Nursing': 'medical',
    'Pharmacology': 'medical',
    'Medical Sciences': 'medical',
    'Health Sciences': 'medical',
    'Anatomy': 'medical',
    'HESI': 'medical',
    'TEAS': 'medical',
    
    // Social Sciences & Liberal Arts
    'Psychology': 'science',
    'History': 'business',
    'Philosophy': 'business', 
    'Sociology': 'science',
    'Political Science': 'science',
    'English': 'business',
    'Writing': 'business',
    
    // Test Preparation
    'GRE': 'business',
    'LSAT': 'business',
    'TOEFL': 'business',
    'GED': 'business'
  };
  
  // Check EXACT subject name mapping first (case-sensitive)
  if (exactIconMapping[subjectName]) {
    return CertificationIcons[exactIconMapping[subjectName]] || null;
  }
  
  // No fuzzy matching - return null if no exact match
  return null;
}