import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Subject } from "@shared/schema";
import { categoryStructure, getCategoryForSubject } from "@shared/constants";
import SubjectCard from "../components/subject-card";
import { Header, Footer } from "../../shared";
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
import { Search, ArrowLeft, Filter } from "lucide-react";

interface CategoryDetailPageProps {
  categoryId?: string;
  subCategoryId?: string;
}

export default function CategoryDetailPage({ categoryId, subCategoryId }: CategoryDetailPageProps) {
  // No redirect logic - using Link components directly
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
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

  const filteredSubjects = useMemo(() => {
    if (!subjects || !categoryData) return [];
    
    let filtered = subjects.filter(subject => {
      const subjectCategory = getCategoryForSubject(subject.name);
      if (!subjectCategory) return false;
      
      if (categoryData.subCategory) {
        return subjectCategory.subCategory.id === categoryData.subCategory.id;
      } else {
        return subjectCategory.category.id === categoryData.category.id;
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
  }, [subjects, categoryData, searchQuery, sortBy]);

  // No redirect functions needed - using Link components directly

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
  const IconComponent = currentCategory.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <Link href={categoryData?.subCategory ? categoryData.category.route : "/categories"}>
            <Button
              variant="ghost"
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back {subCategory ? `to ${category.title}` : "to Categories"}
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentCategory.title}</h1>
              <p className="text-gray-600 mt-1">{currentCategory.description}</p>
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
                const SubIconComponent = subCat.icon;
                return (
                  <Link key={subCat.id} href={subCat.route}>
                    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <SubIconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-medium text-gray-900">{subCat.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{subCat.description}</p>
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
                onClick={() => setSearchQuery("")}
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
              <Link key={subject.id} href={`/subject/${subject.slug}`}>
                <SubjectCard 
                  subject={subject} 
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 
                "Try adjusting your search terms or browse other categories." :
                "No subjects are available in this category yet."
              }
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")}>
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