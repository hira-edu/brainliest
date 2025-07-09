#!/usr/bin/env node

// Production build script for full-stack application
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for cross-platform compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Starting production build...\n');

// Ensure we're in the right directory
process.chdir(rootDir);
console.log('📁 Working directory:', process.cwd());

// Create dist directory
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

try {
  // Step 1: Build backend
  console.log('🔧 Building backend (Node.js server)...');
  const buildCmd = `npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`;
  console.log('Command:', buildCmd);
  execSync(buildCmd, { 
    stdio: 'inherit',
    cwd: rootDir
  });
  console.log('✅ Backend build completed\n');

  // Step 2: Create static files (simplified approach)
  console.log('📄 Creating static frontend files...');
  
  const distPublicDir = path.join(distDir, 'public');
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  
  // Copy index.html
  const indexPath = path.join(rootDir, 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(distPublicDir, 'index.html'));
    console.log('✅ Copied index.html');
  } else {
    console.log('⚠️  index.html not found, skipping');
  }
  
  // Copy public directory if it exists
  const clientPublicDir = path.join(rootDir, 'client', 'public');
  if (fs.existsSync(clientPublicDir)) {
    try {
      // Cross-platform copy command
      const copyCmd = process.platform === 'win32' 
        ? `xcopy "${clientPublicDir}" "${distPublicDir}" /E /I /H /Y`
        : `cp -r "${clientPublicDir}"/* "${distPublicDir}"/ 2>/dev/null || true`;
      execSync(copyCmd, { stdio: 'inherit' });
      console.log('✅ Copied public assets');
    } catch (err) {
      console.log('⚠️  Public assets copy failed, continuing...');
    }
  }

  // Verify build output
  const builtIndexPath = path.join(distDir, 'index.js');
  if (fs.existsSync(builtIndexPath)) {
    const stats = fs.statSync(builtIndexPath);
    console.log(`✅ Built index.js (${Math.round(stats.size / 1024)}KB)`);
  } else {
    throw new Error('Backend build failed - dist/index.js not found');
  }

  console.log('\n🎉 Build completed successfully!');
  console.log('📁 Output directory:', distDir);
  console.log('📄 Files created:');
  console.log('   - dist/index.js (backend server)');
  console.log('   - dist/public/* (static assets)');
  console.log('🎯 Run with: npm start');
  console.log('');
  console.log('💡 To build locally, run: node scripts/build.js');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}