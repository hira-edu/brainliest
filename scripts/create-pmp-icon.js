/**
 * Create PMP Certification Icon
 * Creates a professional PMP certification icon
 */

import { promises as fs } from 'fs';
import path from 'path';

const pmpIconSVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <title>PMP Certification Icon</title>
  <desc>Icon for PMP Project Management Professional certification</desc>
  <!-- Shield background -->
  <path d="M12 2 L20 6 L20 12 C20 16 16 20 12 22 C8 20 4 16 4 12 L4 6 Z" 
        fill="#2563eb" stroke="#1e40af" stroke-width="0.5"/>
  
  <!-- PMP text -->
  <text x="12" y="9" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="3" font-weight="bold" fill="white">PMP</text>
  
  <!-- Project management symbols -->
  <circle cx="8" cy="14" r="1" fill="white" opacity="0.8"/>
  <circle cx="12" cy="14" r="1" fill="white" opacity="0.8"/>
  <circle cx="16" cy="14" r="1" fill="white" opacity="0.8"/>
  
  <!-- Connecting lines -->
  <line x1="8" y1="14" x2="12" y2="14" stroke="white" stroke-width="0.5" opacity="0.6"/>
  <line x1="12" y1="14" x2="16" y2="14" stroke="white" stroke-width="0.5" opacity="0.6"/>
  
  <!-- Excellence ribbon -->
  <path d="M6 16 L10 18 L10 20 L6 18 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3"/>
  <path d="M14 18 L18 16 L18 18 L14 20 Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.3"/>
</svg>`;

async function createPMPIcon() {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'icons', 'pmp.svg');
    await fs.writeFile(iconPath, pmpIconSVG, 'utf8');
    console.log('✅ Created PMP certification icon');
    
    // Also create a few other missing certification icons
    const certificationIcons = {
      'cissp': createCISSPIcon(),
      'cisa': createCISAIcon(),
      'project-management': createProjectManagementIcon()
    };
    
    for (const [id, svg] of Object.entries(certificationIcons)) {
      const iconPath = path.join(process.cwd(), 'public', 'icons', `${id}.svg`);
      await fs.writeFile(iconPath, svg, 'utf8');
      console.log(`✅ Created ${id} icon`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create icons:', error);
  }
}

function createCISSPIcon() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>CISSP Certification Icon</title>
    <path d="M12 2 L20 6 L20 12 C20 16 16 20 12 22 C8 20 4 16 4 12 L4 6 Z" 
          fill="#dc2626" stroke="#b91c1c" stroke-width="0.5"/>
    <text x="12" y="10" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2.5" font-weight="bold" fill="white">CISSP</text>
    <path d="M8 14 L10 16 L16 10" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function createCISAIcon() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>CISA Certification Icon</title>
    <path d="M12 2 L20 6 L20 12 C20 16 16 20 12 22 C8 20 4 16 4 12 L4 6 Z" 
          fill="#059669" stroke="#047857" stroke-width="0.5"/>
    <text x="12" y="10" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2.8" font-weight="bold" fill="white">CISA</text>
    <circle cx="12" cy="15" r="2" fill="none" stroke="white" stroke-width="1"/>
    <circle cx="12" cy="15" r="0.5" fill="white"/>
  </svg>`;
}

function createProjectManagementIcon() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Project Management Icon</title>
    <rect x="4" y="6" width="16" height="12" rx="2" fill="#6366f1" stroke="#4f46e5" stroke-width="0.5"/>
    <line x1="4" y1="10" x2="20" y2="10" stroke="white" stroke-width="0.5"/>
    <circle cx="8" cy="13" r="1" fill="white"/>
    <circle cx="12" cy="13" r="1" fill="white"/>
    <circle cx="16" cy="13" r="1" fill="white"/>
    <line x1="8" y1="13" x2="12" y2="13" stroke="white" stroke-width="0.5"/>
    <line x1="12" y1="13" x2="16" y2="13" stroke="white" stroke-width="0.5"/>
  </svg>`;
}

createPMPIcon();