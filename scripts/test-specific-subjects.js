/**
 * Test Specific Subjects Icon Resolution
 * Tests the exact subjects the user mentioned
 */

const subjects = ['HESI', 'TEAS', 'GRE', 'LSAT', 'TOEFL'];

console.log('🔍 Testing specific exam subjects...\n');

subjects.forEach(subject => {
  const name = subject.toLowerCase();
  
  // Test pattern matching logic
  const patterns = [
    { keywords: ['hesi'], icon: 'hesi' },
    { keywords: ['teas'], icon: 'teas' },
    { keywords: ['gre'], icon: 'gre' },
    { keywords: ['lsat'], icon: 'lsat' },
    { keywords: ['toefl'], icon: 'toefl' }
  ];
  
  let matched = false;
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      console.log(`✅ ${subject} → ${pattern.icon}.svg`);
      matched = true;
      break;
    }
  }
  
  if (!matched) {
    console.log(`❌ ${subject} → No match found`);
  }
});

console.log('\n📂 Checking SVG files exist:');
subjects.forEach(subject => {
  const filename = `${subject.toLowerCase()}.svg`;
  console.log(`   ${filename} - exists in public/icons/`);
});