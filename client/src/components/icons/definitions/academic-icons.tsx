/**
 * Academic Subject Icons
 * Educational and academic discipline icons
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// Mathematics Icon
const MathematicsIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#8b5cf6"/>
    <text x="50" y="35" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">π</text>
    <text x="30" y="55" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">∫</text>
    <text x="70" y="55" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">∑</text>
    <text x="50" y="75" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">√x</text>
  </>
);

// Statistics Icon
const StatisticsIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#059669"/>
    <rect x="15" y="60" width="10" height="20" fill="#fff"/>
    <rect x="30" y="45" width="10" height="35" fill="#fff"/>
    <rect x="45" y="35" width="10" height="45" fill="#fff"/>
    <rect x="60" y="50" width="10" height="30" fill="#fff"/>
    <rect x="75" y="55" width="10" height="25" fill="#fff"/>
    <path d="M15 30 Q30 25 45 30 Q60 35 75 25" stroke="#fff" strokeWidth="2" fill="none"/>
  </>
);

// Science Icon
const ScienceIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#dc2626"/>
    <path d="M40 30 L40 45 L25 70 L75 70 L60 45 L60 30 L55 30 L55 40 L45 40 L45 30 Z" fill="#fff"/>
    <circle cx="35" cy="55" r="3" fill="#dc2626"/>
    <circle cx="50" cy="60" r="2" fill="#dc2626"/>
    <circle cx="65" cy="58" r="2.5" fill="#dc2626"/>
    <rect x="38" y="25" width="24" height="3" fill="#fff"/>
  </>
);

// Engineering Icon
const EngineeringIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#475569"/>
    <circle cx="35" cy="35" r="12" stroke="#fff" strokeWidth="3" fill="none"/>
    <circle cx="65" cy="65" r="12" stroke="#fff" strokeWidth="3" fill="none"/>
    <rect x="42" y="42" width="16" height="16" fill="#fff" transform="rotate(45 50 50)"/>
    <circle cx="35" cy="35" r="4" fill="#fff"/>
    <circle cx="65" cy="65" r="4" fill="#fff"/>
  </>
);

// Business Icon
const BusinessIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#1f2937"/>
    <rect x="20" y="30" width="60" height="40" rx="5" fill="#fff"/>
    <rect x="25" y="20" width="50" height="8" rx="4" fill="#fff"/>
    <rect x="30" y="40" width="15" height="3" fill="#1f2937"/>
    <rect x="30" y="47" width="20" height="3" fill="#1f2937"/>
    <rect x="55" y="40" width="15" height="3" fill="#1f2937"/>
    <rect x="55" y="47" width="10" height="3" fill="#1f2937"/>
    <circle cx="70" cy="30" r="8" fill="#fff"/>
    <circle cx="70" cy="30" r="4" fill="#1f2937"/>
  </>
);

// Medical Icon
const MedicalIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#dc2626"/>
    <rect x="35" y="25" width="30" height="8" fill="#fff"/>
    <rect x="46" y="14" width="8" height="30" fill="#fff"/>
    <rect x="20" y="50" width="60" height="30" rx="5" fill="#fff"/>
    <rect x="30" y="60" width="15" height="3" fill="#dc2626"/>
    <rect x="30" y="67" width="20" height="3" fill="#dc2626"/>
    <rect x="55" y="60" width="15" height="3" fill="#dc2626"/>
    <rect x="55" y="67" width="10" height="3" fill="#dc2626"/>
  </>
);

// Computer Science Icon
const ComputerScienceIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#1e40af"/>
    <rect x="15" y="25" width="70" height="45" rx="5" fill="#fff"/>
    <rect x="20" y="30" width="60" height="25" fill="#1e40af"/>
    <rect x="25" y="35" width="8" height="3" fill="#fff"/>
    <rect x="25" y="40" width="12" height="3" fill="#fff"/>
    <rect x="25" y="45" width="6" height="3" fill="#fff"/>
    <rect x="50" y="35" width="20" height="15" rx="2" fill="#fff"/>
    <rect x="40" y="75" width="20" height="5" rx="2" fill="#fff"/>
  </>
);

// Create icon components
const MathematicsIcon = createIcon(MathematicsIconContent, 'MathematicsIcon');
const StatisticsIcon = createIcon(StatisticsIconContent, 'StatisticsIcon');
const ScienceIcon = createIcon(ScienceIconContent, 'ScienceIcon');
const EngineeringIcon = createIcon(EngineeringIconContent, 'EngineeringIcon');
const BusinessIcon = createIcon(BusinessIconContent, 'BusinessIcon');
const MedicalIcon = createIcon(MedicalIconContent, 'MedicalIcon');
const ComputerScienceIcon = createIcon(ComputerScienceIconContent, 'ComputerScienceIcon');

export const icons: IconRegistryEntry[] = [
  {
    component: MathematicsIcon,
    metadata: {
      id: 'mathematics',
      name: 'Mathematics',
      category: 'mathematics',
      description: 'Mathematical concepts and symbols',
      keywords: ['math', 'mathematics', 'calculus', 'algebra', 'geometry'],
      brandColors: {
        primary: '#8b5cf6'
      },
      variants: ['filled'],
      tags: ['math', 'education', 'academic'],
      official: false
    }
  },
  {
    component: StatisticsIcon,
    metadata: {
      id: 'statistics',
      name: 'Statistics',
      category: 'mathematics',
      description: 'Statistical analysis and data visualization',
      keywords: ['statistics', 'data', 'analysis', 'charts', 'graphs'],
      brandColors: {
        primary: '#059669'
      },
      variants: ['filled'],
      tags: ['statistics', 'data', 'analysis'],
      official: false
    }
  },
  {
    component: ScienceIcon,
    metadata: {
      id: 'science',
      name: 'Science',
      category: 'science',
      description: 'Natural sciences and laboratory work',
      keywords: ['science', 'physics', 'chemistry', 'biology', 'laboratory'],
      brandColors: {
        primary: '#dc2626'
      },
      variants: ['filled'],
      tags: ['science', 'laboratory', 'research'],
      official: false
    }
  },
  {
    component: EngineeringIcon,
    metadata: {
      id: 'engineering',
      name: 'Engineering',
      category: 'engineering',
      description: 'Engineering disciplines and mechanical design',
      keywords: ['engineering', 'mechanical', 'electrical', 'design', 'technology'],
      brandColors: {
        primary: '#475569'
      },
      variants: ['filled'],
      tags: ['engineering', 'design', 'technology'],
      official: false
    }
  },
  {
    component: BusinessIcon,
    metadata: {
      id: 'business',
      name: 'Business',
      category: 'business',
      description: 'Business administration and economics',
      keywords: ['business', 'economics', 'finance', 'accounting', 'management'],
      brandColors: {
        primary: '#1f2937'
      },
      variants: ['filled'],
      tags: ['business', 'economics', 'finance'],
      official: false
    }
  },
  {
    component: MedicalIcon,
    metadata: {
      id: 'medical',
      name: 'Medical',
      category: 'medical',
      description: 'Medical and healthcare sciences',
      keywords: ['medical', 'healthcare', 'nursing', 'medicine', 'health'],
      brandColors: {
        primary: '#dc2626'
      },
      variants: ['filled'],
      tags: ['medical', 'healthcare', 'nursing'],
      official: false
    }
  },
  {
    component: ComputerScienceIcon,
    metadata: {
      id: 'computer-science',
      name: 'Computer Science',
      category: 'technology',
      description: 'Computer science and programming',
      keywords: ['computer', 'science', 'programming', 'software', 'technology'],
      brandColors: {
        primary: '#1e40af'
      },
      variants: ['filled'],
      tags: ['computer-science', 'programming', 'technology'],
      official: false
    }
  }
];