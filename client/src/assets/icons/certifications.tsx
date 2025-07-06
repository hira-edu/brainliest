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
    <circle cx="50" cy="40" r="15" fill="#fff"/>
    <rect x="42" y="32" width="16" height="3" fill="#e31837"/>
    <rect x="42" y="37" width="16" height="3" fill="#e31837"/>
    <rect x="42" y="42" width="16" height="3" fill="#e31837"/>
    <rect x="42" y="47" width="16" height="3" fill="#e31837"/>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">CompTIA</text>
  </svg>
);

export const CiscoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#1ba0d7"/>
    <rect x="15" y="35" width="8" height="30" rx="2" fill="#fff"/>
    <rect x="25" y="30" width="8" height="40" rx="2" fill="#fff"/>
    <rect x="35" y="25" width="8" height="50" rx="2" fill="#fff"/>
    <rect x="45" y="30" width="8" height="40" rx="2" fill="#fff"/>
    <rect x="55" y="35" width="8" height="30" rx="2" fill="#fff"/>
    <rect x="65" y="30" width="8" height="40" rx="2" fill="#fff"/>
    <rect x="75" y="35" width="8" height="30" rx="2" fill="#fff"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">CISCO</text>
  </svg>
);

export const AzureIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0078d4"/>
    <path d="M25 35 L45 25 L55 45 L75 40 L65 65 L35 70 Z" fill="#fff"/>
    <circle cx="40" cy="50" r="3" fill="#0078d4"/>
    <circle cx="60" cy="45" r="3" fill="#0078d4"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">AZURE</text>
  </svg>
);

export const GoogleCloudIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#4285f4"/>
    <path d="M25 45 Q25 35 35 35 L65 35 Q75 35 75 45 L75 55 Q75 65 65 65 L35 65 Q25 65 25 55 Z" fill="#fff"/>
    <circle cx="40" cy="45" r="3" fill="#34a853"/>
    <circle cx="50" cy="50" r="3" fill="#ea4335"/>
    <circle cx="60" cy="45" r="3" fill="#fbbc04"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">GCP</text>
  </svg>
);

export const OracleIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#f80000"/>
    <ellipse cx="50" cy="45" rx="25" ry="15" fill="#fff"/>
    <text x="50" y="50" textAnchor="middle" fill="#f80000" fontSize="8" fontWeight="bold">O</text>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">ORACLE</text>
  </svg>
);

export const VMwareIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#607078"/>
    <path d="M20 40 L35 30 L50 40 L65 30 L80 40 L50 60 Z" fill="#fff"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">VMware</text>
  </svg>
);

export const KubernetesIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#326ce5"/>
    <path d="M50 25 L65 35 L65 55 L50 65 L35 55 L35 35 Z" stroke="#fff" strokeWidth="3" fill="none"/>
    <circle cx="50" cy="45" r="8" fill="#fff"/>
    <path d="M50 37 L50 25" stroke="#fff" strokeWidth="2"/>
    <path d="M58 41 L65 35" stroke="#fff" strokeWidth="2"/>
    <path d="M58 49 L65 55" stroke="#fff" strokeWidth="2"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold">K8s</text>
  </svg>
);

export const DockerIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#2496ed"/>
    <rect x="25" y="45" width="8" height="8" fill="#fff"/>
    <rect x="35" y="45" width="8" height="8" fill="#fff"/>
    <rect x="45" y="45" width="8" height="8" fill="#fff"/>
    <rect x="55" y="45" width="8" height="8" fill="#fff"/>
    <rect x="35" y="35" width="8" height="8" fill="#fff"/>
    <rect x="45" y="35" width="8" height="8" fill="#fff"/>
    <rect x="45" y="25" width="8" height="8" fill="#fff"/>
    <path d="M65 35 Q75 30 80 40 Q75 50 65 45" fill="#fff"/>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">Docker</text>
  </svg>
);

// Academic subject icons
export const MathIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#6366f1"/>
    <text x="50" y="45" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">∑</text>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">MATH</text>
  </svg>
);

export const StatisticsIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#8b5cf6"/>
    <rect x="25" y="55" width="8" height="20" fill="#fff"/>
    <rect x="38" y="45" width="8" height="30" fill="#fff"/>
    <rect x="51" y="35" width="8" height="40" fill="#fff"/>
    <rect x="64" y="50" width="8" height="25" fill="#fff"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">STATS</text>
  </svg>
);

