#!/usr/bin/env node
/**
 * Automated Import Path Fixer
 * 
 * This script systematically replaces all @/ alias imports with relative paths
 * to fix Vite build issues for deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const clientSrcDir = path.join(rootDir, 'client/src');

// Find all TypeScript files
function findTSFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(findTSFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Calculate relative path from one file to another
function getRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const absoluteToPath = path.join(clientSrcDir, toPath);
  let relativePath = path.relative(fromDir, absoluteToPath);
  
  // Ensure the path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

// Fix imports in a single file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Define import mapping rules
  const importMappings = [
    { pattern: /@\/components\/ui\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `components/ui/${p1}`) },
    { pattern: /@\/components\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `components/${p1}`) },
    { pattern: /@\/utils\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `utils/${p1}`) },
    { pattern: /@\/hooks\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `hooks/${p1}`) },
    { pattern: /@\/lib\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `lib/${p1}`) },
    { pattern: /@\/features\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `features/${p1}`) },
    { pattern: /@\/services\/([^"']+)/g, replacement: (match, p1) => getRelativePath(filePath, `services/${p1}`) },
    { pattern: /@\/utils/g, replacement: getRelativePath(filePath, 'utils/utils') },
    { pattern: /@\/lib\/utils/g, replacement: getRelativePath(filePath, 'utils/utils') }
  ];

  // Apply each mapping
  for (const mapping of importMappings) {
    const newContent = content.replace(mapping.pattern, mapping.replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔧 Starting automated import path fixing...');

const allTSFiles = findTSFiles(clientSrcDir);
console.log(`📁 Found ${allTSFiles.length} TypeScript files`);

let fixedFiles = 0;

for (const file of allTSFiles) {
  if (fixImportsInFile(file)) {
    fixedFiles++;
    const relativePath = path.relative(rootDir, file);
    console.log(`   ✅ Fixed imports in ${relativePath}`);
  }
}

console.log(`🎉 Fixed imports in ${fixedFiles} files`);

// Test the build
console.log('🚀 Testing build...');
try {
  execSync('npm run build', { stdio: 'pipe', cwd: rootDir });
  console.log('✅ Build test passed! All import paths fixed.');
} catch (error) {
  console.log('⚠️ Build still has issues. Checking output...');
  const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
  
  // Extract specific import errors for further fixing
  const importErrorMatch = output.match(/failed to resolve import "([^"]+)"/);
  if (importErrorMatch) {
    console.log(`❌ Still failing on: ${importErrorMatch[1]}`);
  } else {
    console.log('❌ Build output:', output.substring(0, 500));
  }
}