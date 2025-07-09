#!/usr/bin/env node

// Verification script to check if the build is working correctly
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Verifying build setup...\n');

// Check if dist directory exists
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('❌ dist/ directory not found');
  console.log('💡 Run: node scripts/build.js');
  process.exit(1);
}

// Check if dist/index.js exists
const indexPath = path.join(distDir, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.log('❌ dist/index.js not found');
  console.log('💡 Run: node scripts/build.js');
  process.exit(1);
}

// Check file size
const stats = fs.statSync(indexPath);
const sizeKB = Math.round(stats.size / 1024);
console.log(`✅ dist/index.js exists (${sizeKB}KB)`);

// Check if .env exists
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  .env file not found - you may need to create it');
}

// Check if node_modules exists
const nodeModulesPath = path.join(rootDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules exists');
} else {
  console.log('⚠️  node_modules not found - run: npm install');
}

console.log('\n🎉 Build verification complete!');
console.log('🚀 You can now run: npm start');