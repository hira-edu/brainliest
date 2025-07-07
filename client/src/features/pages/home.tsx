import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Subject } from "@shared/schema";
import SubjectCard from "@/features/content/components/subject-card";
import Header from "@/features/shared/components/header";
import Footer from "@/features/shared/components/footer";
import SEOHead from "@/features/shared/components/seo-head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter, TrendingUp, Users, Award, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  PMPIcon, 
  AWSIcon, 
  CompTIAIcon, 
  AzureIcon,
  CiscoIcon,
  GoogleCloudIcon,
  OracleIcon,
  VMwareIcon,
  KubernetesIcon,
  DockerIcon,
  MathIcon,
  StatisticsIcon,
  ScienceIcon,
  EngineeringIcon,
  BusinessIcon,
  MedicalIcon
} from "@/utils/certification-icons";
import { navigateToSubject } from "@/utils/slug-navigation";

// Category configuration for better organization
const categoryConfig = {
  certifications: {
    title: "Professional Certifications",
    description: "Industry-recognized certifications",
    icon: Award,
    keywords: ["certification", "aws", "pmp", "comptia", "cisco", "microsoft", "azure", "ccna", "certified", "professional", "practitioner"]
  },
  university: {
    title: "University & College",
    description: "Academic subjects and courses",
    icon: BookOpen,
    keywords: [
      // Mathematics & Statistics
      "statistics", "mathematics", "calculus", "algebra", "geometry", "discrete", "pre-calculus",
      "biostatistics", "business statistics", "elementary statistics", "intro to statistics",
      // Sciences
      "physics", "chemistry", "biology", "anatomy", "astronomy", "earth science",
      // Computer Science
      "computer science", "programming", "data structures", "web development", "database",
      // Engineering
      "engineering", "mechanical", "electrical",
      // Business & Economics
      "business", "accounting", "economics", "finance", "administration",
      // Medical & Health
      "medical", "nursing", "pharmacology", "health sciences", "hesi", "teas",
      // Social Sciences & Humanities
      "psychology", "history", "philosophy", "sociology", "political science", "english", "writing",
      // Test Prep
      "ged", "gre", "lsat", "toefl"
    ]
  },
  other: {
    title: "Other Subjects",
    description: "Additional practice subjects and custom content",
    icon: BookOpen,
    keywords: ["dummy", "test", "practice", "custom", "sample"] // Common test/demo keywords
  }
};

