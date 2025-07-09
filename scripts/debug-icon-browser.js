/**
 * Debug Icon Resolution in Browser Context
 * Simulates exactly what happens in the browser
 */

console.log('🔍 Debugging icon resolution for browser context...\n');

// Simulate the exact pattern matching from icon-registry-service.ts
function testPatternMatching(subjectName) {
  const name = subjectName.toLowerCase();
  
  const patterns = [
    // Test Prep & Examinations (specific icons)
    { keywords: ['hesi'], icon: 'hesi' },
    { keywords: ['teas'], icon: 'teas' },
    { keywords: ['gre'], icon: 'gre' },
    { keywords: ['lsat'], icon: 'lsat' },
    { keywords: ['toefl'], icon: 'toefl' },
    { keywords: ['ged'], icon: 'ged' },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      return { iconId: pattern.icon, source: 'pattern' };
    }
  }
  
  return { iconId: 'academic', source: 'fallback' };
}

// Test the exact subject names from database
const subjects = ['HESI', 'TEAS', 'GRE', 'LSAT', 'TOEFL', 'GED'];

subjects.forEach(subject => {
  const result = testPatternMatching(subject);
  const iconPath = `/icons/${result.iconId}.svg`;
  
  console.log(`Subject: "${subject}"`);
  console.log(`  Pattern result: ${result.iconId} (${result.source})`);
  console.log(`  Icon path: ${iconPath}`);
  console.log(`  Should display: ${result.source === 'pattern' ? 'YES' : 'NO'}\n`);
});

console.log('🎯 All these subjects should now display specific icons instead of fallbacks!');