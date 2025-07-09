/**
 * Test icon loading in browser context
 */

// This script simulates what the browser should see
const testUrls = [
  'http://localhost:5000/icons/hesi.svg',
  'http://localhost:5000/icons/teas.svg', 
  'http://localhost:5000/icons/gre.svg',
  'http://localhost:5000/icons/lsat.svg',
  'http://localhost:5000/icons/toefl.svg'
];

console.log('🌐 Testing icon URLs from browser perspective...\n');

async function testUrl(url) {
  try {
    const response = await fetch(url);
    console.log(`${url}: ${response.ok ? '✅ OK' : '❌ FAIL'} (${response.status})`);
    if (response.ok) {
      const content = await response.text();
      const isSvg = content.includes('<svg') && content.includes('</svg>');
      console.log(`   Content: ${isSvg ? 'Valid SVG' : 'Invalid content'}`);
    }
  } catch (error) {
    console.log(`${url}: ❌ ERROR - ${error.message}`);
  }
}

// Test all URLs
for (const url of testUrls) {
  await testUrl(url);
  console.log('');
}

console.log('🔍 If all URLs show OK, the issue is in the frontend component logic.');