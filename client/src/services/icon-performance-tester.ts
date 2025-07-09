/**
 * Icon Performance Testing Service
 * Comprehensive testing suite for icon system performance, conflicts, and consistency
 */

import { Subject } from '../../../shared/schema';
import { optimizedIconService } from './optimized-icon-service';

export interface PerformanceTestResult {
  testName: string;
  duration: number;
  success: boolean;
  details: any;
  timestamp: number;
}

export interface ConflictTestResult {
  conflictType: string;
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ConsistencyTestResult {
  category: string;
  consistencyScore: number;
  issues: string[];
  recommendations: string[];
}

class IconPerformanceTester {
  private testResults: PerformanceTestResult[] = [];
  private conflictResults: ConflictTestResult[] = [];
  private consistencyResults: ConsistencyTestResult[] = [];

  /**
   * Run comprehensive icon performance tests
   */
  async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    console.log('🚀 Starting comprehensive icon performance tests...');
    
    this.testResults = [];
    
    // Test 1: Single icon loading performance
    await this.testSingleIconPerformance();
    
    // Test 2: Batch icon loading performance
    await this.testBatchIconPerformance();
    
    // Test 3: Cache performance testing
    await this.testCachePerformance();
    
    // Test 4: High load simulation
    await this.testHighLoadPerformance();
    
    // Test 5: Database query performance
    await this.testDatabaseQueryPerformance();
    
    return this.testResults;
  }

