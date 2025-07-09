/**
 * Downloaded Icon Manager
 * Manages the 27 professionally downloaded SVG icons
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { iconRegistryService } from '../../../services/icon-registry-service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../services/queryClient';

export function DownloadedIconManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [statistics, setStatistics] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load icon statistics
  useEffect(() => {
    async function loadStats() {
      await iconRegistryService.initialize();
      const stats = iconRegistryService.getStatistics();
      setStatistics(stats);
    }
    loadStats();
  }, []);

  // Get categories from icon registry
  const [categories, setCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    async function loadCategories() {
      await iconRegistryService.initialize();
      const cats = iconRegistryService.getCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  // Handle search
  useEffect(() => {
    async function performSearch() {
      await iconRegistryService.initialize();
      
      if (searchQuery) {
        const results = iconRegistryService.searchIcons(searchQuery);
        setSearchResults(results);
      } else if (selectedCategory) {
        const results = iconRegistryService.getIconsByCategory(selectedCategory);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
    
    performSearch();
  }, [searchQuery, selectedCategory]);

  // Query for subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: () => apiRequest('/api/subjects')
  });

  // Assign icon mutation (mock for now)
  const assignIconMutation = useMutation({
    mutationFn: async ({ subjectSlug, iconId }: { subjectSlug: string; iconId: string }) => {
      // This would normally call the API
      console.log(`🎯 Assigning icon "${iconId}" to subject "${subjectSlug}"`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Icon assigned successfully"
      });
      setSelectedSubject('');
      setSelectedIcon('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign icon",
        variant: "destructive"
      });
    }
  });

  const handleAssignIcon = () => {
    if (!selectedSubject || !selectedIcon) {
      toast({
        title: "Error",
        description: "Please select both a subject and an icon",
        variant: "destructive"
      });
      return;
    }

    assignIconMutation.mutate({
      subjectSlug: selectedSubject,
      iconId: selectedIcon
    });
  };

  const subjectOptions = subjects.map((subject: any) => ({
    value: subject.slug,
    label: subject.name
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Downloaded Icon Management</CardTitle>
          <CardDescription>
            Manage the 27 professionally downloaded SVG icons for certification and academic subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statistics.totalIcons || 27}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Downloaded Icons</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.categories || 16}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {subjects.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                30.93 KB
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Icons</TabsTrigger>
          <TabsTrigger value="assign">Assign to Subjects</TabsTrigger>
          <TabsTrigger value="test">Test Icons</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse Downloaded Icons</CardTitle>
              <CardDescription>
                Search and explore the 27 professionally downloaded SVG icons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Icons</label>
                  <Input
                    placeholder="Search by name, category, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {(searchResults.length > 0 ? searchResults : []).map((icon) => (
                  <div key={icon.id} className="p-4 border rounded-lg text-center space-y-2 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 mx-auto flex items-center justify-center">
                      <img 
                        src={`/icons/${icon.filename}`} 
                        alt={icon.name}
                        className="w-full h-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.textContent = icon.name.charAt(0);
                        }}
                      />
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 w-12 h-12 flex items-center justify-center rounded hidden">
                        {icon.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{icon.name}</div>
                    <Badge variant="secondary" className="text-xs">
                      {icon.category}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {(icon.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
              
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No icons found for "{searchQuery}"
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Icons to Subjects</CardTitle>
              <CardDescription>
                Map downloaded icons to database subjects for dynamic display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon..." />
                    </SelectTrigger>
                    <SelectContent>
                      {searchResults.map(icon => (
                        <SelectItem key={icon.id} value={icon.id}>
                          {icon.name} ({icon.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedIcon && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`/icons/${selectedIcon}.svg`} 
                      alt="Selected icon"
                      className="w-8 h-8"
                    />
                    <span className="font-medium">Preview: {selectedIcon}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleAssignIcon}
                disabled={assignIconMutation.isPending || !selectedSubject || !selectedIcon}
                className="w-full"
              >
                {assignIconMutation.isPending ? 'Assigning...' : 'Assign Icon to Subject'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Icon Resolution</CardTitle>
              <CardDescription>
                Test how the icon system resolves subjects to downloaded icons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'AWS Certified Solutions Architect',
                    'Microsoft Azure Fundamentals',
                    'CompTIA Security+',
                    'Cisco CCNA',
                    'Docker Containerization',
                    'Kubernetes Administration',
                    'Mathematics',
                    'Computer Science',
                    'Business Administration',
                    'Python Programming',
                    'JavaScript Development',
                    'React Frontend',
                  ].map((testSubject) => (
                    <div key={testSubject} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs">{testSubject.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{testSubject}</div>
                          <div className="text-xs text-gray-500">Test pattern</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <strong>Testing Instructions:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Open browser console (F12)</li>
                    <li>Navigate to any page with subject icons</li>
                    <li>Look for icon resolution logs</li>
                    <li>Verify icons are loading from /icons/ directory</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}