import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuestionLimitProvider } from "@/contexts/QuestionLimitContext";
import Home from "@/pages/home";
import ExamSelection from "@/pages/exam-selection";
import QuestionInterface from "@/pages/question-interface";
import Results from "@/pages/results";
import Analytics from "@/pages/analytics";
import AdminSimple from "@/pages/admin-simple";
import AdminClean from "@/pages/admin-clean";
import Settings from "@/pages/settings";
import OurStory from "@/pages/our-story";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Contact from "@/pages/contact";
import CategoriesPage from "@/pages/categories";
import CategoryDetailPage from "@/pages/category-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/categories/:categoryId">
        {(params) => <CategoryDetailPage categoryId={params.categoryId} />}
      </Route>
      <Route path="/categories/:categoryId/:subCategoryId">
        {(params) => <CategoryDetailPage categoryId={params.categoryId} subCategoryId={params.subCategoryId} />}
      </Route>
      <Route path="/subject/:id" component={ExamSelection} />
      <Route path="/exam/:id" component={QuestionInterface} />
      <Route path="/results/:id" component={Results} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={AdminSimple} />
      <Route path="/admin-simple" component={AdminSimple} />
      <Route path="/settings" component={Settings} />
      <Route path="/our-story" component={OurStory} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuestionLimitProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QuestionLimitProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
