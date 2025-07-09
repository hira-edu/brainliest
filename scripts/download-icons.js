/**
 * Professional Icon Download Script
 * Downloads comprehensive SVG icon sets for the Brainliest platform
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive icon set covering all certification and academic subjects
const ICON_SETS = {
  // Certification Provider Icons
  certifications: [
    { id: 'aws', name: 'AWS', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/amazonaws.svg', category: 'cloud' },
    { id: 'azure', name: 'Microsoft Azure', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/microsoftazure.svg', category: 'cloud' },
    { id: 'gcp', name: 'Google Cloud', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/googlecloud.svg', category: 'cloud' },
    { id: 'comptia', name: 'CompTIA', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/comptia.svg', category: 'security' },
    { id: 'cisco', name: 'Cisco', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/cisco.svg', category: 'networking' },
    { id: 'docker', name: 'Docker', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/docker.svg', category: 'devops' },
    { id: 'kubernetes', name: 'Kubernetes', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/kubernetes.svg', category: 'devops' },
    { id: 'terraform', name: 'Terraform', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/terraform.svg', category: 'devops' },
  ],
  
  // Academic Subject Icons (from Heroicons and Tabler)
  academic: [
    { id: 'mathematics', name: 'Mathematics', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/academic-cap.svg', category: 'mathematics' },
    { id: 'science', name: 'Science', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/beaker.svg', category: 'science' },
    { id: 'computer-science', name: 'Computer Science', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/computer-desktop.svg', category: 'technology' },
    { id: 'engineering', name: 'Engineering', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/cog-8-tooth.svg', category: 'engineering' },
    { id: 'business', name: 'Business', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/briefcase.svg', category: 'business' },
    { id: 'medical', name: 'Medical', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/heart.svg', category: 'medical' },
    { id: 'law', name: 'Law', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/scale.svg', category: 'legal' },
    { id: 'statistics', name: 'Statistics', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/chart-bar.svg', category: 'mathematics' },
  ],
  
  // Technology & Programming Icons
  technology: [
    { id: 'javascript', name: 'JavaScript', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/javascript.svg', category: 'programming' },
    { id: 'python', name: 'Python', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/python.svg', category: 'programming' },
    { id: 'java', name: 'Java', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/oracle.svg', category: 'programming' },
    { id: 'react', name: 'React', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/react.svg', category: 'frontend' },
    { id: 'nodejs', name: 'Node.js', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/nodedotjs.svg', category: 'backend' },
    { id: 'database', name: 'Database', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/circle-stack.svg', category: 'database' },
  ],
  
  // General Purpose Icons
  general: [
    { id: 'academic', name: 'Academic', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/academic-cap.svg', category: 'general' },
    { id: 'certification', name: 'Certification', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/trophy.svg', category: 'general' },
    { id: 'test', name: 'Test', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/document-text.svg', category: 'general' },
    { id: 'study', name: 'Study', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/book-open.svg', category: 'general' },
    { id: 'practice', name: 'Practice', url: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/arrow-path.svg', category: 'general' },
  ]
};

class IconDownloader {
  constructor(outputDir = './public/icons') {
    this.outputDir = outputDir;
    this.downloadedIcons = [];
    this.failedDownloads = [];
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    } catch (error) {
      console.error('❌ Failed to create output directory:', error);
      throw error;
    }
  }

  async downloadIcon(icon) {
    try {
      console.log(`⬇️  Downloading ${icon.name} (${icon.id})...`);
      
      const response = await axios.get(icon.url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Brainliest-Icon-Downloader/1.0'
        }
      });
      
      const filename = `${icon.id}.svg`;
      const filepath = path.join(this.outputDir, filename);
      
      // Clean and optimize SVG content
      let svgContent = response.data.toString();
      svgContent = this.cleanSvgContent(svgContent, icon);
      
      await fs.writeFile(filepath, svgContent, 'utf8');
      
      const iconData = {
        ...icon,
        filename,
        filepath,
        size: Buffer.byteLength(svgContent, 'utf8'),
        downloaded: new Date().toISOString()
      };
      
      this.downloadedIcons.push(iconData);
      console.log(`✅ Downloaded ${icon.name} -> ${filename} (${iconData.size} bytes)`);
      
      return iconData;
    } catch (error) {
      console.error(`❌ Failed to download ${icon.name}:`, error.message);
      this.failedDownloads.push({ ...icon, error: error.message });
      return null;
    }
  }

  cleanSvgContent(svgContent, icon) {
    // Remove XML declarations and unnecessary attributes
    svgContent = svgContent.replace(/<\?xml[^>]*\?>/gi, '');
    svgContent = svgContent.replace(/xmlns:xlink="[^"]*"/gi, '');
    
    // Add consistent viewBox if missing
    if (!svgContent.includes('viewBox')) {
      svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 24 24"');
    }
    
    // Add title and description for accessibility
    const titleTag = `<title>${icon.name} Icon</title>`;
    const descTag = `<desc>Icon for ${icon.category} category</desc>`;
    
    if (!svgContent.includes('<title>')) {
      svgContent = svgContent.replace('<svg', `<svg`).replace('>', `>${titleTag}${descTag}`);
    }
    
    return svgContent.trim();
  }

  async downloadAllIcons() {
    console.log('🚀 Starting comprehensive icon download...');
    
    await this.ensureOutputDirectory();
    
    const allIcons = Object.values(ICON_SETS).flat();
    console.log(`📊 Total icons to download: ${allIcons.length}`);
    
    // Download icons in batches to avoid overwhelming servers
    const batchSize = 5;
    for (let i = 0; i < allIcons.length; i += batchSize) {
      const batch = allIcons.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allIcons.length / batchSize)}`);
      
      const batchPromises = batch.map(icon => this.downloadIcon(icon));
      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < allIcons.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Icon download completed!');
    this.generateReport();
    await this.generateIconRegistry();
  }

  generateReport() {
    console.log('\n📊 DOWNLOAD REPORT');
    console.log('==================');
    console.log(`✅ Successfully downloaded: ${this.downloadedIcons.length} icons`);
    console.log(`❌ Failed downloads: ${this.failedDownloads.length} icons`);
    
    if (this.downloadedIcons.length > 0) {
      const totalSize = this.downloadedIcons.reduce((sum, icon) => sum + icon.size, 0);
      console.log(`📁 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      
      const categories = [...new Set(this.downloadedIcons.map(icon => icon.category))];
      console.log(`📂 Categories: ${categories.join(', ')}`);
    }
    
    if (this.failedDownloads.length > 0) {
      console.log('\n❌ Failed downloads:');
      this.failedDownloads.forEach(icon => {
        console.log(`  - ${icon.name} (${icon.id}): ${icon.error}`);
      });
    }
  }

  async generateIconRegistry() {
    console.log('\n📝 Generating icon registry...');
    
    const registryCode = `/**
 * Auto-generated Icon Registry
 * Generated on ${new Date().toISOString()}
 */

