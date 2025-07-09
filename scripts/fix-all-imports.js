#!/usr/bin/env node

/**
 * Comprehensive Import Path Fixer
 * 
 * This script fixes all remaining import path issues in the codebase
 * by systematically replacing incorrect import patterns with correct relative paths.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTSFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixImportPaths() {
  const files = findTSFiles('client/src');
  let totalFixed = 0;
  
  console.log(`Found ${files.length} TypeScript files to process...`);
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    
    // Fix excessive relative paths to shared directory
    const excessiveSharedPaths = [
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\//g,
      /\.\.\/\.\.\/\.\.\/\.\.\/shared\//g
    ];
    
    // Calculate correct path from this file to shared directory
    const relativePath = path.relative(path.dirname(filePath), 'shared');
    const correctSharedPath = relativePath.replace(/\\/g, '/') + '/';
    
    for (const pattern of excessiveSharedPaths) {
      if (pattern.test(content)) {
        content = content.replace(pattern, correctSharedPath);
        fileChanged = true;
      }
    }
    
    // Fix specific component import patterns
    const componentFixes = [
      // Fix shared hooks imports to use correct relative path
      {
        pattern: /from\s+["']\.\.\/\.\.\/\.\.\/hooks\/use-toast["']/g,
        replacement: `from "../../shared/hooks/use-toast"`
      },
      {
        pattern: /from\s+["']\.\.\/\.\.\/hooks\/use-toast["']/g,
        replacement: `from "../shared/hooks/use-toast"`
      },
      // Fix shared components imports
      {
        pattern: /from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared\/components\//g,
        replacement: `from "../../shared/components/`
      }
    ];
    
    for (const fix of componentFixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        fileChanged = true;
      }
    }
    
    if (fileChanged) {
      fs.writeFileSync(filePath, content);
      totalFixed++;
      console.log(`Fixed imports in: ${filePath}`);
    }
  }
  
  console.log(`\nFixed import paths in ${totalFixed} files.`);
  return totalFixed;
}

function main() {
  console.log('Starting comprehensive import path fix...\n');
  
  try {
    const fixedCount = fixImportPaths();
    
    if (fixedCount > 0) {
      console.log('\n✅ Import path fixes completed successfully!');
      console.log(`Total files modified: ${fixedCount}`);
    } else {
      console.log('\n✅ No import path issues found.');
    }
    
  } catch (error) {
    console.error('❌ Error during import path fixing:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportPaths };