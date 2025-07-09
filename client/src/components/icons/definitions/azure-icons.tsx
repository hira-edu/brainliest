/**
 * Microsoft Azure Icons
 * Official Microsoft Azure certification icons
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// Azure Icon
const AzureIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#0078d4"/>
    <path d="M30 25 L50 25 L70 45 L50 75 L30 75 L50 55 Z" fill="#fff"/>
    <path d="M50 25 L70 25 L70 45 L50 45 Z" fill="#b3d9ff"/>
    <path d="M30 55 L50 55 L50 75 L30 75 Z" fill="#b3d9ff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Azure</text>
  </>
);

const AzureIcon = createIcon(AzureIconContent, 'AzureIcon');

export const icons: IconRegistryEntry[] = [
  {
    component: AzureIcon,
    metadata: {
      id: 'azure',
      name: 'Microsoft Azure',
      category: 'certification',
      description: 'Microsoft Azure cloud platform certification icon',
      keywords: ['azure', 'microsoft', 'cloud', 'certification', 'fundamentals'],
      brandColors: {
        primary: '#0078d4',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['cloud', 'microsoft', 'azure', 'certification'],
      official: true
    }
  }
];