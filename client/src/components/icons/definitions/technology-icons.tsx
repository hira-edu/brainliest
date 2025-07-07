/**
 * Technology Platform Icons
 * Modern technology and development platform icons
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// Code/Programming Icon
const CodeIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#374151"/>
    <rect x="10" y="20" width="80" height="60" rx="8" fill="#1f2937"/>
    <circle cx="20" cy="35" r="3" fill="#ef4444"/>
    <circle cx="30" cy="35" r="3" fill="#f59e0b"/>
    <circle cx="40" cy="35" r="3" fill="#10b981"/>
    <text x="20" y="55" fill="#10b981" fontSize="8" fontFamily="monospace">&lt;/&gt;</text>
    <rect x="40" y="50" width="15" height="2" fill="#6b7280"/>
    <rect x="40" y="55" width="25" height="2" fill="#6b7280"/>
    <rect x="40" y="60" width="20" height="2" fill="#6b7280"/>
  </>
);

// Database Icon
const DatabaseIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#1f2937"/>
    <ellipse cx="50" cy="30" rx="25" ry="8" fill="#3b82f6"/>
    <rect x="25" y="30" width="50" height="25" fill="#3b82f6"/>
    <ellipse cx="50" cy="55" rx="25" ry="8" fill="#1e40af"/>
    <rect x="25" y="55" width="50" height="15" fill="#1e40af"/>
    <ellipse cx="50" cy="70" rx="25" ry="8" fill="#1d4ed8"/>
  </>
);

// Web Development Icon
const WebDevIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#059669"/>
    <rect x="15" y="25" width="70" height="50" rx="5" fill="#fff"/>
    <rect x="15" y="25" width="70" height="12" fill="#10b981"/>
    <circle cx="25" cy="31" r="2" fill="#fff"/>
    <circle cx="32" cy="31" r="2" fill="#fff"/>
    <circle cx="39" cy="31" r="2" fill="#fff"/>
    <rect x="25" y="45" width="20" height="3" fill="#10b981"/>
    <rect x="25" y="52" width="30" height="3" fill="#d1d5db"/>
    <rect x="25" y="59" width="25" height="3" fill="#d1d5db"/>
    <rect x="55" y="45" width="20" height="20" fill="#10b981"/>
  </>
);

// Algorithm Icon
const AlgorithmIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#7c3aed"/>
    <circle cx="30" cy="30" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <circle cx="70" cy="30" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="70" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <circle cx="70" cy="70" r="8" stroke="#fff" strokeWidth="2" fill="none"/>
    <path d="M38 30 L62 30" stroke="#fff" strokeWidth="2"/>
    <path d="M30 38 L30 62" stroke="#fff" strokeWidth="2"/>
    <path d="M38 70 L62 70" stroke="#fff" strokeWidth="2"/>
    <path d="M70 38 L70 62" stroke="#fff" strokeWidth="2"/>
    <circle cx="50" cy="50" r="5" fill="#fff"/>
  </>
);

// Cloud Icon
const CloudIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#0ea5e9"/>
    <path d="M25 55 Q25 40 40 40 Q45 30 60 35 Q75 30 80 45 Q85 50 80 60 L30 60 Q20 60 25 55" fill="#fff"/>
    <rect x="35" y="50" width="3" height="8" fill="#0ea5e9"/>
    <rect x="42" y="52" width="3" height="6" fill="#0ea5e9"/>
    <rect x="49" y="51" width="3" height="7" fill="#0ea5e9"/>
    <rect x="56" y="53" width="3" height="5" fill="#0ea5e9"/>
    <rect x="63" y="50" width="3" height="8" fill="#0ea5e9"/>
  </>
);

// Create icon components
const CodeIcon = createIcon(CodeIconContent, 'CodeIcon');
const DatabaseIcon = createIcon(DatabaseIconContent, 'DatabaseIcon');
const WebDevIcon = createIcon(WebDevIconContent, 'WebDevIcon');
const AlgorithmIcon = createIcon(AlgorithmIconContent, 'AlgorithmIcon');
const CloudIcon = createIcon(CloudIconContent, 'CloudIcon');

export const icons: IconRegistryEntry[] = [
  {
    component: CodeIcon,
    metadata: {
      id: 'code',
      name: 'Programming',
      category: 'technology',
      description: 'Programming and software development',
      keywords: ['code', 'programming', 'software', 'development', 'coding'],
      brandColors: {
        primary: '#374151'
      },
      variants: ['filled'],
      tags: ['programming', 'development', 'software'],
      official: false
    }
  },
  {
    component: DatabaseIcon,
    metadata: {
      id: 'database',
      name: 'Database',
      category: 'technology',
      description: 'Database management and design',
      keywords: ['database', 'sql', 'data', 'storage', 'management'],
      brandColors: {
        primary: '#1f2937'
      },
      variants: ['filled'],
      tags: ['database', 'data', 'storage'],
      official: false
    }
  },
  {
    component: WebDevIcon,
    metadata: {
      id: 'web-dev',
      name: 'Web Development',
      category: 'technology',
      description: 'Web development and frontend design',
      keywords: ['web', 'development', 'frontend', 'html', 'css', 'javascript'],
      brandColors: {
        primary: '#059669'
      },
      variants: ['filled'],
      tags: ['web', 'frontend', 'development'],
      official: false
    }
  },
  {
    component: AlgorithmIcon,
    metadata: {
      id: 'algorithm',
      name: 'Algorithms',
      category: 'technology',
      description: 'Algorithms and data structures',
      keywords: ['algorithm', 'data structures', 'computer science', 'logic'],
      brandColors: {
        primary: '#7c3aed'
      },
      variants: ['filled'],
      tags: ['algorithms', 'data-structures', 'logic'],
      official: false
    }
  },
  {
    component: CloudIcon,
    metadata: {
      id: 'cloud',
      name: 'Cloud Computing',
      category: 'technology',
      description: 'Cloud computing and infrastructure',
      keywords: ['cloud', 'computing', 'infrastructure', 'saas', 'paas'],
      brandColors: {
        primary: '#0ea5e9'
      },
      variants: ['filled'],
      tags: ['cloud', 'infrastructure', 'computing'],
      official: false
    }
  }
];