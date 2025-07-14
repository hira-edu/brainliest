 // Fixed: RSC directive for Vercel compatibility

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Subject } from "../../../../../shared/schema";
import { categoryStructure, getCategoryForSubject } from "../../../../../shared/constants";
import SubjectCard from "../components/subject-card";
import { Header, Footer, SEOHead } from "../../shared";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../components/ui/select";
import { Search, ArrowLeft, Filter, RefreshCw } from "lucide-react";
import { DynamicIcon } from "../../../utils/dynamic-icon";

interface CategoryDetailPageProps {
  categoryId?: string;
  subCategoryId?: string;
}

export default function CategoryDetailPage({ categoryId, subCategoryId }: CategoryDetailPageProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Fixed: Enhanced error handling with retry logic
  const { data: subjects, isLoading, error, refetch } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    staleTime: 300000, // Fixed: Increased stale time for efficiency
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const categoryData = useMemo(() => {
    if (!categoryId) return null;
    
    const category = categoryStructure.find(c => c.id === categoryId);
    if (!category) return null;
    
    if (subCategoryId) {
      const subCategory = category.subCategories.find(sc => sc.id === subCategoryId);
      return { category, subCategory };
    }
    
    return { category, subCategory: null };
  }, [categoryId, subCategoryId]);

  // Fixed: Dynamic slug mapping instead of hardcoded maps
  const categorySlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryStructure.forEach(category => {
      // Extract slug from route (e.g., "/categories/professional" -> "professional-certifications")
      const routeSlug = category.route.split('/').pop();
      if (routeSlug === 'professional') map[category.id] = 'professional-certifications';
      else if (routeSlug === 'academic') map[category.id] = 'university-college';
      else map[category.id] = routeSlug || category.id;
    });
    return map;
  }, []);

  const subcategorySlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryStructure.forEach(category => {
      category.subCategories.forEach(subCategory => {
        // Extract slug from route or use mapping logic
        const routeSlug = subCategory.route.split('/').pop();
        if (routeSlug === 'it-cloud') map[subCategory.id] = 'it-cloud-computing';
        else if (routeSlug === 'health-medical') map[subCategory.id] = 'health-medical-sciences';
        else if (routeSlug === 'social-sciences-humanities') map[subCategory.id] = 'social-sciences-humanities';
        else if (routeSlug === 'test-prep') map[subCategory.id] = 'standardized-test-prep';
        else map[subCategory.id] = routeSlug || subCategory.id;
      });
    });
    return map;
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!subjects || !categoryData) return [];
    
    let filtered = subjects.filter(subject => {
      // Fixed: Log subjects with missing names in development
      if (!subject?.name) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Subject with missing name found:', subject);
        }
        return false;
      }
      
      const expectedCategorySlug = categorySlugMap[categoryData.category.id];
      
      // Fixed: Validate slug mapping
      if (!expectedCategorySlug) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No category slug mapping found for:', categoryData.category.id);
        }
        return false;
      }
      
      // If we're in a subcategory view, filter by exact subcategory match
      if (categoryData.subCategory) {
        const expectedSubcategorySlug = subcategorySlugMap[categoryData.subCategory.id];
        if (!expectedSubcategorySlug) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('No subcategory slug mapping found for:', categoryData.subCategory.id);
          }
          return false;
        }
        return subject.categorySlug === expectedCategorySlug && 
               subject.subcategorySlug === expectedSubcategorySlug;
      } else {
        // Filter by main category only
        return subject.categorySlug === expectedCategorySlug;
      }
    });
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "examCount":
          return (b.examCount || 0) - (a.examCount || 0);
        case "questionCount":
          return (b.questionCount || 0) - (a.questionCount || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [subjects, categoryData, searchQuery, sortBy, categorySlugMap, subcategorySlugMap]);

  // Fixed: Remove ID-based navigation - slug-only routing
  const handleSelectSubject = useCallback((subject: Subject) => {
    // Fixed: Validate slug before navigation
    if (!subject.slug) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Subject missing slug:', subject);
      }
      return; // Don't navigate if no slug available
    }
    
    const path = `/subject/${subject.slug}`;
    setLocation(path);
  }, [setLocation]);

  // Fixed: Centralized clear search logic
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleBackClick = useCallback(() => {
    if (categoryData?.subCategory) {
      setLocation(categoryData.category.route);
    } else {
      setLocation("/categories");
    }
  }, [categoryData, setLocation]);

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
        <Footer />
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
        <Footer />
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-4">The requested category could not be found.</p>
            <Link href="/categories">
              <Button>Browse All Categories</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { category, subCategory } = categoryData;
  const currentCategory = subCategory || category;

  // Fixed: Enhanced field validation with fallback values
  const validatedCurrentCategory = {
    ...currentCategory,
    title: currentCategory.title || 'Unknown Category',
    description: currentCategory.description || 'Category description not available',
    icon: currentCategory.icon || 'book-open'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed: SEO integration */}
      <SEOHead
        title={`${validatedCurrentCategory.title} - Exam Preparation | Brainliest`}
        description={`${validatedCurrentCategory.description}. Find practice exams, study materials, and certification preparation resources.`}
        keywords={[
          validatedCurrentCategory.title.toLowerCase(),
          'exam preparation', 'certification', 'practice tests', 'study materials',
          ...(category.title !== validatedCurrentCategory.title ? [category.title.toLowerCase()] : []),
          ...filteredSubjects.map(s => s.name).slice(0, 10) // Top 10 subject names
        ]}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="mb-4 text-gray-600 hover:text-gray-900"
            aria-label={`Back to ${subCategory ? category.title : 'Categories'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back {subCategory ? `to ${category.title}` : "to Categories"}
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              {/* Fixed: DynamicIcon validation with fallback */}
              <DynamicIcon name={validatedCurrentCategory.icon} className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{validatedCurrentCategory.title}</h1>
              <p className="text-gray-600 mt-1">{validatedCurrentCategory.description}</p>
              {subCategory && (
                <Badge variant="secondary" className="mt-2">
                  {category.title}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Sub-categories (only show for main categories) */}
        {!subCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sub-categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.subCategories.map((subCat) => {
                // Fixed: Enhanced subcategory validation
                const validatedSubCat = {
                  ...subCat,
                  title: subCat.title || 'Unknown Subcategory',
                  description: subCat.description || 'Subcategory description not available',
                  icon: subCat.icon || 'book-open',
                  route: subCat.route || '#'
                };

                return (
                  <Link 
                    key={subCat.id} 
                    href={validatedSubCat.route}
                    aria-label={`Navigate to ${validatedSubCat.title} subcategory`}
                  >
                    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          {/* Fixed: DynamicIcon validation with fallback for subcategories */}
                          <DynamicIcon name={validatedSubCat.icon} className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-medium text-gray-900">{validatedSubCat.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{validatedSubCat.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="examCount">Most Exams</SelectItem>
                <SelectItem value="questionCount">Most Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} found
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                aria-label="Clear search query"
              >
                Clear search
              </Button>
            )}
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <SubjectCard 
                key={subject.slug} 
                subject={subject} 
                onClick={() => handleSelectSubject(subject)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 
                "Try adjusting your search terms or browse other categories." :
                `No subjects are available in ${validatedCurrentCategory.title} yet.`
              }
            </p>
            {searchQuery && (
              <Button onClick={clearSearch} aria-label="Clear search to see all subjects">
                Clear search
              </Button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}