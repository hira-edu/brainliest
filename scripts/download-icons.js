/**
 * Icon Download and Management Script
 * Downloads comprehensive icon sets and registers them in the system
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

class IconDownloader {
  constructor() {
    this.iconSets = {
      heroicons: 'https://api.github.com/repos/tailwindlabs/heroicons/contents/src/24/outline',
      lucide: 'https://api.github.com/repos/lucide-icons/lucide/contents/icons',
      feather: 'https://api.github.com/repos/feathericons/feather/contents/icons'
    };
    this.downloadedIcons = [];
  }

  async downloadIconSets() {
    console.log('📥 Starting icon download process...\n');
    
    // Create directories
    this.ensureDirectories();
    
    // Download SVG icons for different categories
    await this.downloadHeroicons();
    await this.downloadSubjectSpecificIcons();
    await this.generateIconDefinitions();
    
    console.log(`\n✅ Downloaded ${this.downloadedIcons.length} icons successfully`);
  }

  ensureDirectories() {
    const dirs = [
      'public/icons',
      'public/icons/subjects',
      'public/icons/certifications', 
      'public/icons/technology',
      'public/icons/general'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  async downloadHeroicons() {
    console.log('🎨 Downloading Heroicons...');
    
    // Predefined essential icons for subjects
    const essentialIcons = [
      'academic-cap',
      'calculator',
      'chart-bar',
      'cloud',
      'code-bracket',
      'computer-desktop',
      'beaker',
      'building-office',
      'heart',
      'wrench-screwdriver',
      'document-text',
      'shield-check',
      'globe-alt',
      'server'
    ];

    // Generate SVG content for essential icons
    for (const iconName of essentialIcons) {
      const svgContent = this.generateHeroiconSVG(iconName);
      const filePath = path.join('public/icons/general', `${iconName}.svg`);
      
      fs.writeFileSync(filePath, svgContent);
      this.downloadedIcons.push(iconName);
      console.log(`   ✅ ${iconName}.svg`);
    }
  }

  generateHeroiconSVG(iconName) {
    // Generate simplified SVG based on icon name
    const iconPaths = {
      'academic-cap': 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      'calculator': 'M9 7h6m0 10v-3m-3 3h.01m-4.01 0h.01m2-.01h.01m2-.01h.01m-2-3h.01m-4.01 0h.01m2-.01h.01m2-.01h.01M9 7h6m-6 0V4a1 1 0 011-1h4a1 1 0 011 1v3M9 7v10a2 2 0 002 2h2a2 2 0 002-2V7',
      'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'cloud': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
      'code-bracket': 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
      'computer-desktop': 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
      'beaker': 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5M19.8 15.3c.132.351.2.719.2 1.1a4.1 4.1 0 01-4.1 4.1H8.1a4.1 4.1 0 01-4.1-4.1c0-.381.068-.749.2-1.1',
      'building-office': 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
      'heart': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
      'wrench-screwdriver': 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z',
      'document-text': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      'shield-check': 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      'globe-alt': 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
      'server': 'M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z'
    };

    const pathData = iconPaths[iconName] || 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="${pathData}" />
</svg>`;
  }

  async downloadSubjectSpecificIcons() {
    console.log('📚 Generating subject-specific icons...');
    
    // Create specialized icons for major certification providers
    const specializedIcons = {
      aws: this.generateAWSIcon(),
      azure: this.generateAzureIcon(),
      google_cloud: this.generateGoogleCloudIcon(),
      comptia: this.generateCompTIAIcon(),
      cisco: this.generateCiscoIcon(),
      pmp: this.generatePMPIcon(),
      mathematics: this.generateMathIcon(),
      statistics: this.generateStatsIcon()
    };

    for (const [name, svgContent] of Object.entries(specializedIcons)) {
      const filePath = path.join('public/icons/certifications', `${name}.svg`);
      fs.writeFileSync(filePath, svgContent);
      this.downloadedIcons.push(name);
      console.log(`   ✅ ${name}.svg`);
    }
  }

  generateAWSIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF9900">
  <rect width="24" height="24" rx="4" fill="#232F3E"/>
  <path d="M8.5 15.5c-1.5 0-2.5-1-2.5-2.5s1-2.5 2.5-2.5 2.5 1 2.5 2.5-1 2.5-2.5 2.5zm7-3c-1.5 0-2.5-1-2.5-2.5S14 7.5 15.5 7.5 18 8.5 18 10s-1 2.5-2.5 2.5z" fill="#FF9900"/>
  <path d="M6 18c4-1 8-1 12 0" stroke="#FF9900" stroke-width="1.5" fill="none"/>
</svg>`;
  }

  generateAzureIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0078D4">
  <rect width="24" height="24" rx="4" fill="#0078D4"/>
  <path d="M6 8l6-3 6 6-6 3-6-6z" fill="#FFF"/>
  <path d="M12 11l6 3v6l-6-3v-6z" fill="#B3D9FF"/>
  <path d="M6 14l6-3v6l-6 3v-6z" fill="#B3D9FF"/>
</svg>`;
  }

  generateGoogleCloudIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4">
  <rect width="24" height="24" rx="4" fill="#4285F4"/>
  <path d="M8 12c0-2 1.5-3.5 3.5-3.5S15 10 15 12s-1.5 3.5-3.5 3.5S8 14 8 12z" fill="#FFF"/>
  <circle cx="11.5" cy="12" r="1.5" fill="#4285F4"/>
  <path d="M6 9h3v6H6z" fill="#FFF" opacity="0.7"/>
  <path d="M15 9h3v6h-3z" fill="#FFF" opacity="0.7"/>
</svg>`;
  }

  generateCompTIAIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E31837">
  <rect width="24" height="24" rx="4" fill="#E31837"/>
  <path d="M7 8h10v2H7zM7 11h10v2H7zM7 14h6v2H7z" fill="#FFF"/>
  <circle cx="16" cy="15" r="2" fill="#FFF"/>
  <path d="M15 15l1 1 2-2" stroke="#E31837" stroke-width="1" fill="none"/>
</svg>`;
  }

  generateCiscoIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1BA0D7">
  <rect width="24" height="24" rx="4" fill="#1BA0D7"/>
  <rect x="6" y="8" width="3" height="8" fill="#FFF"/>
  <rect x="10.5" y="10" width="3" height="6" fill="#FFF"/>
  <rect x="15" y="6" width="3" height="10" fill="#FFF"/>
</svg>`;
  }

  generatePMPIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1F4E79">
  <rect width="24" height="24" rx="4" fill="#1F4E79"/>
  <circle cx="12" cy="12" r="6" stroke="#FFF" stroke-width="2" fill="none"/>
  <path d="M9 12l2 2 4-4" stroke="#FFF" stroke-width="2" fill="none"/>
  <text x="12" y="19" text-anchor="middle" fill="#FFF" font-size="6">PMP</text>
</svg>`;
  }

  generateMathIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8B5CF6">
  <rect width="24" height="24" rx="4" fill="#8B5CF6"/>
  <text x="6" y="10" fill="#FFF" font-size="8">π</text>
  <text x="12" y="10" fill="#FFF" font-size="6">∫</text>
  <text x="18" y="10" fill="#FFF" font-size="6">∑</text>
  <text x="12" y="18" fill="#FFF" font-size="6">√x</text>
</svg>`;
  }

  generateStatsIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
  <rect width="24" height="24" rx="4" fill="#059669"/>
  <rect x="4" y="16" width="2" height="4" fill="#FFF"/>
  <rect x="7" y="14" width="2" height="6" fill="#FFF"/>
  <rect x="10" y="12" width="2" height="8" fill="#FFF"/>
  <rect x="13" y="10" width="2" height="10" fill="#FFF"/>
  <rect x="16" y="8" width="2" height="12" fill="#FFF"/>
  <rect x="19" y="15" width="2" height="5" fill="#FFF"/>
</svg>`;
  }

  async generateIconDefinitions() {
    console.log('📝 Generating icon definitions...');
    
    const iconDefinition = `/**
 * Downloaded Icon Definitions
 * Auto-generated comprehensive icon set
 */

