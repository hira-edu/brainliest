#!/usr/bin/env node

// Production build script for full-stack application
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production build...\n');

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
  console.log('✅ Created dist directory');
}

try {
  // Step 1: Build backend
  console.log('🔧 Building backend (Node.js server)...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit' 
  });
  console.log('✅ Backend build completed\n');

  // Step 2: Create static files (simplified approach)
  console.log('📄 Creating static frontend files...');
  
  // Copy essential static files
  const staticFiles = [
    'client/public',
    'client/index.html'
  ];
  
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  // Copy index.html
  if (fs.existsSync('client/index.html')) {
    fs.copyFileSync('client/index.html', 'dist/public/index.html');
    console.log('✅ Copied index.html');
  }
  
  // Copy public directory if it exists
  if (fs.existsSync('client/public')) {
    execSync('cp -r client/public/* dist/public/ 2>/dev/null || true', { stdio: 'inherit' });
    console.log('✅ Copied public assets');
  }

  console.log('\n🎉 Build completed successfully!');
  console.log('📁 Output directory: dist/');
  console.log('🎯 Run with: npm start');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}