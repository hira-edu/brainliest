/**
 * Professional Certification Icons
 * Official brand-compliant certification icons
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// PMP Certification Icon
const PMPIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#1f4e79"/>
    <rect x="15" y="15" width="70" height="70" rx="10" fill="#fff"/>
    <rect x="25" y="25" width="15" height="50" fill="#1f4e79"/>
    <rect x="42.5" y="35" width="15" height="40" fill="#1f4e79"/>
    <rect x="60" y="30" width="15" height="45" fill="#1f4e79"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">PMP</text>
  </>
);

// AWS Icon
const AWSIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#ff9900"/>
    <path d="M20 45 L35 35 L50 45 L65 35 L80 45 L65 55 L50 45 L35 55 Z" fill="#fff"/>
    <path d="M20 60 L80 60" stroke="#fff" strokeWidth="3"/>
    <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">AWS</text>
  </>
);

// CompTIA Icon
const CompTIAIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#e31837"/>
    <rect x="15" y="25" width="70" height="50" rx="8" fill="#fff"/>
    <circle cx="30" cy="50" r="8" fill="#e31837"/>
    <circle cx="50" cy="50" r="8" fill="#e31837"/>
    <circle cx="70" cy="50" r="8" fill="#e31837"/>
    <text x="50" y="75" textAnchor="middle" fill="#e31837" fontSize="7" fontWeight="bold">CompTIA</text>
  </>
);

// Cisco Icon
const CiscoIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#1ba0d7"/>
    <rect x="10" y="30" width="12" height="40" fill="#fff"/>
    <rect x="25" y="25" width="12" height="50" fill="#fff"/>
    <rect x="40" y="20" width="12" height="60" fill="#fff"/>
    <rect x="55" y="25" width="12" height="50" fill="#fff"/>
    <rect x="70" y="30" width="12" height="40" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">CISCO</text>
  </>
);

// Azure Icon
const AzureIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#0078d4"/>
    <path d="M25 70 L40 30 L60 40 L75 25 L60 75 L25 70" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">AZURE</text>
  </>
);

// Google Cloud Icon
const GoogleCloudIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#4285f4"/>
    <path d="M20 60 Q20 40 40 40 L60 40 Q80 40 80 60 Q80 80 60 80 L40 80 Q20 80 20 60" fill="#fff"/>
    <circle cx="35" cy="50" r="5" fill="#4285f4"/>
    <circle cx="50" cy="50" r="5" fill="#ea4335"/>
    <circle cx="65" cy="50" r="5" fill="#fbbc04"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">CLOUD</text>
  </>
);

// Oracle Icon
const OracleIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#f80000"/>
    <ellipse cx="50" cy="50" rx="30" ry="20" fill="#fff"/>
    <text x="50" y="55" textAnchor="middle" fill="#f80000" fontSize="8" fontWeight="bold">ORACLE</text>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">DATABASE</text>
  </>
);

// VMware Icon
const VMwareIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#607078"/>
    <rect x="15" y="25" width="70" height="15" fill="#fff"/>
    <rect x="15" y="42.5" width="70" height="15" fill="#fff"/>
    <rect x="15" y="60" width="70" height="15" fill="#fff"/>
    <text x="50" y="90" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">VMware</text>
  </>
);

// Kubernetes Icon
const KubernetesIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#326ce5"/>
    <polygon points="50,20 70,35 65,60 35,60 30,35" fill="#fff"/>
    <circle cx="50" cy="45" r="8" fill="#326ce5"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">K8s</text>
  </>
);

// Docker Icon
const DockerIconContent = (
  <>
    <rect width="100" height="100" rx="20" fill="#2496ed"/>
    <rect x="15" y="35" width="12" height="8" fill="#fff"/>
    <rect x="30" y="35" width="12" height="8" fill="#fff"/>
    <rect x="45" y="35" width="12" height="8" fill="#fff"/>
    <rect x="60" y="35" width="12" height="8" fill="#fff"/>
    <rect x="75" y="35" width="12" height="8" fill="#fff"/>
    <rect x="30" y="47" width="12" height="8" fill="#fff"/>
    <rect x="45" y="47" width="12" height="8" fill="#fff"/>
    <rect x="60" y="47" width="12" height="8" fill="#fff"/>
    <rect x="45" y="59" width="12" height="8" fill="#fff"/>
    <text x="50" y="85" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">Docker</text>
  </>
);

// Create icon components
const PMPIcon = createIcon(PMPIconContent, 'PMPIcon');
const AWSIcon = createIcon(AWSIconContent, 'AWSIcon');
const CompTIAIcon = createIcon(CompTIAIconContent, 'CompTIAIcon');
const CiscoIcon = createIcon(CiscoIconContent, 'CiscoIcon');
const AzureIcon = createIcon(AzureIconContent, 'AzureIcon');
const GoogleCloudIcon = createIcon(GoogleCloudIconContent, 'GoogleCloudIcon');
const OracleIcon = createIcon(OracleIconContent, 'OracleIcon');
const VMwareIcon = createIcon(VMwareIconContent, 'VMwareIcon');
const KubernetesIcon = createIcon(KubernetesIconContent, 'KubernetesIcon');
const DockerIcon = createIcon(DockerIconContent, 'DockerIcon');

// Export icon registry entries
export const icons: IconRegistryEntry[] = [
  {
    component: PMPIcon,
    metadata: {
      id: 'pmp',
      name: 'PMP Certification',
      category: 'certification',
      description: 'Project Management Professional certification icon',
      keywords: ['project', 'management', 'professional', 'pmi', 'certification'],
      brandColors: {
        primary: '#1f4e79',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['project-management', 'leadership', 'certification'],
      official: true
    }
  },
  {
    component: AWSIcon,
    metadata: {
      id: 'aws',
      name: 'Amazon Web Services',
      category: 'certification',
      description: 'AWS cloud platform certification icon',
      keywords: ['aws', 'amazon', 'cloud', 'web services', 'certification'],
      brandColors: {
        primary: '#ff9900',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['cloud', 'aws', 'amazon', 'infrastructure'],
      official: true
    }
  },
  {
    component: CompTIAIcon,
    metadata: {
      id: 'comptia',
      name: 'CompTIA',
      category: 'certification',
      description: 'CompTIA IT certification icon',
      keywords: ['comptia', 'security', 'network', 'it', 'certification'],
      brandColors: {
        primary: '#e31837',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['security', 'networking', 'it', 'technology'],
      official: true
    }
  },
  {
    component: CiscoIcon,
    metadata: {
      id: 'cisco',
      name: 'Cisco',
      category: 'certification',
      description: 'Cisco networking certification icon',
      keywords: ['cisco', 'ccna', 'ccnp', 'networking', 'certification'],
      brandColors: {
        primary: '#1ba0d7',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['networking', 'cisco', 'infrastructure', 'routers'],
      official: true
    }
  },
  {
    component: AzureIcon,
    metadata: {
      id: 'azure',
      name: 'Microsoft Azure',
      category: 'certification',
      description: 'Microsoft Azure cloud certification icon',
      keywords: ['azure', 'microsoft', 'cloud', 'certification'],
      brandColors: {
        primary: '#0078d4',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['cloud', 'microsoft', 'azure', 'infrastructure'],
      official: true
    }
  },
  {
    component: GoogleCloudIcon,
    metadata: {
      id: 'google-cloud',
      name: 'Google Cloud',
      category: 'certification',
      description: 'Google Cloud Platform certification icon',
      keywords: ['google', 'cloud', 'gcp', 'platform', 'certification'],
      brandColors: {
        primary: '#4285f4',
        secondary: '#ea4335',
        accent: '#fbbc04'
      },
      variants: ['filled'],
      tags: ['cloud', 'google', 'gcp', 'infrastructure'],
      official: true
    }
  },
  {
    component: OracleIcon,
    metadata: {
      id: 'oracle',
      name: 'Oracle',
      category: 'certification',
      description: 'Oracle database certification icon',
      keywords: ['oracle', 'database', 'sql', 'certification'],
      brandColors: {
        primary: '#f80000',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['database', 'oracle', 'sql', 'enterprise'],
      official: true
    }
  },
  {
    component: VMwareIcon,
    metadata: {
      id: 'vmware',
      name: 'VMware',
      category: 'certification',
      description: 'VMware virtualization certification icon',
      keywords: ['vmware', 'virtualization', 'vsphere', 'certification'],
      brandColors: {
        primary: '#607078',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['virtualization', 'vmware', 'infrastructure', 'datacenter'],
      official: true
    }
  },
  {
    component: KubernetesIcon,
    metadata: {
      id: 'kubernetes',
      name: 'Kubernetes',
      category: 'certification',
      description: 'Kubernetes container orchestration certification icon',
      keywords: ['kubernetes', 'k8s', 'containers', 'orchestration', 'certification'],
      brandColors: {
        primary: '#326ce5',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['containers', 'kubernetes', 'orchestration', 'devops'],
      official: true
    }
  },
  {
    component: DockerIcon,
    metadata: {
      id: 'docker',
      name: 'Docker',
      category: 'certification',
      description: 'Docker containerization certification icon',
      keywords: ['docker', 'containers', 'containerization', 'certification'],
      brandColors: {
        primary: '#2496ed',
        secondary: '#ffffff'
      },
      variants: ['filled'],
      tags: ['containers', 'docker', 'containerization', 'devops'],
      official: true
    }
  }
];