/**
 * Create Missing Icons Script
 * Creates additional SVG icons for subjects that don't have specific matches
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Additional icon definitions for subjects without specific icons
const additionalIcons = {
  'finance': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Finance Icon</title>
    <rect x="3" y="5" width="18" height="14" rx="2" fill="#059669" stroke="#047857" stroke-width="0.5"/>
    <path d="M3 9 L21 9" stroke="white" stroke-width="0.5"/>
    <text x="12" y="13" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="3" font-weight="bold" fill="white">$</text>
    <circle cx="8" cy="15" r="1" fill="white" opacity="0.7"/>
    <circle cx="16" cy="15" r="1" fill="white" opacity="0.7"/>
  </svg>`,
  
  'accounting': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Accounting Icon</title>
    <rect x="4" y="3" width="16" height="18" rx="1" fill="#dc2626" stroke="#b91c1c" stroke-width="0.5"/>
    <line x1="4" y1="7" x2="20" y2="7" stroke="white" stroke-width="0.5"/>
    <line x1="8" y1="10" x2="16" y2="10" stroke="white" stroke-width="0.5"/>
    <line x1="8" y1="13" x2="16" y2="13" stroke="white" stroke-width="0.5"/>
    <line x1="8" y1="16" x2="16" y2="16" stroke="white" stroke-width="0.5"/>
    <text x="12" y="5.5" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2" font-weight="bold" fill="white">$$$</text>
  </svg>`,
  
  'economics': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Economics Icon</title>
    <circle cx="12" cy="12" r="9" fill="#2563eb" stroke="#1e40af" stroke-width="0.5"/>
    <path d="M6 12 Q12 6 18 12 Q12 18 6 12" fill="none" stroke="white" stroke-width="2"/>
    <circle cx="9" cy="10" r="1" fill="white"/>
    <circle cx="15" cy="14" r="1" fill="white"/>
    <text x="12" y="8" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2" font-weight="bold" fill="white">ECO</text>
  </svg>`,
  
  'marketing': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Marketing Icon</title>
    <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="#7c3aed" stroke="#6d28d9" stroke-width="0.5"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
    <path d="M12 9 L15 12 L12 15 L9 12 Z" fill="#7c3aed"/>
    <text x="12" y="18" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="1.5" font-weight="bold" fill="white">MKT</text>
  </svg>`,
  
  'psychology': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Psychology Icon</title>
    <circle cx="12" cy="10" r="6" fill="#ec4899" stroke="#db2777" stroke-width="0.5"/>
    <circle cx="10" cy="9" r="1" fill="white"/>
    <circle cx="14" cy="9" r="1" fill="white"/>
    <path d="M9 12 Q12 14 15 12" stroke="white" stroke-width="1" fill="none"/>
    <path d="M12 16 Q10 18 8 20 M12 16 Q14 18 16 20" stroke="#ec4899" stroke-width="1.5" fill="none"/>
  </svg>`,
  
  'sociology': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Sociology Icon</title>
    <circle cx="8" cy="8" r="3" fill="#06b6d4" stroke="#0891b2" stroke-width="0.5"/>
    <circle cx="16" cy="8" r="3" fill="#06b6d4" stroke="#0891b2" stroke-width="0.5"/>
    <circle cx="12" cy="16" r="3" fill="#06b6d4" stroke="#0891b2" stroke-width="0.5"/>
    <line x1="10" y1="10" x2="14" y2="10" stroke="#06b6d4" stroke-width="1"/>
    <line x1="10" y1="14" x2="8" y2="11" stroke="#06b6d4" stroke-width="1"/>
    <line x1="14" y1="14" x2="16" y2="11" stroke="#06b6d4" stroke-width="1"/>
  </svg>`,
  
  'history': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>History Icon</title>
    <rect x="5" y="3" width="14" height="18" rx="1" fill="#92400e" stroke="#78350f" stroke-width="0.5"/>
    <line x1="5" y1="7" x2="19" y2="7" stroke="white" stroke-width="0.5"/>
    <line x1="8" y1="10" x2="16" y2="10" stroke="white" stroke-width="0.3"/>
    <line x1="8" y1="13" x2="16" y2="13" stroke="white" stroke-width="0.3"/>
    <line x1="8" y1="16" x2="16" y2="16" stroke="white" stroke-width="0.3"/>
    <text x="12" y="5.5" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2" font-weight="bold" fill="white">HIST</text>
  </svg>`,
  
  'literature': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Literature Icon</title>
    <rect x="4" y="2" width="16" height="20" rx="1" fill="#7c2d12" stroke="#78350f" stroke-width="0.5"/>
    <path d="M4 6 L20 6" stroke="white" stroke-width="0.5"/>
    <path d="M7 9 Q12 7 17 9" stroke="white" stroke-width="0.8" fill="none"/>
    <path d="M7 13 Q12 11 17 13" stroke="white" stroke-width="0.8" fill="none"/>
    <path d="M7 17 Q12 15 17 17" stroke="white" stroke-width="0.8" fill="none"/>
    <circle cx="12" cy="4" r="1" fill="white"/>
  </svg>`,
  
  'philosophy': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Philosophy Icon</title>
    <circle cx="12" cy="12" r="9" fill="#374151" stroke="#1f2937" stroke-width="0.5"/>
    <path d="M8 10 Q12 8 16 10 Q16 14 12 16 Q8 14 8 10" fill="white" opacity="0.9"/>
    <circle cx="12" cy="12" r="2" fill="#374151"/>
    <text x="12" y="19" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="1.5" font-weight="bold" fill="white">φ</text>
  </svg>`,
  
  'physics': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Physics Icon</title>
    <circle cx="12" cy="12" r="9" fill="#1e40af" stroke="#1e3a8a" stroke-width="0.5"/>
    <circle cx="12" cy="12" r="2" fill="white"/>
    <path d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12" stroke="white" stroke-width="1.5"/>
    <path d="M7 7 L9 9 M15 15 L17 17 M17 7 L15 9 M9 15 L7 17" stroke="white" stroke-width="1"/>
  </svg>`,
  
  'chemistry': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Chemistry Icon</title>
    <path d="M8 2 L10 8 L6 20 L18 20 L14 8 L16 2 Z" fill="#059669" stroke="#047857" stroke-width="0.5"/>
    <circle cx="9" cy="16" r="1" fill="white" opacity="0.8"/>
    <circle cx="15" cy="16" r="1" fill="white" opacity="0.8"/>
    <circle cx="12" cy="14" r="1.5" fill="white" opacity="0.6"/>
    <path d="M8 12 Q12 10 16 12" stroke="white" stroke-width="0.5" fill="none"/>
  </svg>`,
  
  'biology': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Biology Icon</title>
    <circle cx="12" cy="12" r="9" fill="#16a34a" stroke="#15803d" stroke-width="0.5"/>
    <path d="M12 6 Q10 8 8 12 Q10 16 12 18 Q14 16 16 12 Q14 8 12 6" fill="white" opacity="0.9"/>
    <circle cx="12" cy="9" r="1" fill="#16a34a"/>
    <circle cx="12" cy="15" r="1" fill="#16a34a"/>
    <path d="M9 12 L15 12" stroke="#16a34a" stroke-width="1"/>
  </svg>`,
};

async function createMissingIcons() {
  try {
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    
    console.log('🚀 Creating additional subject icons...');
    
    for (const [iconId, svgContent] of Object.entries(additionalIcons)) {
      const iconPath = path.join(iconsDir, `${iconId}.svg`);
      await fs.writeFile(iconPath, svgContent, 'utf8');
      console.log(`✅ Created ${iconId}.svg`);
    }
    
    console.log(`🎉 Successfully created ${Object.keys(additionalIcons).length} additional icons!`);
    
  } catch (error) {
    console.error('❌ Failed to create icons:', error);
  }
}

createMissingIcons();