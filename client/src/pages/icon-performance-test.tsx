/**
 * Icon Performance Test Page
 * Comprehensive testing and monitoring of the optimized icon system
 */

import { useState, useEffect } from 'react';
import { OptimizedSubjectIcon, IconPreloader, useIconPerformance } from '../components/ui/optimized-subject-icon';
import { optimizedIconService } from '../services/optimized-icon-service';
import { 
  iconPerformanceTester, 
  PerformanceTestResult, 
  ConflictTestResult, 
  ConsistencyTestResult 
} from '../services/icon-performance-tester';

// Test subjects covering different categories
const TEST_SUBJECTS = [
  // Professional Certifications
  { name: 'AWS Certified Solutions Architect', category: 'professional-certifications' },
  { name: 'Microsoft Azure Fundamentals', category: 'professional-certifications' },
  { name: 'CompTIA Security+', category: 'professional-certifications' },
  { name: 'Cisco CCNA', category: 'professional-certifications' },
  { name: 'PMP Certification', category: 'professional-certifications' },
  
  // Standardized Test Prep
  { name: 'HESI', category: 'standardized-test-prep' },
  { name: 'TEAS', category: 'standardized-test-prep' },
  { name: 'GRE', category: 'standardized-test-prep' },
  { name: 'LSAT', category: 'standardized-test-prep' },
  { name: 'TOEFL', category: 'standardized-test-prep' },
  { name: 'GED', category: 'standardized-test-prep' },
  
  // Academic Subjects
  { name: 'Computer Science', category: 'computer-science' },
  { name: 'Mathematics', category: 'mathematics-statistics' },
  { name: 'Statistics', category: 'mathematics-statistics' },
  { name: 'Physics', category: 'natural-sciences' },
  { name: 'Chemistry', category: 'natural-sciences' },
  { name: 'Biology', category: 'natural-sciences' },
  
  // Technology
  { name: 'React Development', category: 'computer-science' },
  { name: 'Database Design', category: 'computer-science' },
  { name: 'Data Structures', category: 'computer-science' },
  { name: 'Web Development', category: 'computer-science' },

  // Test subjects for pattern matching
  { name: 'Test Subject', category: 'test' },
  { name: 'Sample Subject Name', category: 'test' },
  { name: 'Testing Subject Update', category: 'test' },
  { name: 'Test Subject API Import', category: 'test' }
];

function PerformanceMetrics() {
  const metrics = useIconPerformance();
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.totalRequests}
          </div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {metrics.averageLoadTime.toFixed(1)}ms
          </div>
          <div className="text-sm text-gray-600">Avg Load Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {metrics.totalLoadTime.toFixed(1)}ms
          </div>
          <div className="text-sm text-gray-600">Total Load Time</div>
        </div>
      </div>
    </div>
  );
}

