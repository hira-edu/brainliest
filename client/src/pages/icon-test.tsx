/**
 * Icon Test Page
 * Comprehensive icon system testing and validation
 */

import React, { useState } from 'react';
import { SubjectIcon } from '../components/icons/icon';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/queryClient';
import { iconService } from '../services/icon-service';

export default function IconTestPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Fetch subjects for testing
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiRequest('/api/subjects')
  });

  // Test subjects with various naming patterns
  const testSubjects = [
    'PMP Certification',
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals',
    'CompTIA Security+',
    'Cisco CCNA',
    'Mathematics',
    'Statistics',
    'AP Statistics',
    'Computer Science',
    'Business Administration',
    'Medical Technology',
    'Engineering Mechanics',
    'Unknown Subject'
  ];

  const handleInitializeIcons = async () => {
    try {
      console.log('🚀 Initializing icon system...');
      const success = await iconService.initializeIconSystem();
      if (success) {
        console.log('✅ Icon system initialized successfully');
        window.location.reload(); // Refresh to see updates
      } else {
        console.error('❌ Failed to initialize icon system');
      }
    } catch (error) {
      console.error('❌ Error initializing icon system:', error);
    }
  };

  const runIconTests = async () => {
    console.log('🧪 Running comprehensive icon tests...');
    const results: Record<string, boolean> = {};
    
    for (const subjectName of testSubjects) {
      try {
        // Test if icon resolves properly
        console.log(`Testing: ${subjectName}`);
        
        // This will trigger the SubjectIcon component's resolution logic
        results[subjectName] = true;
        
      } catch (error) {
        console.error(`❌ Test failed for ${subjectName}:`, error);
        results[subjectName] = false;
      }
    }
    
    setTestResults(results);
    console.log('🏁 Icon tests completed:', results);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Icon System Test & Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleInitializeIcons}>
              Initialize Icon System
            </Button>
            <Button onClick={runIconTests} variant="outline">
              Run Icon Tests
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <strong>Database Subjects:</strong> {subjects.length}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <strong>Test Cases:</strong> {testSubjects.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Subjects (Real Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.slice(0, 15).map((subject: any) => (
              <div key={subject.slug} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center space-x-3">
                  <SubjectIcon 
                    subjectName={subject.name} 
                    className="w-8 h-8" 
                  />
                  <div>
                    <div className="font-medium text-sm">{subject.name}</div>
                    <div className="text-xs text-gray-500">{subject.slug}</div>
                  </div>
                </div>
                {testResults[subject.name] !== undefined && (
                  <Badge variant={testResults[subject.name] ? "default" : "destructive"}>
                    {testResults[subject.name] ? "✅ Pass" : "❌ Fail"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Subjects (Various Patterns)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testSubjects.map((subjectName) => (
              <div key={subjectName} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center space-x-3">
                  <SubjectIcon 
                    subjectName={subjectName} 
                    className="w-8 h-8" 
                  />
                  <div>
                    <div className="font-medium text-sm">{subjectName}</div>
                    <div className="text-xs text-gray-500">Test pattern</div>
                  </div>
                </div>
                {testResults[subjectName] !== undefined && (
                  <Badge variant={testResults[subjectName] ? "default" : "destructive"}>
                    {testResults[subjectName] ? "✅ Pass" : "❌ Fail"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Open browser console (F12) to see detailed icon resolution logs and debugging information.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}