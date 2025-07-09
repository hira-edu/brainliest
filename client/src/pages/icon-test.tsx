/**
 * Icon Test Page
 * Tests icon resolution for all subjects in the database
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/queryClient';
import { SubjectIcon } from '../components/icons/icon';
import { iconRegistryService } from '../services/icon-registry-service';

export function IconTestPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load all subjects from database
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiRequest('/api/subjects')
  });

  // Initialize icon system
  const handleInitialize = async () => {
    try {
      await iconRegistryService.initialize();
      const stats = iconRegistryService.getStatistics();
      console.log('Icon system initialized:', stats);
      setIsInitialized(true);
      
      // Test icon resolution for all subjects
      const results: Record<string, any> = {};
      
      for (const subject of subjects) {
        try {
          const result = await iconRegistryService.getIconForSubject(subject.name);
          results[subject.name] = {
            ...result,
            subject: subject,
            status: 'success'
          };
        } catch (error) {
          results[subject.name] = {
            iconId: 'academic',
            source: 'error',
            subject: subject,
            status: 'error',
            error: error.message
          };
        }
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Failed to initialize icon system:', error);
    }
  };

  const testPatterns = [
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals', 
    'PMP Certification',
    'CompTIA Security+',
    'Cisco CCNA',
    'Docker Containerization',
    'Kubernetes Administration',
    'Python Programming',
    'JavaScript Development',
    'React Frontend Development',
    'Mathematics',
    'Computer Science',
    'Business Administration'
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Icon System Test & Validation</CardTitle>
          <CardDescription>
            Test icon resolution for all database subjects and common patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleInitialize} variant="default">
              Initialize Icon System
            </Button>
            <Badge variant={isInitialized ? "default" : "secondary"}>
              {isInitialized ? "Initialized" : "Not Initialized"}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Open browser console (F12) to see detailed icon resolution logs
          </div>
        </CardContent>
      </Card>

      {/* Test Pattern Resolution */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Matching Test</CardTitle>
          <CardDescription>
            Test icon resolution for common certification and subject patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testPatterns.map((pattern) => (
              <div key={pattern} className="flex items-center space-x-3 p-3 border rounded-lg">
                <SubjectIcon 
                  subjectName={pattern} 
                  className="w-8 h-8" 
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{pattern}</div>
                  <div className="text-xs text-gray-500">Pattern test</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Subjects Test */}
      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Database Subjects ({subjects.length} total)</CardTitle>
            <CardDescription>
              Icon resolution for all subjects in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject: any) => {
                const result = testResults[subject.name];
                return (
                  <div key={subject.slug} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <SubjectIcon 
                      subjectName={subject.name} 
                      className="w-8 h-8" 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{subject.name}</div>
                      <div className="text-xs text-gray-500">
                        {subject.category_slug} → {subject.subcategory_slug}
                      </div>
                      {result && (
                        <Badge 
                          variant={result.source === 'pattern' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {result.iconId} ({result.source})
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Object.values(testResults).filter((r: any) => r.source === 'pattern').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pattern Matched</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Object.values(testResults).filter((r: any) => r.source === 'database').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Database Mapped</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {Object.values(testResults).filter((r: any) => r.source === 'fallback').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fallback Icons</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Object.keys(testResults).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Tested</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}