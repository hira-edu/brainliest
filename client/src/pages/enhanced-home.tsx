import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Subject } from "@shared/schema";
import { Header } from "./features/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  BookOpen, 
  Award, 
  GraduationCap, 
  Briefcase,
  TrendingUp,
  Users,
  Clock,
  Star
} from "lucide-react";

const categoryConfig = {
  certifications: {
    title: "Professional Certifications",
    description: "Industry-recognized certifications for career advancement",
    icon: Award,
    keywords: ["certification", "aws", "pmp", "comptia", "cisco", "microsoft", "azure", "ccna"]
  },
  computer_science: {
    title: "Computer Science",
    description: "Programming, algorithms, and software engineering",
    icon: BookOpen,
    keywords: ["computer", "programming", "data structures", "algorithms", "software"]
  },
  mathematics: {
    title: "Mathematics & Sciences",
    description: "Mathematical concepts and scientific principles",
    icon: GraduationCap,
    keywords: ["mathematics", "physics", "chemistry", "biology", "calculus", "algebra"]
  },
  business: {
    title: "Business & Economics",
    description: "Business administration and economic principles",
    icon: Briefcase,
    keywords: ["business", "economics", "management", "finance", "marketing"]
  },
  engineering: {
    title: "Engineering",
    description: "Engineering disciplines and technical subjects",
    icon: TrendingUp,
    keywords: ["engineering", "mechanical", "electrical", "civil"]
  },
  medical: {
    title: "Health & Medical",
    description: "Medical sciences and healthcare subjects",
    icon: Users,
    keywords: ["medical", "biology", "anatomy", "physiology", "health"]
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

function SubjectCard({ subject, onSelect }: { subject: Subject; onSelect: (id: number) => void }) {
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full"
      onClick={() => onSelect(subject.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform`}>
            <i className={`${subject.icon} text-blue-600 text-xl`}></i>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {subject.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-gray-600 mb-4">
          {subject.description}
        </CardDescription>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Practice
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          </div>
          <span className="text-primary text-sm font-medium group-hover:underline">
            Start →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EnhancedHome() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  const filteredSubjects = useMemo(() => {
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
    
    return filtered;
  }, [subjects, searchQuery, selectedCategory]);

  const popularSubjects = subjects?.slice(0, 6) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">
              ExamPractice Pro
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Master your exams with our comprehensive practice platform. From professional certifications to university courses, we've got you covered.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search subjects, certifications, or courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg bg-white text-gray-900 rounded-xl shadow-lg border-0 focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{subjects?.length || 0}</div>
            <div className="text-sm text-gray-600">Subjects Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">500+</div>
            <div className="text-sm text-gray-600">Practice Exams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">10K+</div>
            <div className="text-sm text-gray-600">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">95%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="categories" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="all">All Subjects</TabsTrigger>
          </TabsList>

          {/* Categories View */}
          <TabsContent value="categories" className="space-y-8">
            {Object.entries(categoryConfig).map(([categoryKey, config]) => {
              const categorySubjects = categorizedSubjects[categoryKey] || [];
              if (categorySubjects.length === 0) return null;

              const IconComponent = config.icon;
              
              return (
                <div key={categoryKey} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{config.title}</h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categorySubjects.slice(0, 4).map((subject) => (
                      <SubjectCard key={subject.id} subject={subject} onSelect={handleSelectSubject} />
                    ))}
                  </div>
                  
                  {categorySubjects.length > 4 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => setSelectedCategory(categoryKey)}>
                        View All {config.title} ({categorySubjects.length})
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          {/* Popular Subjects */}
          <TabsContent value="popular">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Most Popular Subjects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularSubjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} onSelect={handleSelectSubject} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* All Subjects with Search */}
          <TabsContent value="all">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  All Subjects {searchQuery && `(${filteredSubjects.length} results)`}
                </h3>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
              
              {filteredSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSubjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} onSelect={handleSelectSubject} />
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}