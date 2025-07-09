/**
 * Create Test Prep Icons
 * Creates specialized icons for standardized tests and examinations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testPrepIcons = {
  'hesi': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>HESI Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#dc2626" stroke="#b91c1c" stroke-width="0.5"/>
    <text x="12" y="9" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="3" font-weight="bold" fill="white">HESI</text>
    <path d="M6 13 L18 13" stroke="white" stroke-width="0.5"/>
    <circle cx="8" cy="16" r="1" fill="white"/>
    <circle cx="12" cy="16" r="1" fill="white"/>
    <circle cx="16" cy="16" r="1" fill="white"/>
  </svg>`,
  
  'teas': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>TEAS Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#059669" stroke="#047857" stroke-width="0.5"/>
    <text x="12" y="9" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="3" font-weight="bold" fill="white">TEAS</text>
    <path d="M6 13 Q12 11 18 13" stroke="white" stroke-width="1" fill="none"/>
    <circle cx="9" cy="17" r="0.5" fill="white"/>
    <circle cx="15" cy="17" r="0.5" fill="white"/>
  </svg>`,
  
  'gre': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>GRE Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#2563eb" stroke="#1e40af" stroke-width="0.5"/>
    <text x="12" y="10" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="4" font-weight="bold" fill="white">GRE</text>
    <path d="M6 14 L10 16 L14 14 L18 16" stroke="white" stroke-width="1" fill="none"/>
  </svg>`,
  
  'lsat': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>LSAT Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#7c2d12" stroke="#78350f" stroke-width="0.5"/>
    <text x="12" y="9" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2.5" font-weight="bold" fill="white">LSAT</text>
    <path d="M8 13 L12 15 L16 13" stroke="white" stroke-width="1.5" fill="none"/>
    <circle cx="12" cy="17" r="1" fill="white"/>
  </svg>`,
  
  'toefl': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>TOEFL Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#7c3aed" stroke="#6d28d9" stroke-width="0.5"/>
    <text x="12" y="8" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="2" font-weight="bold" fill="white">TOEFL</text>
    <path d="M6 12 Q12 10 18 12 Q12 14 6 12" fill="none" stroke="white" stroke-width="1"/>
    <circle cx="9" cy="16" r="0.5" fill="white"/>
    <circle cx="15" cy="16" r="0.5" fill="white"/>
  </svg>`,
  
  'ged': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>GED Exam Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#ea580c" stroke="#c2410c" stroke-width="0.5"/>
    <text x="12" y="10" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="4" font-weight="bold" fill="white">GED</text>
    <path d="M7 14 L17 14" stroke="white" stroke-width="1"/>
    <path d="M7 17 L17 17" stroke="white" stroke-width="1"/>
  </svg>`,
  
  'astronomy': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Astronomy Icon</title>
    <circle cx="12" cy="12" r="9" fill="#1e1b4b" stroke="#312e81" stroke-width="0.5"/>
    <circle cx="8" cy="8" r="1" fill="white"/>
    <circle cx="16" cy="6" r="0.5" fill="white"/>
    <circle cx="18" cy="14" r="0.5" fill="white"/>
    <circle cx="6" cy="16" r="0.5" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="#fbbf24" stroke="#f59e0b" stroke-width="0.5"/>
    <path d="M12 8 L12 6 M12 18 L12 16 M8 12 L6 12 M18 12 L16 12" stroke="#fbbf24" stroke-width="0.5"/>
  </svg>`,
  
  'earth-science': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Earth Science Icon</title>
    <circle cx="12" cy="12" r="9" fill="#059669" stroke="#047857" stroke-width="0.5"/>
    <path d="M6 8 Q12 6 18 8 Q16 12 12 14 Q8 12 6 8" fill="#3b82f6" opacity="0.7"/>
    <path d="M8 16 Q12 14 16 16 Q14 18 12 18 Q10 18 8 16" fill="#3b82f6" opacity="0.7"/>
    <circle cx="9" cy="10" r="1" fill="#92400e"/>
    <circle cx="15" cy="11" r="1" fill="#92400e"/>
  </svg>`,
  
  'political-science': `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Political Science Icon</title>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#7c2d12" stroke="#78350f" stroke-width="0.5"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
    <path d="M12 8 L12 16 M8 12 L16 12" stroke="#7c2d12" stroke-width="1"/>
    <circle cx="12" cy="12" r="1" fill="#7c2d12"/>
    <text x="12" y="6" text-anchor="middle" font-family="Arial, sans-serif" 
          font-size="1.5" font-weight="bold" fill="white">POL</text>
  </svg>`,
};

async function createTestPrepIcons() {
  try {
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    
    console.log('🚀 Creating test prep and specialized icons...');
    
    for (const [iconId, svgContent] of Object.entries(testPrepIcons)) {
      const iconPath = path.join(iconsDir, `${iconId}.svg`);
      await fs.writeFile(iconPath, svgContent, 'utf8');
      console.log(`✅ Created ${iconId}.svg`);
    }
    
    console.log(`🎉 Successfully created ${Object.keys(testPrepIcons).length} test prep icons!`);
    
  } catch (error) {
    console.error('❌ Failed to create icons:', error);
  }
}

createTestPrepIcons();