/**
 * Test Icon Resolution Script
 * Tests icon resolution for all database subjects
 */

import axios from 'axios';

async function testIconResolution() {
  try {
    // Get all subjects from the API
    const response = await axios.get('http://localhost:5000/api/subjects');
    const subjects = response.data;
    
    console.log(`🔍 Testing icon resolution for ${subjects.length} subjects...\n`);
    
    // Test each subject and categorize results
    const results = {
      withIcons: [],
      fallback: [],
      patterns: []
    };
    
    for (const subject of subjects) {
      const name = subject.name.toLowerCase();
      
      // Check for specific patterns
      const patterns = [
        { keywords: ['aws', 'amazon'], icon: 'aws' },
        { keywords: ['azure', 'microsoft'], icon: 'azure' },
        { keywords: ['pmp', 'project management'], icon: 'pmp' },
        { keywords: ['cisco', 'ccna'], icon: 'cisco' },
        { keywords: ['comptia', 'security+'], icon: 'comptia' },
        { keywords: ['mathematics', 'math'], icon: 'mathematics' },
        { keywords: ['statistics'], icon: 'statistics' },
        { keywords: ['python'], icon: 'python' },
        { keywords: ['javascript'], icon: 'javascript' },
        { keywords: ['java'], icon: 'java' },
        { keywords: ['react'], icon: 'react' },
        { keywords: ['docker'], icon: 'docker' },
        { keywords: ['kubernetes'], icon: 'kubernetes' },
        { keywords: ['business'], icon: 'business' },
        { keywords: ['finance'], icon: 'finance' },
        { keywords: ['accounting'], icon: 'accounting' },
        { keywords: ['economics'], icon: 'economics' },
        { keywords: ['marketing'], icon: 'marketing' },
        { keywords: ['psychology'], icon: 'psychology' },
        { keywords: ['sociology'], icon: 'sociology' },
        { keywords: ['history'], icon: 'history' },
        { keywords: ['literature', 'english'], icon: 'literature' },
        { keywords: ['philosophy'], icon: 'philosophy' },
        { keywords: ['physics'], icon: 'physics' },
        { keywords: ['chemistry'], icon: 'chemistry' },
        { keywords: ['biology'], icon: 'biology' },
        { keywords: ['computer science'], icon: 'computer-science' },
        { keywords: ['engineering'], icon: 'engineering' },
        { keywords: ['medical', 'medicine'], icon: 'medical' },
        { keywords: ['law', 'legal'], icon: 'law' },
      ];
      
      let matched = false;
      for (const pattern of patterns) {
        if (pattern.keywords.some(keyword => name.includes(keyword))) {
          results.withIcons.push({
            subject: subject.name,
            icon: pattern.icon,
            source: 'pattern'
          });
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        results.fallback.push({
          subject: subject.name,
          icon: 'academic',
          source: 'fallback'
        });
      }
    }
    
    // Display results
    console.log('📊 ICON RESOLUTION RESULTS');
    console.log('=========================\n');
    
    console.log(`✅ Subjects with specific icons: ${results.withIcons.length}`);
    results.withIcons.forEach(item => {
      console.log(`   ${item.subject} → ${item.icon}`);
    });
    
    console.log(`\n⚠️  Subjects using fallback icons: ${results.fallback.length}`);
    results.fallback.forEach(item => {
      console.log(`   ${item.subject} → ${item.icon} (fallback)`);
    });
    
    console.log(`\n📈 Coverage: ${((results.withIcons.length / subjects.length) * 100).toFixed(1)}%`);
    
    // Suggest improvements for fallback subjects
    if (results.fallback.length > 0) {
      console.log('\n💡 SUGGESTIONS FOR IMPROVING COVERAGE:');
      console.log('=====================================');
      
      const categories = {};
      results.fallback.forEach(item => {
        const words = item.subject.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 3) { // Skip short words
            categories[word] = (categories[word] || 0) + 1;
          }
        });
      });
      
      const sortedCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
        
      console.log('Common words in unmatched subjects:');
      sortedCategories.forEach(([word, count]) => {
        console.log(`   "${word}" appears ${count} times`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to test icon resolution:', error.message);
  }
}

testIconResolution();