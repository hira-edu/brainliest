/**
 * General Purpose Icons
 * Common UI and functional icons
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// Academic/General Icon
const AcademicIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#6b7280"/>
    <rect x="25" y="30" width="50" height="40" rx="5" fill="#fff"/>
    <rect x="30" y="20" width="40" height="8" fill="#fff"/>
    <rect x="35" y="40" width="15" height="3" fill="#6b7280"/>
    <rect x="35" y="47" width="20" height="3" fill="#6b7280"/>
    <rect x="35" y="54" width="18" height="3" fill="#6b7280"/>
    <circle cx="65" cy="25" r="8" fill="#fff"/>
    <rect x="62" y="22" width="6" height="6" fill="#6b7280"/>
  </>
);

// Test Preparation Icon
const TestPrepIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#f59e0b"/>
    <rect x="20" y="25" width="60" height="50" rx="5" fill="#fff"/>
    <rect x="30" y="35" width="40" height="3" fill="#f59e0b"/>
    <rect x="30" y="42" width="25" height="3" fill="#d1d5db"/>
    <rect x="30" y="49" width="35" height="3" fill="#d1d5db"/>
    <rect x="30" y="56" width="20" height="3" fill="#d1d5db"/>
    <circle cx="70" cy="40" r="3" fill="#10b981"/>
    <circle cx="70" cy="50" r="3" fill="#ef4444"/>
    <circle cx="70" cy="60" r="3" fill="#6b7280"/>
  </>
);

// Certificate Icon
const CertificateIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#eab308"/>
    <rect x="15" y="25" width="70" height="50" rx="5" fill="#fff"/>
    <rect x="20" y="30" width="60" height="3" fill="#eab308"/>
    <rect x="30" y="40" width="40" height="2" fill="#d1d5db"/>
    <rect x="30" y="47" width="25" height="2" fill="#d1d5db"/>
    <circle cx="50" cy="60" r="8" stroke="#eab308" strokeWidth="2" fill="none"/>
    <path d="M46 60 L49 63 L54 57" stroke="#eab308" strokeWidth="2" fill="none"/>
    <polygon points="75,75 85,70 85,80" fill="#dc2626"/>
    <polygon points="75,75 85,70 80,75" fill="#991b1b"/>
  </>
);

// Create icon components
const AcademicIcon = createIcon(AcademicIconContent, 'AcademicIcon');
const TestPrepIcon = createIcon(TestPrepIconContent, 'TestPrepIcon');
const CertificateIcon = createIcon(CertificateIconContent, 'CertificateIcon');

export const icons: IconRegistryEntry[] = [
  {
    component: AcademicIcon,
    metadata: {
      id: 'academic',
      name: 'Academic',
      category: 'general',
      description: 'General academic and educational content',
      keywords: ['academic', 'education', 'learning', 'study', 'school'],
      brandColors: {
        primary: '#6b7280'
      },
      variants: ['filled'],
      tags: ['education', 'academic', 'general'],
      official: false
    }
  },
  {
    component: TestPrepIcon,
    metadata: {
      id: 'test-prep',
      name: 'Test Preparation',
      category: 'test-prep',
      description: 'Standardized test preparation',
      keywords: ['test', 'preparation', 'exam', 'standardized', 'assessment'],
      brandColors: {
        primary: '#f59e0b'
      },
      variants: ['filled'],
      tags: ['test', 'preparation', 'assessment'],
      official: false
    }
  },
  {
    component: CertificateIcon,
    metadata: {
      id: 'certificate',
      name: 'Certificate',
      category: 'general',
      description: 'Certification and achievement recognition',
      keywords: ['certificate', 'certification', 'achievement', 'award', 'recognition'],
      brandColors: {
        primary: '#eab308'
      },
      variants: ['filled'],
      tags: ['certificate', 'achievement', 'award'],
      official: false
    }
  }
];