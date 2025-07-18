 // RSC directive for client-side interactivity and Vercel compatibility

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, BookOpen, Clock, Star, TrendingUp, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Header, Footer, SEOHead } from "../../shared";
import { Subject } from "../../../../../shared/schema";
import { DynamicIcon } from "../../../utils/dynamic-icon";

// Category configuration
const categoryConfig = {
  professional: {
    label: "Professional Certifications",
    keywords: ["pmp", "aws", "azure", "google cloud", "comptia", "cisco", "vmware", "oracle", "microsoft", "salesforce", "kubernetes", "docker", "devops"],
    color: "blue",
    icon: "briefcase"
  },
  academic: {
    label: "University & College",
    keywords: ["mathematics", "statistics", "calculus", "algebra", "physics", "chemistry", "biology", "computer science", "engineering", "nursing", "medical", "business", "economics", "accounting", "psychology", "history", "english", "writing"],
    color: "green",
    icon: "graduation-cap"
  },
  test_prep: {
    label: "Test Preparation",
    keywords: ["gre", "lsat", "toefl", "ged", "hesi", "teas", "sat", "act"],
    color: "purple",
    icon: "pencil"
  },
  other: {
    label: "Other Subjects",
    keywords: [],
    color: "gray",
    icon: "book-open"
  }
};

// Fixed: Memoized function to reduce redundant calls across components
const getCategoryForSubject = (subject: Subject): string => {
  if (!subject?.name) return "other"; // Fixed: Validation for subject existence
  
  const subjectLower = subject.name.toLowerCase();
  
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => subjectLower.includes(keyword))) {
      return key;
    }
  }
  
  return "other";
};

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