export interface IconMetadata {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  tags: string[];
  filename: string;
  size: number;
  downloaded: string;
}

export const DOWNLOADED_ICONS: IconMetadata[] = ${JSON.stringify(this.downloadedIcons, null, 2)};

export const ICON_CATEGORIES = [
  ${[...new Set(this.downloadedIcons.map(icon => `'${icon.category}'`))].join(',\n  ')}
];

export function getIconByCategory(category: string): IconMetadata[] {
  return DOWNLOADED_ICONS.filter(icon => icon.category === category);
}

export function searchIcons(query: string): IconMetadata[] {
  const searchTerm = query.toLowerCase();
  return DOWNLOADED_ICONS.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm) ||
    icon.id.toLowerCase().includes(searchTerm) ||
    icon.category.toLowerCase().includes(searchTerm)
  );
}

export function getIconPath(iconId: string): string {
  const icon = DOWNLOADED_ICONS.find(icon => icon.id === iconId);
  return icon ? \`/icons/\${icon.filename}\` : '/icons/academic.svg';
}
`;

    const registryPath = path.join(__dirname, '..', 'client', 'src', 'services', 'downloaded-icon-registry.ts');
    await fs.writeFile(registryPath, registryCode, 'utf8');
    console.log(`✅ Generated icon registry: ${registryPath}`);
  }
}

// Run the downloader
async function main() {
  const downloader = new IconDownloader();
  await downloader.downloadAllIcons();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IconDownloader, ICON_SETS };