  /**
   * Test single icon loading performance
   */
  private async testSingleIconPerformance(): Promise<void> {
    const testSubjects = ['AWS Certified Solutions Architect', 'Mathematics', 'HESI', 'CompTIA Security+'];
    const results = [];

    for (const subject of testSubjects) {
      const startTime = performance.now();
      
      try {
        const iconEntry = await optimizedIconService.getIconForSubject(
          subject.toLowerCase().replace(/\s+/g, '-')
        );
        
        const duration = performance.now() - startTime;
        results.push({
          subject,
          duration,
          success: !!iconEntry,
          source: iconEntry?.source || 'none'
        });
      } catch (error) {
        results.push({
          subject,
          duration: performance.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const successRate = results.filter(r => r.success).length / results.length;

    this.testResults.push({
      testName: 'Single Icon Performance',
      duration: avgDuration,
      success: successRate >= 0.9,
      details: {
        averageDuration: avgDuration,
        successRate,
        individualResults: results
      },
      timestamp: Date.now()
    });
  }

  /**
   * Test batch icon loading performance
   */
  private async testBatchIconPerformance(): Promise<void> {
    const testSubjects = [
      'AWS Certified Solutions Architect', 'Microsoft Azure Fundamentals', 'CompTIA Security+',
      'Cisco CCNA', 'PMP Certification', 'HESI', 'TEAS', 'GRE', 'LSAT', 'TOEFL',
      'Mathematics', 'Statistics', 'Computer Science', 'Physics', 'Chemistry'
    ];

    const startTime = performance.now();
    
    try {
      const promises = testSubjects.map(subject =>
        optimizedIconService.getIconForSubject(
          subject.toLowerCase().replace(/\s+/g, '-')
        )
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;
      const successCount = results.filter(r => r !== null).length;
      
      this.testResults.push({
        testName: 'Batch Icon Loading',
        duration,
        success: successCount >= testSubjects.length * 0.9,
        details: {
          totalSubjects: testSubjects.length,
          successCount,
          averagePerIcon: duration / testSubjects.length,
          batchDuration: duration
        },
        timestamp: Date.now()
      });
    } catch (error) {
      this.testResults.push({
        testName: 'Batch Icon Loading',
        duration: performance.now() - startTime,
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test cache performance
   */
  private async testCachePerformance(): Promise<void> {
    const testSubject = 'aws-certified-solutions-architect';
    
    // First load (cache miss)
    optimizedIconService.clearCache();
    const startTime1 = performance.now();
    await optimizedIconService.getIconForSubject(testSubject);
    const firstLoad = performance.now() - startTime1;
    
    // Second load (cache hit)
    const startTime2 = performance.now();
    await optimizedIconService.getIconForSubject(testSubject);
    const secondLoad = performance.now() - startTime2;
    
    const cacheImprovementRatio = firstLoad / secondLoad;
    
    this.testResults.push({
      testName: 'Cache Performance',
      duration: secondLoad,
      success: cacheImprovementRatio > 2, // Cache should be at least 2x faster
      details: {
        firstLoadTime: firstLoad,
        secondLoadTime: secondLoad,
        improvementRatio: cacheImprovementRatio,
        cacheEfficiency: ((firstLoad - secondLoad) / firstLoad) * 100
      },
      timestamp: Date.now()
    });
  }

  /**
   * Test high load performance
   */
  private async testHighLoadPerformance(): Promise<void> {
    const iterations = 5;
    const subjectsPerIteration = 20;
    const testSubjects = [
      'AWS', 'Azure', 'CompTIA', 'Cisco', 'PMP', 'HESI', 'TEAS', 'GRE', 'LSAT', 'TOEFL',
      'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
      'React', 'Database', 'Algorithm', 'Academic'
    ];

    const startTime = performance.now();
    const allPromises = [];

    for (let i = 0; i < iterations; i++) {
      const iterationPromises = testSubjects.map(subject =>
        optimizedIconService.getIconForSubject(subject.toLowerCase())
      );
      allPromises.push(...iterationPromises);
    }

    try {
      const results = await Promise.all(allPromises);
      const duration = performance.now() - startTime;
      const successCount = results.filter(r => r !== null).length;
      const totalRequests = iterations * subjectsPerIteration;

      this.testResults.push({
        testName: 'High Load Performance',
        duration,
        success: successCount >= totalRequests * 0.95,
        details: {
          iterations,
          requestsPerIteration: subjectsPerIteration,
          totalRequests,
          successCount,
          averagePerRequest: duration / totalRequests,
          throughput: totalRequests / (duration / 1000) // requests per second
        },
        timestamp: Date.now()
      });
    } catch (error) {
      this.testResults.push({
        testName: 'High Load Performance',
        duration: performance.now() - startTime,
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Test database query performance
   */
  private async testDatabaseQueryPerformance(): Promise<void> {
    const iterations = 10;
    const queryTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          await response.json();
          queryTimes.push(performance.now() - startTime);
        } else {
          queryTimes.push(-1); // Error indicator
        }
      } catch (error) {
        queryTimes.push(-1); // Error indicator
      }
    }

    const validTimes = queryTimes.filter(t => t > 0);
    const avgQueryTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
    const successRate = validTimes.length / iterations;

    this.testResults.push({
      testName: 'Database Query Performance',
      duration: avgQueryTime,
      success: avgQueryTime < 100 && successRate >= 0.9, // Under 100ms with 90% success
      details: {
        iterations,
        averageQueryTime: avgQueryTime,
        successRate,
        queryTimes: validTimes
      },
      timestamp: Date.now()
    });
  }

  /**
   * Detect conflicts in icon system
   */
  async detectConflicts(): Promise<ConflictTestResult[]> {
    console.log('🔍 Starting icon conflict detection...');
    
    this.conflictResults = [];
    
    // Test for registry overwrites
    this.detectRegistryConflicts();
    
    // Test for pattern matching conflicts
    await this.detectPatternConflicts();
    
    // Test for database consistency conflicts
    await this.detectDatabaseConflicts();
    
    return this.conflictResults;
  }

  /**
   * Detect registry overwrite conflicts
   */
  private detectRegistryConflicts(): void {
    // Monitor console for overwrite warnings
    const originalConsoleWarn = console.warn;
    let overwriteDetected = false;
    
    console.warn = (message: any, ...args: any[]) => {
      if (typeof message === 'string' && message.includes('Overwriting icon')) {
        overwriteDetected = true;
      }
      originalConsoleWarn(message, ...args);
    };
    
    // Restore console.warn after a short delay
    setTimeout(() => {
      console.warn = originalConsoleWarn;
    }, 1000);

    this.conflictResults.push({
      conflictType: 'Registry Overwrites',
      detected: overwriteDetected,
      severity: overwriteDetected ? 'medium' : 'low',
      description: overwriteDetected 
        ? 'Icon registry overwrites detected - multiple systems registering same icon IDs'
        : 'No registry overwrite conflicts detected'
    });
  }

  /**
   * Detect pattern matching conflicts
   */
  private async detectPatternConflicts(): Promise<void> {
    const conflictingSubjects = [
      'AWS Cloud', 'Amazon Web Services', // Should both resolve to 'aws'
      'Microsoft Azure', 'Azure Cloud', // Should both resolve to 'azure'
      'Math', 'Mathematics' // Should resolve consistently
    ];

    const resolutionResults = [];
    
    for (const subject of conflictingSubjects) {
      try {
        const result = await optimizedIconService.getIconForSubject(
          subject.toLowerCase().replace(/\s+/g, '-')
        );
        resolutionResults.push({
          subject,
          iconId: result?.iconId || 'none',
          source: result?.source || 'none'
        });
      } catch (error) {
        resolutionResults.push({
          subject,
          iconId: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check for inconsistent resolutions
    const conflicts = resolutionResults.filter(r => r.iconId === 'error').length;
    
    this.conflictResults.push({
      conflictType: 'Pattern Matching Conflicts',
      detected: conflicts > 0,
      severity: conflicts > 2 ? 'high' : conflicts > 0 ? 'medium' : 'low',
      description: conflicts > 0
        ? `${conflicts} pattern matching conflicts detected`
        : 'No pattern matching conflicts detected'
    });
  }

  /**
   * Detect database consistency conflicts
   */
  private async detectDatabaseConflicts(): Promise<void> {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        this.conflictResults.push({
          conflictType: 'Database Access',
          detected: true,
          severity: 'high',
          description: 'Cannot access subjects database'
        });
        return;
      }

      const subjects: Subject[] = await response.json();
      
      // Check for subjects without proper icon resolution
      let unresolvedCount = 0;
      
      for (const subject of subjects.slice(0, 10)) { // Test first 10 for performance
        try {
          const result = await optimizedIconService.getIconForSubject(subject.slug);
          if (!result || result.source === 'fallback') {
            unresolvedCount++;
          }
        } catch (error) {
          unresolvedCount++;
        }
      }

      this.conflictResults.push({
        conflictType: 'Database Icon Resolution',
        detected: unresolvedCount > 3,
        severity: unresolvedCount > 5 ? 'high' : unresolvedCount > 3 ? 'medium' : 'low',
        description: `${unresolvedCount}/10 subjects could not resolve to specific icons`
      });
    } catch (error) {
      this.conflictResults.push({
        conflictType: 'Database Connectivity',
        detected: true,
        severity: 'high',
        description: 'Database connectivity issues detected'
      });
    }
  }

  /**
   * Analyze icon consistency across categories
   */
  async analyzeConsistency(): Promise<ConsistencyTestResult[]> {
    console.log('🎨 Starting icon consistency analysis...');
    
    this.consistencyResults = [];
    
    // Test professional certification consistency
    await this.testCertificationConsistency();
    
    // Test academic subject consistency
    await this.testAcademicConsistency();
    
    // Test test preparation consistency
    await this.testTestPrepConsistency();
    
    return this.consistencyResults;
  }

  /**
   * Test certification icon consistency
   */
  private async testCertificationConsistency(): Promise<void> {
    const certificationSubjects = [
      'AWS Certified Solutions Architect',
      'Microsoft Azure Fundamentals', 
      'CompTIA Security+',
      'Cisco CCNA',
      'PMP Certification'
    ];

    const results = [];
    let specificIconCount = 0;

    for (const subject of certificationSubjects) {
      try {
        const result = await optimizedIconService.getIconForSubject(
          subject.toLowerCase().replace(/\s+/g, '-')
        );
        
        results.push({
          subject,
          iconId: result?.iconId || 'none',
          source: result?.source || 'none'
        });

        if (result && result.source !== 'fallback') {
          specificIconCount++;
        }
      } catch (error) {
        results.push({
          subject,
          iconId: 'error',
          source: 'error'
        });
      }
    }

    const consistencyScore = (specificIconCount / certificationSubjects.length) * 100;
    const issues = [];
    const recommendations = [];

    if (consistencyScore < 80) {
      issues.push('Low specific icon coverage for certifications');
      recommendations.push('Add more certification-specific icons');
    }

    this.consistencyResults.push({
      category: 'Professional Certifications',
      consistencyScore,
      issues,
      recommendations
    });
  }

  /**
   * Test academic subject consistency
   */
  private async testAcademicConsistency(): Promise<void> {
    const academicSubjects = [
      'Mathematics',
      'Statistics', 
      'Computer Science',
      'Physics',
      'Chemistry'
    ];

    const results = [];
    let specificIconCount = 0;

    for (const subject of academicSubjects) {
      try {
        const result = await optimizedIconService.getIconForSubject(
          subject.toLowerCase().replace(/\s+/g, '-')
        );
        
        results.push({
          subject,
          iconId: result?.iconId || 'none',
          source: result?.source || 'none'
        });

        if (result && result.source !== 'fallback') {
          specificIconCount++;
        }
      } catch (error) {
        results.push({
          subject,
          iconId: 'error',
          source: 'error'
        });
      }
    }

    const consistencyScore = (specificIconCount / academicSubjects.length) * 100;
    const issues = [];
    const recommendations = [];

    if (consistencyScore < 70) {
      issues.push('Academic subjects rely heavily on fallback icons');
      recommendations.push('Create subject-specific academic icons');
    }

    this.consistencyResults.push({
      category: 'Academic Subjects',
      consistencyScore,
      issues,
      recommendations
    });
  }

  /**
   * Test test preparation consistency
   */
  private async testTestPrepConsistency(): Promise<void> {
    const testPrepSubjects = [
      'HESI',
      'TEAS',
      'GRE',
      'LSAT',
      'TOEFL'
    ];

    const results = [];
    let specificIconCount = 0;

    for (const subject of testPrepSubjects) {
      try {
        const result = await optimizedIconService.getIconForSubject(
          subject.toLowerCase()
        );
        
        results.push({
          subject,
          iconId: result?.iconId || 'none',
          source: result?.source || 'none'
        });

        if (result && result.source !== 'fallback') {
          specificIconCount++;
        }
      } catch (error) {
        results.push({
          subject,
          iconId: 'error',
          source: 'error'
        });
      }
    }

    const consistencyScore = (specificIconCount / testPrepSubjects.length) * 100;
    const issues = [];
    const recommendations = [];

    if (consistencyScore < 90) {
      issues.push('Some test prep subjects lack specific icons');
      recommendations.push('Ensure all major test prep exams have branded icons');
    }

    this.consistencyResults.push({
      category: 'Test Preparation',
      consistencyScore,
      issues,
      recommendations
    });
  }

  /**
   * Generate comprehensive QA report
   */
  generateQAReport(): any {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        tests: this.testResults,
        summary: {
          totalTests: this.testResults.length,
          passedTests: this.testResults.filter(t => t.success).length,
          averageDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0) / this.testResults.length
        }
      },
      conflicts: {
        tests: this.conflictResults,
        summary: {
          totalConflicts: this.conflictResults.length,
          detectedConflicts: this.conflictResults.filter(c => c.detected).length,
          highSeverity: this.conflictResults.filter(c => c.severity === 'high').length
        }
      },
      consistency: {
        tests: this.consistencyResults,
        summary: {
          averageConsistency: this.consistencyResults.reduce((sum, c) => sum + c.consistencyScore, 0) / this.consistencyResults.length,
          totalIssues: this.consistencyResults.reduce((sum, c) => sum + c.issues.length, 0)
        }
      }
    };
  }
}

export const iconPerformanceTester = new IconPerformanceTester();