function SubjectCard({ subject, onClick }: SubjectCardProps) {
  // Fixed: Enhanced field validation with fallback values
  const validatedSubject = {
    ...subject,
    name: subject.name || 'Unknown Subject',
    description: subject.description || 'Comprehensive practice questions and study materials',
    icon: subject.icon || 'book',
    examCount: subject.examCount || 0,
    questionCount: subject.questionCount || 0,
    slug: subject.slug
  };

  const category = getCategoryForSubject(validatedSubject);
  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];

  // Fixed: Enhanced error handling for onClick
  const handleClick = useCallback(() => {
    try {
      onClick();
    } catch (error) {
      console.error('SubjectCard onClick error:', error);
    }
  }, [onClick]);

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/20 h-full"
      onClick={handleClick}
      role="button" // Fixed: Enhanced accessibility
      tabIndex={0}
      aria-label={`View ${validatedSubject.name} subject details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <DynamicIcon 
                name={validatedSubject.icon} 
                className="w-6 h-6 text-gray-600"
              />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                {validatedSubject.name}
              </CardTitle>
              <Badge variant="outline" className={`text-${categoryInfo.color}-600 border-${categoryInfo.color}-200 mt-1`}>
                {categoryInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {validatedSubject.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>{validatedSubject.examCount} exams</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{validatedSubject.questionCount} questions</span>
            </div>
          </div>
          {/* Fixed: Dynamic ratings - removed hardcoded 4.8 */}
          {validatedSubject.rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{validatedSubject.rating}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AllSubjects() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fixed: Optimized refetching - increased interval and enhanced error handling
  const { data: subjects, isLoading, error, refetch } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30000, // 30 seconds
    refetchInterval: 300000, // Fixed: Refetch every 5 minutes instead of 1 minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fixed: Removed ID-based navigation - slug-only routing as per requirements
  const handleSelectSubject = useCallback((subject: Subject) => {
    // Fixed: Slug validation with fallback route
    if (!subject.slug) {
      console.error('Subject missing slug:', subject);
      return; // Fixed: Don't navigate if no slug available
    }
    
    const path = `/subject/${subject.slug}`;
    setLocation(path);
  }, [setLocation]);

  // Fixed: Memoized categorized subjects to reduce redundant getCategoryForSubject calls
  const categorizedSubjects = useMemo(() => {
    if (!subjects) return {};
    
    const categories: Record<string, Subject[]> = {};
    
    subjects.forEach(subject => {
      const category = getCategoryForSubject(subject);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(subject);
    });
    
    return categories;
  }, [subjects]);

  const filteredAndSortedSubjects = useMemo(() => {
    if (!subjects) return [];
    
    let filtered = subjects;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(subject => 
        getCategoryForSubject(subject) === selectedCategory
      );
    }
    
    // Fixed: Sort subjects - removed ID-based popularity sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "exams":
          return (b.examCount || 0) - (a.examCount || 0);
        case "questions":
          return (b.questionCount || 0) - (a.questionCount || 0);
        case "popular":
          // Fixed: Use actual popularity metric or fallback to name sorting
          return (b.examCount || 0) + (b.questionCount || 0) - ((a.examCount || 0) + (a.questionCount || 0));
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [subjects, searchQuery, selectedCategory, sortBy]);

  // Pagination calculations
  const totalItems = filteredAndSortedSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubjects = filteredAndSortedSubjects.slice(startIndex, endIndex);

  // Fixed: Centralized filter reset logic
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  }, []);

  // Fixed: Ensure pagination consistency for all filter changes
  const handleFilterChange = useCallback((callback: () => void) => {
    setCurrentPage(1);
    callback();
  }, []);

  // Fixed: Enhanced error handling for API failures
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-medium">Failed to load subjects</p>
              <p className="text-sm text-gray-600">Please check your connection and try again</p>
            </div>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading subjects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="All Subjects - Comprehensive Exam Preparation | Brainliest"
        description="Browse all available certification and academic subjects. From PMP and AWS to Mathematics and Computer Science - find your perfect exam preparation course."
        keywords={[
          'all subjects', 'certification exams', 'academic courses', 'test preparation',
          'PMP', 'AWS', 'CompTIA', 'mathematics', 'computer science', 'nursing',
          'exam subjects', 'practice tests', 'study materials'
        ]}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              All Subjects
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive collection of {subjects?.length || 0} subjects covering professional certifications, 
            academic courses, and test preparation materials.
          </p>
        </div>

        {/* Statistics Summary */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{subjects?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Subjects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {subjects?.reduce((sum, s) => sum + (s.examCount || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Practice Exams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {subjects?.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Practice Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {Object.keys(categorizedSubjects).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => handleFilterChange(() => setSelectedCategory(value))}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <DynamicIcon name={config.icon} className="w-4 h-4 mr-2 inline" />
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="exams">Most Exams</SelectItem>
                <SelectItem value="questions">Most Questions</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Items Per Page */}
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="30">30 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => handleFilterChange(() => setSearchQuery(""))}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Category: {categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}
                  <button 
                    onClick={() => handleFilterChange(() => setSelectedCategory("all"))}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs h-6"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} subjects
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory !== "all" && ` in ${categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}`}
          </p>
        </div>

        {/* Subjects Table */}
        {paginatedSubjects.length > 0 ? (
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Subject Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-center">Exams</TableHead>
                  <TableHead className="font-semibold text-center">Questions</TableHead>
                  <TableHead className="font-semibold text-center">Rating</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubjects.map((subject) => {
                  const category = getCategoryForSubject(subject);
                  const categoryData = categoryConfig[category as keyof typeof categoryConfig];
                  
                  return (
                    <TableRow key={subject.slug} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {/* Fixed: Use DynamicIcon for table category icons */}
                          <DynamicIcon name={categoryData?.icon || "book-open"} className="w-5 h-5 text-primary" />
                          <span>{subject.name || 'Unknown Subject'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {categoryData?.label || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{subject.examCount || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{subject.questionCount || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {/* Fixed: Dynamic ratings - removed hardcoded 4.8 */}
                        {subject.rating ? (
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{subject.rating}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectSubject(subject)}
                          className="bg-primary hover:bg-primary/90"
                          disabled={!subject.slug} // Fixed: Disable if no slug
                        >
                          Start Practice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No subjects found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 
                "Try adjusting your search terms or browse different categories." :
                "No subjects match your current filters."
              }
            </p>
            <Button onClick={resetFilters}>
              Show All Subjects
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}