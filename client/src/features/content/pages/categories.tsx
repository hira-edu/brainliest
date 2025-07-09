import { Link } from "wouter";
import { categoryStructure, type Category } from "../../../../../shared/constants";
import { Header, Footer } from "../../shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { ArrowRight, BookOpen } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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

function CategoryCard({ category }: { category: Category }) {
  const IconComponent = category.icon;
  
  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">{category.title}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          {category.subCategories.map((subCategory) => {
            const SubIconComponent = subCategory.icon;
            return (
              <Link key={subCategory.id} href={subCategory.route}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <SubIconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {subCategory.title}
                      </h4>
                      <p className="text-sm text-gray-600">{subCategory.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
        
        <Link href={category.route}>
          <div className="w-full bg-primary text-white text-center py-2 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
            View All {category.title}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}