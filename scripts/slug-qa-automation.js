#!/usr/bin/env node

/**
 * Automated QA Testing Script for Slug-Based Routing
 * Tests all critical navigation paths and validates slug functionality
 */

import http from 'http';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Test configuration
const tests = [
  // API Endpoint Tests
  {
    name: 'GET /api/subjects - Returns subjects with slugs',
    url: '/api/subjects',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Response is not an array';
      if (data.length === 0) return 'No subjects found';
      const missingSlug = data.find(s => !s.slug);
      if (missingSlug) return `Subject "${missingSlug.name}" missing slug`;
      return null;
    }
  },
  {
    name: 'GET /api/subjects/slug/:slug - Subject lookup by slug',
    url: '/api/subjects/slug/pmp-certification',
    validate: (data) => {
      if (!data.id) return 'Subject not found';
      if (!data.slug) return 'Subject missing slug field';
      if (data.slug !== 'pmp-certification') return 'Incorrect slug returned';
      return null;
    }
  },
  {
    name: 'GET /api/exams - Returns exams with slugs',
    url: '/api/exams',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Response is not an array';
      if (data.length === 0) return 'No exams found';
      const missingSlug = data.find(e => !e.slug);
      if (missingSlug) return `Exam "${missingSlug.title}" missing slug`;
      return null;
    }
  },
  {
    name: 'GET /api/stats - Returns platform statistics',
    url: '/api/stats',
    validate: (data) => {
      if (!data.subjects || !data.exams) return 'Missing statistics fields';
      return null;
    }
  }
];

// HTTP request helper
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(BASE_URL + url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, error: e.message });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

// Slug validation helpers
function validateSlugFormat(slug) {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}

function checkDuplicateSlugs(items) {
  const slugs = items.map(item => item.slug).filter(Boolean);
  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  return duplicates;
}

