/**
 * Icon Test Page
 * Test page to verify subject icons are appearing correctly
 */

import React from 'react';
import { SubjectIcon } from '../components/icons';

const IconTestPage = () => {
  // Test subjects from the database
  const testSubjects = [
    'Test Subject',
    'PMP Certification',
    'Cisco CCNA',
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals',
    'CompTIA Security+',
    'HESI',
    'AP Statistics',
    'Accounting',
    'Biology',
    'Computer Science Fundamentals',
    'Database Design'
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Subject Icons Test</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {testSubjects.map((subject) => (
          <div key={subject} className="flex flex-col items-center p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <SubjectIcon 
              subjectName={subject} 
              size="xl" 
              className="mb-3"
            />
            <h3 className="text-sm font-medium text-center text-gray-700 dark:text-gray-300">
              {subject}
            </h3>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Icon System Status</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This page tests the subject icon mapping system. Check the browser console for debug messages about icon resolution.
        </p>
      </div>
    </div>
  );
};

export default IconTestPage;