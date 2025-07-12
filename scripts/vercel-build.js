#!/usr/bin/env node
/**
 * Vercel Build Script
 * Optimized for Vercel deployment with minimal build command
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brainliest - Exam Preparation Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-width: 600px; width: 90%; }
        h1 { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: #2563eb; }
        .subtitle { font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; }
        .status { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem; }
        .status-title { font-weight: bold; color: #059669; margin-bottom: 0.5rem; }
        .api-check { margin: 1rem 0; padding: 1rem; background: #fef3c7; border-radius: 0.5rem; border-left: 4px solid #f59e0b; }
        .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; margin: 0.5rem; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .api-status { margin-top: 1rem; padding: 1rem; border-radius: 0.5rem; }
        .success { background: #d1fae5; color: #065f46; }
        .error { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 Brainliest</h1>
        <p class="subtitle">Advanced Exam Preparation Platform</p>
        <div class="status">
            <div class="status-title">✅ Deployment Status</div>
            <p>Successfully deployed to Vercel with Supabase PostgreSQL database</p>
        </div>
        <div class="api-check">
            <strong>🔧 Backend API Status:</strong>
            <div id="api-status" class="api-status">
                <p>Checking backend connectivity...</p>
            </div>
        </div>
        <p style="margin: 1rem 0;">
            <strong>🚀 Features:</strong> AI-powered exam prep, practice tests, analytics, admin panel
        </p>
        <a href="/api/health" class="btn">Check API Health</a>
        <a href="/api/subjects" class="btn">View Subjects</a>
        <a href="/api/stats" class="btn">Platform Stats</a>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('api-status');
                if (data.status === 'healthy' || data.status === 'ok') {
                    statusDiv.className = 'api-status success';
                    statusDiv.innerHTML = \`<strong>✅ Backend Online</strong><br>Database: \${data.database}<br>Timestamp: \${new Date(data.timestamp).toLocaleString()}\`;
                } else {
                    statusDiv.className = 'api-status error';
                    statusDiv.innerHTML = '❌ Backend connectivity issues';
                }
            })
            .catch(error => {
                const statusDiv = document.getElementById('api-status');
                statusDiv.className = 'api-status error';
                statusDiv.innerHTML = '❌ Could not reach backend API';
            });
    </script>
</body>
</html>`;

// Write index.html
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

// Build backend with esbuild
console.log('Building backend with esbuild...');
try {
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.mjs', {
    stdio: 'inherit',
    cwd: rootDir
  });
  console.log('✅ Backend build completed successfully');
} catch (error) {
  console.error('❌ Backend build failed:', error.message);
  process.exit(1);
}

console.log('🚀 Vercel build completed successfully');