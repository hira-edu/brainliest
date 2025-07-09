import { Switch, Route } from "wouter";
import { queryClient } from "./services/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./features/auth/AuthContext";
import { AdminProvider } from "./features/admin/components/AdminContext";
import { QuestionLimitProvider } from "./features/shared/QuestionLimitContext";
import Home from "./features/pages/home";
import AllSubjects from "./features/content/pages/all-subjects";
import ExamSelection from "./features/exam/components/exam-selection";
import QuestionInterface from "./features/exam/components/question-interface";
import Results from "./features/exam/components/results";
import Analytics from "./features/analytics/analytics";
import AdminSimple from "./features/admin/components/admin-simple";
import { ProtectedAdminRoute } from "./features/admin/components/ProtectedAdminRoute";
import Settings from "./features/pages/settings";
import CookieSettings from "./features/pages/cookie-settings";
import OurStory from "./features/pages/static/our-story";
import PrivacyPolicy from "./features/pages/static/privacy-policy";
import TermsOfService from "./features/pages/static/terms-of-service";
import Contact from "./features/pages/static/contact";
import Categories from "./features/content/pages/categories";
import CategoryDetail from "./features/content/pages/category-detail";
import AuthCallback from "./features/auth/auth-callback";
import NotFound from "./features/pages/static/not-found";
import { CookieConsentBanner } from "./features/shared";
import { IconProvider } from "./components/icons";
import { lazy } from "react";

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
      {/* New slug-based routes */}
      <Route path="/subject/:slug" component={ExamSelection} />
      <Route path="/exam/:slug" component={QuestionInterface} />
      <Route path="/results/:slug" component={Results} />
      
      {/* Backup ID-based routes for backward compatibility */}
      <Route path="/subject/id/:id" component={ExamSelection} />
      <Route path="/exam/id/:id" component={QuestionInterface} />
      <Route path="/results/id/:id" component={Results} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin">
        {() => (
          <ProtectedAdminRoute>
            <AdminSimple />
          </ProtectedAdminRoute>
        )}
      </Route>
      <Route path="/settings" component={Settings} />
      <Route path="/cookie-settings" component={CookieSettings} />
      <Route path="/our-story" component={OurStory} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/contact" component={Contact} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/icon-test">
        {() => {
          const IconTestPage = lazy(() => import("./pages/icon-test").then(m => ({ default: m.IconTestPage })));
          return <IconTestPage />;
        }}
      </Route>
      <Route path="/icon-performance">
        {() => {
          const IconPerformanceTestPage = lazy(() => import("./pages/icon-performance-test"));
          return <IconPerformanceTestPage />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IconProvider>
        <AuthProvider>
          <AdminProvider>
            <QuestionLimitProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <CookieConsentBanner />
              </TooltipProvider>
            </QuestionLimitProvider>
          </AdminProvider>
        </AuthProvider>
      </IconProvider>
    </QueryClientProvider>
  );
}

export default App;
