import { Switch, Route } from "wouter";
import { queryClient } from "./services/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./features/auth/AuthContext";
import { QuestionLimitProvider } from "./features/shared/QuestionLimitContext";
import Home from "./features/pages/home";
import AllSubjects from "./features/content/pages/all-subjects";
import ExamSelection from "./features/exam/pages/exam-selection";
import QuestionInterface from "./features/exam/pages/question-interface";
import Results from "./features/exam/pages/results";
import Analytics from "./features/analytics/pages/analytics";
import AdminSimple from "./features/admin/pages/admin-simple";
import AdminClean from "./features/admin/pages/admin-clean";
import AdminSecure from "./features/admin/pages/admin-secure";
import Settings from "./features/pages/settings";
import CookieSettings from "./features/pages/cookie-settings";
import OurStory from "./features/pages/static/our-story";
import PrivacyPolicy from "./features/pages/static/privacy-policy";
import TermsOfService from "./features/pages/static/terms-of-service";
import Contact from "./features/pages/static/contact";
import Categories from "./features/content/pages/categories";
import CategoryDetail from "./features/content/pages/category-detail";
import AuthCallback from "./features/auth/pages/auth-callback";
import NotFound from "./features/pages/static/not-found";
import { CookieConsentBanner } from "./features/shared";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/subjects" component={AllSubjects} />
      <Route path="/categories" component={Categories} />
      <Route path="/categories/:categoryId">
        {(params) => <CategoryDetail categoryId={params.categoryId} />}
      </Route>
      <Route path="/categories/:categoryId/:subCategoryId">
        {(params) => <CategoryDetail categoryId={params.categoryId} subCategoryId={params.subCategoryId} />}
      </Route>
      <Route path="/subject/:id" component={ExamSelection} />
      <Route path="/exam/:id" component={QuestionInterface} />
      <Route path="/results/:id" component={Results} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={AdminSecure} />
      <Route path="/admin-simple" component={AdminSimple} />
      <Route path="/settings" component={Settings} />
      <Route path="/cookie-settings" component={CookieSettings} />
      <Route path="/our-story" component={OurStory} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/contact" component={Contact} />
      <Route path="/auth/callback" component={AuthCallback} />
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
            <CookieConsentBanner />
          </TooltipProvider>
        </QuestionLimitProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