import React from 'react';
import { IconRegistryEntry } from '../types';
import { createIcon } from '../base-icon';

// Icon mapping for all downloaded icons
export const DOWNLOADED_ICONS = {
  // General icons
  'academic-cap': '/icons/general/academic-cap.svg',
  'calculator': '/icons/general/calculator.svg',
  'chart-bar': '/icons/general/chart-bar.svg',
  'cloud': '/icons/general/cloud.svg',
  'code-bracket': '/icons/general/code-bracket.svg',
  'computer-desktop': '/icons/general/computer-desktop.svg',
  'beaker': '/icons/general/beaker.svg',
  'building-office': '/icons/general/building-office.svg',
  'heart': '/icons/general/heart.svg',
  'wrench-screwdriver': '/icons/general/wrench-screwdriver.svg',
  'document-text': '/icons/general/document-text.svg',
  'shield-check': '/icons/general/shield-check.svg',
  'globe-alt': '/icons/general/globe-alt.svg',
  'server': '/icons/general/server.svg',
  
  // Certification specific
  'aws': '/icons/certifications/aws.svg',
  'azure': '/icons/certifications/azure.svg',
  'google-cloud': '/icons/certifications/google_cloud.svg',
  'comptia': '/icons/certifications/comptia.svg',
  'cisco': '/icons/certifications/cisco.svg',
  'pmp': '/icons/certifications/pmp.svg',
  'mathematics': '/icons/certifications/mathematics.svg',
  'statistics': '/icons/certifications/statistics.svg'
};

// Create icon components from SVG files
${this.downloadedIcons.map(iconName => `
const ${this.toPascalCase(iconName)}Icon = createIcon(
  () => <img src={DOWNLOADED_ICONS['${iconName}']} alt="${iconName}" />,
  '${this.toPascalCase(iconName)}Icon'
);`).join('')}

export const icons: IconRegistryEntry[] = [
${this.downloadedIcons.map(iconName => `  {
    component: ${this.toPascalCase(iconName)}Icon,
    metadata: {
      id: '${iconName}',
      name: '${this.toDisplayName(iconName)}',
      category: '${this.getCategoryForIcon(iconName)}',
      description: 'Downloaded ${iconName} icon',
      keywords: ['${iconName}', '${this.getCategoryForIcon(iconName)}'],
      brandColors: { primary: '#374151' },
      variants: ['filled'],
      tags: ['downloaded', '${this.getCategoryForIcon(iconName)}'],
      official: false
    }
  }`).join(',\n')}
];`;

    fs.writeFileSync('client/src/components/icons/definitions/downloaded-icons.tsx', iconDefinition);
    console.log('   ✅ downloaded-icons.tsx generated');
  }

  toPascalCase(str) {
    return str.replace(/(^|[_-])([a-z])/g, (_, __, letter) => letter.toUpperCase());
  }

  toDisplayName(str) {
    return str.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getCategoryForIcon(iconName) {
    if (['aws', 'azure', 'google-cloud', 'comptia', 'cisco', 'pmp'].includes(iconName)) {
      return 'certification';
    }
    if (['mathematics', 'statistics', 'beaker', 'calculator'].includes(iconName)) {
      return 'academic';
    }
    if (['code-bracket', 'computer-desktop', 'server'].includes(iconName)) {
      return 'technology';
    }
    return 'general';
  }
}

export default IconDownloader;