function IconGrid({ subjects }: { subjects: typeof TEST_SUBJECTS }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleIconLoad = (success: boolean) => {
    if (success) {
      setLoadedCount(prev => prev + 1);
    } else {
      setFailedCount(prev => prev + 1);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Icon Test Grid</h2>
        <div className="text-sm text-gray-600">
          Loaded: {loadedCount} | Failed: {failedCount} | Total: {subjects.length}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {subjects.map((subject, index) => (
          <div key={index} className="text-center p-3 border rounded-lg hover:bg-gray-50">
            <div className="flex justify-center mb-2">
              <OptimizedSubjectIcon
                subjectName={subject.name}
                size={48}
                className="mx-auto"
                onLoadComplete={handleIconLoad}
              />
            </div>
            <div className="text-xs text-gray-600 break-words">
              {subject.name}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {subject.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadTestControls() {
  const [isLoadTesting, setIsLoadTesting] = useState(false);
  const [loadTestResults, setLoadTestResults] = useState<{
    iterations: number;
    totalTime: number;
    averageTime: number;
  } | null>(null);
  const [performanceResults, setPerformanceResults] = useState<PerformanceTestResult[]>([]);
  const [conflictResults, setConflictResults] = useState<ConflictTestResult[]>([]);
  const [consistencyResults, setConsistencyResults] = useState<ConsistencyTestResult[]>([]);
  const [isRunningQA, setIsRunningQA] = useState(false);

  const runLoadTest = async () => {
    setIsLoadTesting(true);
    setLoadTestResults(null);
    
    const iterations = 10;
    const startTime = performance.now();
    
    try {
      // Clear cache to test cold performance
      optimizedIconService.clearCache();
      
      // Run multiple iterations
      for (let i = 0; i < iterations; i++) {
        const promises = TEST_SUBJECTS.map(subject => 
          optimizedIconService.getIconForSubject(
            subject.name.toLowerCase().replace(/\s+/g, '-')
          )
        );
        await Promise.all(promises);
      }
      
      const totalTime = performance.now() - startTime;
      setLoadTestResults({
        iterations,
        totalTime,
        averageTime: totalTime / iterations
      });
    } catch (error) {
      console.error('Load test failed:', error);
    } finally {
      setIsLoadTesting(false);
    }
  };

  const clearCache = () => {
    optimizedIconService.clearCache();
    window.location.reload();
  };

  const runQATests = async () => {
    setIsRunningQA(true);
    try {
      console.log('🔬 Running comprehensive QA tests...');
      
      const [perfResults, conflictResults, consistencyResults] = await Promise.all([
        iconPerformanceTester.runPerformanceTests(),
        iconPerformanceTester.detectConflicts(),
        iconPerformanceTester.analyzeConsistency()
      ]);
      
      setPerformanceResults(perfResults);
      setConflictResults(conflictResults);
      setConsistencyResults(consistencyResults);
      
      console.log('✅ QA tests completed');
    } catch (error) {
      console.error('❌ QA tests failed:', error);
    } finally {
      setIsRunningQA(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Load Testing Controls</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={runLoadTest}
          disabled={isLoadTesting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadTesting ? 'Running Load Test...' : 'Run Load Test'}
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cache & Reload
        </button>
        
        <button
          onClick={runQATests}
          disabled={isRunningQA}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isRunningQA ? 'Running QA Tests...' : 'Run QA Tests'}
        </button>
      </div>
      
      {loadTestResults && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Load Test Results</h3>
          <div className="text-sm">
            <p>Iterations: {loadTestResults.iterations}</p>
            <p>Total Time: {loadTestResults.totalTime.toFixed(2)}ms</p>
            <p>Average per Iteration: {loadTestResults.averageTime.toFixed(2)}ms</p>
            <p>Icons per Iteration: {TEST_SUBJECTS.length}</p>
            <p>Average per Icon: {(loadTestResults.averageTime / TEST_SUBJECTS.length).toFixed(2)}ms</p>
          </div>
        </div>
      )}
      
      {/* QA Test Results */}
      {(performanceResults.length > 0 || conflictResults.length > 0 || consistencyResults.length > 0) && (
        <div className="mt-6 space-y-6">
          {/* Performance Test Results */}
          {performanceResults.length > 0 && (
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2 text-blue-800">Performance Test Results</h3>
              <div className="space-y-2">
                {performanceResults.map((result, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                      {result.success ? '✅' : '❌'} {result.testName}
                    </span>
                    <span className="text-blue-600">{result.duration.toFixed(2)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Conflict Test Results */}
          {conflictResults.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-semibold mb-2 text-yellow-800">Conflict Detection Results</h3>
              <div className="space-y-2">
                {conflictResults.map((result, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className={result.detected ? 'text-red-700' : 'text-green-700'}>
                        {result.detected ? '⚠️' : '✅'} {result.conflictType}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.severity === 'high' ? 'bg-red-200 text-red-800' :
                        result.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {result.severity}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Consistency Test Results */}
          {consistencyResults.length > 0 && (
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold mb-2 text-purple-800">Consistency Analysis Results</h3>
              <div className="space-y-2">
                {consistencyResults.map((result, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700">{result.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.consistencyScore >= 90 ? 'bg-green-200 text-green-800' :
                        result.consistencyScore >= 70 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {result.consistencyScore.toFixed(1)}%
                      </span>
                    </div>
                    {result.issues.length > 0 && (
                      <ul className="text-xs text-gray-600 mt-1 list-disc list-inside">
                        {result.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IconPerformanceTestPage() {
  const [preloadComplete, setPreloadComplete] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Icon Performance Test</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive testing of the optimized icon system with performance monitoring
          </p>
        </div>

        <IconPreloader 
          subjects={TEST_SUBJECTS} 
          onPreloadComplete={() => setPreloadComplete(true)}
        >
          <div className="space-y-8">
            {preloadComplete && (
              <>
                <PerformanceMetrics />
                <LoadTestControls />
                <IconGrid subjects={TEST_SUBJECTS} />
              </>
            )}
          </div>
        </IconPreloader>
      </div>
    </div>
  );
}