function getCategoryForSubject(subject: Subject): string {
  const subjectLower = subject.name.toLowerCase();
  
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (config.keywords.some(keyword => subjectLower.includes(keyword))) {
      return key;
    }
  }
  
  return "other";
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});

  // Helper function to get current page for a category
  const getCurrentPage = (categoryKey: string) => currentPage[categoryKey] || 1;
  
  // Helper function to set current page for a category
  const setCurrentPageForCategory = (categoryKey: string, page: number) => {
    setCurrentPage(prev => ({ ...prev, [categoryKey]: page }));
  };

  // Helper function to get items per page for a category
  const getItemsPerPage = (categoryKey: string) => itemsPerPage[categoryKey] || 10;
  
  // Helper function to set items per page for a category
  const setItemsPerPageForCategory = (categoryKey: string, items: number) => {
    setItemsPerPage(prev => ({ ...prev, [categoryKey]: items }));
  };
  
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: trendingCerts } = useQuery<any[]>({
    queryKey: ["/api/trending/certifications"],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: stats } = useQuery<{
    subjects: number;
    exams: number;
    questions: number;
    successRate: number;
  }>({
    queryKey: ["/api/stats"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });


  const handleSelectSubject = (subject: Subject) => {
    // Use centralized slug navigation
    navigateToSubject(setLocation, subject);
  };

  // Categorize and filter subjects
  const { categorizedSubjects, filteredSubjects } = useMemo(() => {
    if (!subjects) return { categorizedSubjects: {}, filteredSubjects: [] };
    
    const categories: Record<string, Subject[]> = {};
    
    subjects.forEach(subject => {
      const category = getCategoryForSubject(subject);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(subject);
    });
    
    // Filter subjects based on search and category
    let filtered = subjects;
    
    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(subject => 
        getCategoryForSubject(subject) === selectedCategory
      );
    }
    
    return { categorizedSubjects: categories, filteredSubjects: filtered };
  }, [subjects, searchQuery, selectedCategory]);

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
      {/* SEO Head for homepage */}
      <SEOHead
        title="Brainliest - Comprehensive Practice Exams for Professional Certification"
        description="Master your certification exams with our comprehensive practice tests. Featuring PMP, AWS, CompTIA, and 40+ subjects with expert-designed questions and detailed explanations."
        type="homepage"
        keywords={[
          'certification exams', 'practice tests', 'PMP', 'AWS', 'CompTIA', 
          'exam preparation', 'professional certification', 'study guide',
          'test prep', 'online practice exams', 'certification training'
        ]}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Certification Path</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Select from our comprehensive collection of practice exams designed to help you succeed in your certification journey.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {stats ? stats.subjects : (subjects?.length || 0)}
              </div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {stats ? stats.exams : '500+'}
              </div>
              <div className="text-sm text-gray-600">Exams</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {stats ? `${stats.questions.toLocaleString()}` : '10K+'}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {stats ? `${stats.successRate}%` : '95%'}
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search subjects, certifications, or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="certifications">Professional Certifications</SelectItem>
                <SelectItem value="university">University & College</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedCategory !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          
          {searchQuery && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {filteredSubjects.length} result{filteredSubjects.length !== 1 ? 's' : ''} found for "{searchQuery}"
              </p>
            </div>
          )}
          
          {/* Browse Categories Button */}
          <div className="mt-4 text-center">
            <Link href="/categories">
              <Button variant="outline" className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-gray-700 hover:text-gray-900">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse All Categories
              </Button>
            </Link>
          </div>
        </div>

        {/* Trending Certifications Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Trending Certifications</h3>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(trendingCerts ? trendingCerts : [
              { name: 'PMP Certification', trend: '+15%', searchTerm: 'pmp' },
              { name: 'AWS Cloud Practitioner', trend: '+23%', searchTerm: 'aws' },
              { name: 'CompTIA Security+', trend: '+18%', searchTerm: 'comptia' },
              { name: 'Azure Fundamentals', trend: '+12%', searchTerm: 'azure' }
            ]).map((cert: any) => {
              // Get appropriate icon based on subject name
              const getIconForSubject = (name: string) => {
                const nameLower = name.toLowerCase();
                if (nameLower.includes('pmp')) return PMPIcon;
                if (nameLower.includes('aws')) return AWSIcon;
                if (nameLower.includes('comptia')) return CompTIAIcon;
                if (nameLower.includes('azure') || nameLower.includes('microsoft')) return AzureIcon;
                return BookOpen; // Default icon
              };
              
              const IconComponent = getIconForSubject(cert.name);
              
              return (
                <div 
                  key={cert.name}
                  className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => {
                    setSearchQuery(cert.searchTerm);
                    setSelectedCategory("certifications");
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className="w-8 h-8" />
                    <Badge variant="outline" className="text-xs text-green-600">
                      {cert.trend}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                    {cert.name}
                  </span>
                </div>
              );
            })}
          </div>
          

        </div>

        {/* Category Sections */}
        {!searchQuery && selectedCategory === "all" ? (
          <div className="space-y-12">
            {Object.entries(categoryConfig).map(([categoryKey, config]) => {
              const categorySubjects = categorizedSubjects[categoryKey] || [];
              if (categorySubjects.length === 0) return null;

              const IconComponent = config.icon;
              
              return (
                <div key={categoryKey}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{config.title}</h3>
                        <p className="text-gray-600">{config.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex">
                      {categorySubjects.length} subject{categorySubjects.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {/* Category Pagination and Filter Controls */}
                  {(() => {
                    const currentPageNum = getCurrentPage(categoryKey);
                    const categoryItemsPerPage = getItemsPerPage(categoryKey);
                    const totalPages = Math.ceil(categorySubjects.length / categoryItemsPerPage);
                    const startIndex = (currentPageNum - 1) * categoryItemsPerPage;
                    const endIndex = startIndex + categoryItemsPerPage;
                    const paginatedSubjects = categorySubjects.slice(startIndex, endIndex);
                    
                    return (
                      <>
                        {categorySubjects.length > 6 && (
                          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">Show:</span>
                              <Select 
                                value={categoryItemsPerPage.toString()} 
                                onValueChange={(value) => {
                                  setItemsPerPageForCategory(categoryKey, parseInt(value));
                                  setCurrentPageForCategory(categoryKey, 1); // Reset to first page
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(endIndex, categorySubjects.length)} of {categorySubjects.length}
                              </span>
                            </div>
                            
                            {totalPages > 1 && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPageForCategory(categoryKey, currentPageNum - 1)}
                                  disabled={currentPageNum === 1}
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Previous
                                </Button>
                                
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                      page === 1 ||
                                      page === totalPages ||
                                      (page >= currentPageNum - 1 && page <= currentPageNum + 1)
                                    ) {
                                      return (
                                        <Button
                                          key={page}
                                          variant={page === currentPageNum ? "default" : "outline"}
                                          size="sm"
                                          className="w-8 h-8 p-0"
                                          onClick={() => setCurrentPageForCategory(categoryKey, page)}
                                        >
                                          {page}
                                        </Button>
                                      );
                                    } else if (
                                      page === currentPageNum - 2 ||
                                      page === currentPageNum + 2
                                    ) {
                                      return (
                                        <span key={page} className="px-2 text-gray-400">
                                          ...
                                        </span>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPageForCategory(categoryKey, currentPageNum + 1)}
                                  disabled={currentPageNum === totalPages}
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {paginatedSubjects.map((subject) => (
                            <SubjectCard 
                              key={subject.id} 
                              subject={subject} 
                              onClick={() => handleSelectSubject(subject)}
                            />
                          ))}
                        </div>
                        

                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        ) : (
          // Filtered Results
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {searchQuery ? "Search Results" : "Filtered Results"}
            </h3>
            {filteredSubjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSubjects.map((subject) => (
                  <SubjectCard 
                    key={subject.id} 
                    subject={subject} 
                    onClick={() => handleSelectSubject(subject)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                <p className="text-gray-600">Try adjusting your search or browse by category.</p>
              </div>
            )}
          </div>
        )}

        {/* Browse by Category Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryConfig).map(([categoryKey, config]) => {
              const IconComponent = config.icon;
              const categorySubjects = categorizedSubjects[categoryKey] || [];
              
              return (
                <Button
                  key={categoryKey}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    setSelectedCategory(categoryKey);
                    setSearchQuery("");
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{config.title}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {categorySubjects.length}
                  </Badge>
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
            >
              <span>View All Subjects</span>
            </Button>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
