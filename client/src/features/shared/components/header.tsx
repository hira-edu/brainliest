import { useAuthContext } from "../../auth/AuthContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import UnifiedAuthModal from "../../auth/components/unified-auth-modal";
import { useState } from "react";
import { 
  ChevronDown, 
  Home, 
  BarChart3, 
  BookOpen, 
  Award, 
  User,
  Settings,
  LogOut,
  Menu,
  GraduationCap
} from "lucide-react";

export default function Header() {
  const { isSignedIn, userName, signOut } = useAuthContext();
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/categories", label: "Categories", icon: BookOpen },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const subjectCategories = [
    { label: "Professional Certifications", icon: Award, items: ["PMP", "AWS", "CompTIA", "Cisco", "Microsoft"] },
    { label: "Computer Science", icon: BookOpen, items: ["Programming", "Data Structures", "Algorithms"] },
    { label: "University Subjects", icon: GraduationCap, items: ["Mathematics", "Physics", "Chemistry", "Biology"] },
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Main Navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-primary flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span>Brainliest</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={`flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors ${
                      location === item.href ? "text-primary" : "text-gray-700"
                    }`}>
                      <IconComponent className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Subjects Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-primary">
                      Subjects
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Subject Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {subjectCategories.map((category) => {
                      const CategoryIcon = category.icon;
                      return (
                        <div key={category.label}>
                          <DropdownMenuItem className="font-medium">
                            <CategoryIcon className="w-4 h-4 mr-2" />
                            {category.label}
                          </DropdownMenuItem>
                          {category.items.map((item) => (
                            <DropdownMenuItem key={item} className="pl-8 text-sm text-gray-600">
                              {item}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </div>
                      );
                    })}
                    <DropdownMenuItem 
                      className="font-medium text-primary"
                      onClick={() => window.location.href = "/subjects"}
                    >
                      View All Subjects →
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  {/* Quick Stats Badge */}
                  <Badge variant="secondary" className="hidden sm:flex">
                    Welcome back!
                  </Badge>
                  
                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="hidden sm:block text-sm font-medium">{userName}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/analytics" className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        location === item.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      <UnifiedAuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