// Run individual test
async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    const response = await makeRequest(test.url);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data}`);
    }
    
    if (test.validate) {
      const error = test.validate(response.data);
      if (error) {
        throw new Error(error);
      }
    }
    
    results.passed.push(test.name);
    console.log(`✅ PASSED: ${test.name}`);
    return true;
  } catch (error) {
    results.failed.push({ test: test.name, error: error.message });
    console.log(`❌ FAILED: ${test.name} - ${error.message}`);
    return false;
  }
}

// Comprehensive slug validation
async function validateSlugs() {
  console.log('\n🔍 Running comprehensive slug validation...');
  
  try {
    // Get all subjects
    const subjectsResponse = await makeRequest('/api/subjects');
    if (subjectsResponse.status === 200) {
      const subjects = subjectsResponse.data;
      
      // Check for missing slugs
      const missingSlugSubjects = subjects.filter(s => !s.slug);
      if (missingSlugSubjects.length > 0) {
        results.warnings.push(`${missingSlugSubjects.length} subjects missing slugs`);
      }
      
      // Check slug format
      const invalidSlugs = subjects.filter(s => s.slug && !validateSlugFormat(s.slug));
      if (invalidSlugs.length > 0) {
        results.failed.push({
          test: 'Slug format validation',
          error: `Invalid slug formats: ${invalidSlugs.map(s => s.slug).join(', ')}`
        });
      }
      
      // Check for duplicates
      const duplicateSlugs = checkDuplicateSlugs(subjects);
      if (duplicateSlugs.length > 0) {
        results.failed.push({
          test: 'Slug uniqueness',
          error: `Duplicate slugs found: ${duplicateSlugs.join(', ')}`
        });
      }
      
      console.log(`✅ Validated ${subjects.length} subject slugs`);
    }
    
    // Get all exams
    const examsResponse = await makeRequest('/api/exams');
    if (examsResponse.status === 200) {
      const exams = examsResponse.data;
      
      // Similar validation for exams
      const missingSlugExams = exams.filter(e => !e.slug);
      if (missingSlugExams.length > 0) {
        results.warnings.push(`${missingSlugExams.length} exams missing slugs`);
      }
      
      const invalidSlugExams = exams.filter(e => e.slug && !validateSlugFormat(e.slug));
      if (invalidSlugExams.length > 0) {
        results.failed.push({
          test: 'Exam slug format validation',
          error: `Invalid exam slug formats: ${invalidSlugExams.map(e => e.slug).join(', ')}`
        });
      }
      
      const duplicateExamSlugs = checkDuplicateSlugs(exams);
      if (duplicateExamSlugs.length > 0) {
        results.failed.push({
          test: 'Exam slug uniqueness',
          error: `Duplicate exam slugs found: ${duplicateExamSlugs.join(', ')}`
        });
      }
      
      console.log(`✅ Validated ${exams.length} exam slugs`);
    }
    
  } catch (error) {
    results.failed.push({ test: 'Slug validation', error: error.message });
  }
}

// Test specific slug endpoints
async function testSlugEndpoints() {
  console.log('\n🌐 Testing slug-specific endpoints...');
  
  try {
    // Get first few subjects to test their slug endpoints
    const subjectsResponse = await makeRequest('/api/subjects');
    if (subjectsResponse.status === 200) {
      const subjects = subjectsResponse.data.slice(0, 3); // Test first 3
      
      for (const subject of subjects) {
        if (subject.slug) {
          const slugResponse = await makeRequest(`/api/subjects/slug/${subject.slug}`);
          if (slugResponse.status === 200) {
            if (slugResponse.data.id === subject.id) {
              console.log(`✅ Slug endpoint working: /api/subjects/slug/${subject.slug}`);
            } else {
              results.failed.push({
                test: `Slug endpoint consistency for ${subject.slug}`,
                error: 'Returned different subject than expected'
              });
            }
          } else {
            results.failed.push({
              test: `Slug endpoint for ${subject.slug}`,
              error: `HTTP ${slugResponse.status}`
            });
          }
        }
      }
    }
  } catch (error) {
    results.failed.push({ test: 'Slug endpoint testing', error: error.message });
  }
}

// Generate report
function generateReport() {
  const totalTests = results.passed.length + results.failed.length;
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);
  
  const report = `
# Slug-Based Routing QA Test Report

**Test Date:** ${new Date().toISOString()}
**Total Tests:** ${totalTests}
**Passed:** ${results.passed.length}
**Failed:** ${results.failed.length}
**Warnings:** ${results.warnings.length}
**Pass Rate:** ${passRate}%

## ✅ Passed Tests
${results.passed.map(test => `- ${test}`).join('\n')}

## ❌ Failed Tests
${results.failed.map(fail => `- **${fail.test}**: ${fail.error}`).join('\n')}

## ⚠️ Warnings
${results.warnings.map(warning => `- ${warning}`).join('\n')}

## Summary
${results.failed.length === 0 ? 
  '🎉 All tests passed! The slug-based routing system is working correctly.' :
  `🚨 ${results.failed.length} tests failed. Please review and fix the issues before proceeding.`
}

## Next Steps
${results.failed.length === 0 ? 
  '- Proceed with legacy route cleanup\n- Update sitemap generation\n- Monitor performance in production' :
  '- Fix failing tests\n- Re-run validation\n- Address any warnings'
}
`;

  fs.writeFileSync('SLUG_QA_REPORT.md', report);
  console.log('\n📄 Report saved to SLUG_QA_REPORT.md');
  
  return results.failed.length === 0;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Slug-Based Routing QA Tests...');
  console.log('=' .repeat(50));
  
  // Run API tests
  for (const test of tests) {
    await runTest(test);
  }
  
  // Run comprehensive validation
  await validateSlugs();
  
  // Test slug endpoints
  await testSlugEndpoints();
  
  // Generate report
  const allPassed = generateReport();
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Ready for production cutover.');
    process.exit(0);
  } else {
    console.log('\n🚨 Some tests failed. Please review the report.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

export { runAllTests, makeRequest, validateSlugFormat };