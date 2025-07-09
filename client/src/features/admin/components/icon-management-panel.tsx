/**
 * Icon Management Panel for Admin Interface
 * Comprehensive icon assignment and management
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { SearchableSelect } from '../../../components/ui/searchable-select';
import { useToast } from '../../../hooks/use-toast';
import { iconService, type IconSearchResult } from '../../../services/icon-service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../services/queryClient';

interface SubjectIconAssignment {
  subjectSlug: string;
  subjectName: string;
  currentIconId?: string;
  currentIconName?: string;
}

export function IconManagementPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for available icons
  const { data: availableIcons = [], isLoading: iconsLoading } = useQuery({
    queryKey: ['admin', 'icons', 'available'],
    queryFn: () => iconService.getAllAvailableIcons()
  });

  // Query for subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: () => apiRequest('/api/subjects')
  });

  // Query for icon analytics
  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'icons', 'analytics'],
    queryFn: () => iconService.getIconAnalytics()
  });

  // Search icons
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['admin', 'icons', 'search', searchQuery, selectedCategory],
    queryFn: () => iconService.searchIcons(searchQuery, selectedCategory),
    enabled: searchQuery.length > 2 || selectedCategory.length > 0
  });

  // Initialize icon system mutation
  const initializeSystemMutation = useMutation({
    mutationFn: () => iconService.initializeIconSystem(),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Icon system initialized successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'icons'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize icon system",
        variant: "destructive"
      });
    }
  });

  // Assign icon mutation
  const assignIconMutation = useMutation({
    mutationFn: ({ subjectSlug, iconId, priority }: {
      subjectSlug: string;
      iconId: string;
      priority: 'high' | 'normal' | 'low';
    }) => iconService.assignIconToSubject(subjectSlug, iconId, priority),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Icon assigned successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'icons'] });
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

  const categories = [...new Set(availableIcons.map(icon => icon.category))];
  
  const subjectOptions = subjects.map((subject: any) => ({
    value: subject.slug,
    label: subject.name
  }));

  const iconOptions = (searchResults.length > 0 ? searchResults : availableIcons).map(icon => ({
    value: icon.id,
    label: `${icon.name} (${icon.category})`,
    description: icon.description
  }));

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
      iconId: selectedIcon,
      priority: 'normal'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Icon Management System</CardTitle>
          <CardDescription>
            Manage icons for subjects and exams with database-driven mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => initializeSystemMutation.mutate()}
              disabled={initializeSystemMutation.isPending}
              className="w-full"
            >
              {initializeSystemMutation.isPending ? 'Initializing...' : 'Initialize Icon System'}
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {availableIcons.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available Icons</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {subjects.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Icon Categories</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assign">Assign Icons</TabsTrigger>
          <TabsTrigger value="search">Search Icons</TabsTrigger>
          <TabsTrigger value="browse">Browse Icons</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Icons to Subjects</CardTitle>
              <CardDescription>
                Select a subject and assign an appropriate icon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <SearchableSelect
                    options={subjectOptions}
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    placeholder="Select a subject..."
                    disabled={subjectsLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <SearchableSelect
                    options={iconOptions}
                    value={selectedIcon}
                    onValueChange={setSelectedIcon}
                    placeholder="Select an icon..."
                    disabled={iconsLoading}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAssignIcon}
                disabled={assignIconMutation.isPending || !selectedSubject || !selectedIcon}
                className="w-full"
              >
                {assignIconMutation.isPending ? 'Assigning...' : 'Assign Icon'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Icons</CardTitle>
              <CardDescription>
                Search through available icons by name, description, or keywords
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Query</label>
                  <Input
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Filter</label>
                  <SearchableSelect
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    placeholder="All categories"
                  />
                </div>
              </div>
              
              {searchLoading ? (
                <div className="text-center py-8">Searching...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.map((icon) => (
                    <div key={icon.id} className="p-4 border rounded-lg text-center space-y-2">
                      <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs">{icon.name.charAt(0)}</span>
                      </div>
                      <div className="text-sm font-medium">{icon.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {icon.category}
                      </Badge>
                      {icon.isOfficial && (
                        <Badge variant="default" className="text-xs">
                          Official
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browse All Icons</CardTitle>
              <CardDescription>
                View all available icons organized by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {iconsLoading ? (
                <div className="text-center py-8">Loading icons...</div>
              ) : (
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-semibold capitalize">{category}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {availableIcons
                          .filter(icon => icon.category === category)
                          .map((icon) => (
                            <div key={icon.id} className="p-4 border rounded-lg text-center space-y-2">
                              <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <span className="text-xs">{icon.name.charAt(0)}</span>
                              </div>
                              <div className="text-sm font-medium">{icon.name}</div>
                              {icon.isOfficial && (
                                <Badge variant="default" className="text-xs">
                                  Official
                                </Badge>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Icon Usage Analytics</CardTitle>
              <CardDescription>
                Track which icons are most frequently used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">Loading analytics...</div>
              ) : (
                <div className="space-y-4">
                  {analytics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No usage data available yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {analytics.slice(0, 10).map((item: any, index) => (
                        <div key={item.iconId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <div>
                              <div className="font-medium">{item.iconName}</div>
                              <div className="text-sm text-gray-500">{item.iconId}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.totalViews} views</div>
                            <div className="text-sm text-gray-500">
                              Last used: {new Date(item.lastUsed).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}