"use client"; // Fixed: RSC directive for Vercel compatibility

import { Link } from "wouter";
import { categoryStructure, type Category } from "../../../../../shared/constants";
import { Header, Footer, SEOHead } from "../../shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { ArrowRight, BookOpen } from "lucide-react";
import { DynamicIcon } from "../../../utils/dynamic-icon";

export default function CategoriesPage() {
  // Fixed: Generate dynamic SEO keywords from categoryStructure
  const seoKeywords = categoryStructure.flatMap(category => [
    category.title,
    ...category.subCategories.map(sub => sub.title)
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed: Added SEO integration */}
      <SEOHead
        title="Subject Categories - Exam Preparation | Brainliest"
        description="Explore exam preparation materials organized by professional, academic, and test prep categories. Find your certification and study materials."
        keywords={[
          'exam categories', 'certification subjects', 'academic categories', 'test preparation',
          'professional certifications', 'university subjects', 'exam materials',
          ...seoKeywords
        ]}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Subject Categories</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive collection of exam preparation materials organized by category
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categoryStructure.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Fixed: Reusable styled link component to reduce duplication
function StyledLink({ href, className, children, ariaLabel }: { 
  href: string; 
  className?: string; 
  children: React.ReactNode; 
  ariaLabel?: string; 
}) {
  // Fixed: Route validation for slug-based routing
  if (!href || href === '' || href === '#') {
    console.warn('Invalid route detected:', href);
    return <div className={className}>{children}</div>;
  }

  return (
    <Link href={href} aria-label={ariaLabel}>
      <div className={className}>
        {children}
      </div>
    </Link>
  );
}

function CategoryCard({ category }: { category: Category }) {
  // Fixed: Enhanced field validation with fallback values
  const validatedCategory = {
    ...category,
    title: category.title || 'Unknown Category',
    description: category.description || 'Category description not available',
    icon: category.icon || 'book-open',
    route: category.route || '#',
    subCategories: category.subCategories || []
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {/* Fixed: DynamicIcon validation with fallback */}
            <DynamicIcon 
              name={validatedCategory.icon} 
              className="w-6 h-6 text-primary"
            />
          </div>
          <div>
            <CardTitle className="text-xl">{validatedCategory.title}</CardTitle>
            <CardDescription>{validatedCategory.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          {/* Fixed: Handle empty subcategories */}
          {validatedCategory.subCategories.length > 0 ? (
            validatedCategory.subCategories.map((subCategory) => {
              // Fixed: Enhanced subcategory validation
              const validatedSubCategory = {
                ...subCategory,
                title: subCategory.title || 'Unknown Subcategory',
                description: subCategory.description || 'Subcategory description not available',
                icon: subCategory.icon || 'book-open',
                route: subCategory.route || '#'
              };

              return (
                <StyledLink 
                  key={subCategory.id} 
                  href={validatedSubCategory.route}
                  ariaLabel={`Navigate to ${validatedSubCategory.title} subcategory`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      {/* Fixed: DynamicIcon validation with fallback for subcategories */}
                      <DynamicIcon 
                        name={validatedSubCategory.icon} 
                        className="w-4 h-4 text-gray-600"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {validatedSubCategory.title}
                      </h4>
                      <p className="text-sm text-gray-600">{validatedSubCategory.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </StyledLink>
              );
            })
          ) : (
            /* Fixed: Empty subcategories handling */
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">No subcategories available</p>
            </div>
          )}
        </div>
        
        {/* Fixed: Enhanced accessibility and route validation for "View All" link */}
        <StyledLink 
          href={validatedCategory.route}
          ariaLabel={`View all subjects in ${validatedCategory.title} category`}
          className="w-full bg-primary text-white text-center py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer block"
        >
          View All {validatedCategory.title}
        </StyledLink>
      </CardContent>
    </Card>
  );
}