/**
 * Test direct icon access and browser rendering
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing direct icon access...\n');

// Check if icons exist in public directory
const iconDir = path.join(process.cwd(), 'public', 'icons');
const testIcons = ['hesi', 'teas', 'gre', 'lsat', 'toefl'];

console.log('📁 Checking icon files in:', iconDir);

testIcons.forEach(iconName => {
  const filePath = path.join(iconDir, `${iconName}.svg`);
  const exists = fs.existsSync(filePath);
  console.log(`   ${iconName}.svg: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`      Size: ${stats.size} bytes`);
    
    // Read first line to check if it's valid SVG
    const content = fs.readFileSync(filePath, 'utf8');
    const isValidSvg = content.includes('<svg') && content.includes('</svg>');
    console.log(`      Valid SVG: ${isValidSvg ? '✅' : '❌'}`);
  }
});

console.log('\n🌐 Expected URLs:');
testIcons.forEach(iconName => {
  console.log(`   http://localhost:5000/icons/${iconName}.svg`);
});

console.log('\n📝 Browser test instructions:');
console.log('1. Open browser console (F12)');
console.log('2. Navigate to any subject page');
console.log('3. Look for "🎨 Icon resolved" messages');
console.log('4. Check for "✅ Icon file exists" or "❌ Icon file missing" messages');