export const ScienceIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#10b981"/>
    <circle cx="40" cy="35" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <circle cx="60" cy="35" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <path d="M35 50 Q50 60 65 50" stroke="#fff" strokeWidth="3" fill="none"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">SCIENCE</text>
  </svg>
);

export const EngineeringIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#f59e0b"/>
    <rect x="30" y="30" width="40" height="6" fill="#fff"/>
    <rect x="30" y="40" width="40" height="6" fill="#fff"/>
    <rect x="30" y="50" width="40" height="6" fill="#fff"/>
    <rect x="30" y="60" width="40" height="6" fill="#fff"/>
    <circle cx="25" cy="45" r="3" fill="#fff"/>
    <circle cx="75" cy="45" r="3" fill="#fff"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold">ENGINEER</text>
  </svg>
);

export const BusinessIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#3b82f6"/>
    <rect x="30" y="30" width="40" height="25" fill="#fff"/>
    <rect x="35" y="35" width="8" height="15" fill="#3b82f6"/>
    <rect x="46" y="35" width="8" height="15" fill="#3b82f6"/>
    <rect x="57" y="35" width="8" height="15" fill="#3b82f6"/>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">BUSINESS</text>
  </svg>
);

export const MedicalIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#ef4444"/>
    <rect x="45" y="25" width="10" height="50" fill="#fff"/>
    <rect x="25" y="45" width="50" height="10" fill="#fff"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">MEDICAL</text>
  </svg>
);

// Icon mapping for easy lookup
export const CertificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'pmp': PMPIcon,
  'aws': AWSIcon,
  'comptia': CompTIAIcon,
  'cisco': CiscoIcon,
  'azure': AzureIcon,
  'gcp': GoogleCloudIcon,
  'google-cloud': GoogleCloudIcon,
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

// Helper function to get icon component by name
export const getIconComponent = (subjectName: string): React.ComponentType<{ className?: string }> | null => {
  if (!subjectName) return null;
  
  const name = subjectName.toLowerCase();
  
  // Direct mapping for better accuracy
  const iconMapping: Record<string, string> = {
    'pmp certification': 'pmp',
    'aws certified solutions architect': 'aws',
    'aws cloud practitioner': 'aws',
    'aws': 'aws',
    'comptia security+': 'comptia',
    'comptia': 'comptia',
    'cisco ccna': 'cisco',
    'cisco': 'cisco',
    'microsoft azure fundamentals': 'azure',
    'azure fundamentals': 'azure',
    'azure': 'azure',
    'google cloud platform': 'googlecloud',
    'google cloud': 'googlecloud',
    'gcp': 'googlecloud',
    'oracle': 'oracle',
    'vmware': 'vmware',
    'kubernetes': 'kubernetes',
    'docker': 'docker',
    'mathematics': 'math',
    'statistics': 'statistics',
    'ap statistics': 'statistics',
    'biostatistics': 'statistics',
    'business statistics': 'statistics',
    'elementary statistics': 'statistics',
    'intro to statistics': 'statistics',
    'science': 'science',
    'biology': 'science',
    'chemistry': 'science',
    'physics': 'science',
    'engineering': 'engineering',
    'mechanical engineering': 'engineering',
    'electrical engineering': 'engineering',
    'business': 'business',
    'business administration': 'business',
    'accounting': 'business',
    'economics': 'business',
    'finance': 'business',
    'medical': 'medical',
    'nursing': 'medical',
    'health sciences': 'medical',
    'medical sciences': 'medical',
    'pharmacology': 'medical'
  };
  
  // Check direct mapping first
  if (iconMapping[name]) {
    return CertificationIcons[iconMapping[name]] || null;
  }
  
  // Check if subject name contains any of our certification keywords
  for (const [keyword, iconKey] of Object.entries(iconMapping)) {
    if (name.includes(keyword)) {
      return CertificationIcons[iconKey] || null;
    }
  }
  
  // Fallback: try direct match with normalized name
  const normalizedName = name.replace(/[^a-z0-9]/g, '');
  return CertificationIcons[normalizedName] || null;
};