import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, BookOpen, Clock, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { Subject } from "@shared/schema";

// Category configuration
const categoryConfig = {
  professional: {
    label: "Professional Certifications",
    keywords: ["pmp", "aws", "azure", "google cloud", "comptia", "cisco", "vmware", "oracle", "microsoft", "salesforce", "kubernetes", "docker", "devops"],
    color: "blue",
    icon: "💼"
  },
  academic: {
    label: "University & College",
    keywords: ["mathematics", "statistics", "calculus", "algebra", "physics", "chemistry", "biology", "computer science", "engineering", "nursing", "medical", "business", "economics", "accounting", "psychology", "history", "english", "writing"],
    color: "green",
    icon: "🎓"
  },
  test_prep: {
    label: "Test Preparation",
    keywords: ["gre", "lsat", "toefl", "ged", "hesi", "teas", "sat", "act"],
    color: "purple",
    icon: "📝"
  },
  other: {
    label: "Other Subjects",
    keywords: [],
    color: "gray",
    icon: "📚"
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

interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const category = getCategoryForSubject(subject);
  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/20 h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-12 h-12 rounded-xl bg-${categoryInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
              <span className="text-xl">{subject.icon || categoryInfo.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                {subject.name}
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
          {subject.description || "Comprehensive practice questions and study materials"}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>{subject.examCount || 0} exams</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{subject.questionCount || 0} questions</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>4.8</span>
          </div>
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

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const handleSelectSubject = (subjectId: number) => {
    setLocation(`/subject/${subjectId}`);
  };

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
    
    // Sort subjects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "exams":
          return (b.examCount || 0) - (a.examCount || 0);
        case "questions":
          return (b.questionCount || 0) - (a.questionCount || 0);
        case "popular":
          return b.id - a.id; // Newer subjects first as proxy for popularity
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [subjects, searchQuery, selectedCategory, sortBy]);

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            All Subjects
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive collection of {subjects?.length || 0} subjects covering professional certifications, 
            academic courses, and test preparation materials.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{subjects?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Subjects</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {subjects?.reduce((sum, s) => sum + (s.examCount || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Practice Exams</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {subjects?.reduce((sum, s) => sum + (s.questionCount || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Practice Questions</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(categorizedSubjects).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
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
          </div>
          
          {/* Active Filters */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery("")}
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
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
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
            Showing {filteredAndSortedSubjects.length} of {subjects?.length || 0} subjects
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory !== "all" && ` in ${categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}`}
          </p>
        </div>

        {/* Subjects Grid */}
        {filteredAndSortedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedSubjects.map((subject) => (
              <SubjectCard 
                key={subject.id} 
                subject={subject} 
                onClick={() => handleSelectSubject(subject.id)}
              />
            ))}
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
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              Show All Subjects
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}