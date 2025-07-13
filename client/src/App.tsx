import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "./components/ui/toaster";
import { UnifiedIconProvider } from "./components/icons/unified-icon-system";
import {
  SecuredAuthProvider,
  ProtectedAdminRoute,
} from "./features/auth/secured-auth-system";
import { QuestionLimitProvider } from "./features/shared/QuestionLimitContext";
import Home from "./features/pages/home";
import AllSubjects from "./features/content/pages/all-subjects";
import Categories from "./features/content/pages/categories";
import CategoryDetail from "./features/content/pages/category-detail";
import SubcategoryDetail from "./features/content/pages/subcategory-detail";
import ExamSelection from "./features/exam/components/exam-selection";
import QuestionInterface from "./features/exam/components/question-interface";
import Results from "./features/exam/components/results";
import Analytics from "./features/analytics/analytics";
import AdminSimple from "./features/admin/components/admin-simple";
import Settings from "./features/pages/settings";
import CookieSettings from "./features/pages/cookie-settings";
import OurStory from "./features/pages/static/our-story";
import PrivacyPolicy from "./features/pages/static/privacy-policy";
import TermsOfService from "./features/pages/static/terms-of-service";
import Contact from "./features/pages/static/contact";
import NotFound from "./features/pages/static/not-found";
import AuthCallback from "./features/auth/auth-callback";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

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
        {(params) => (
          <CategoryDetail
            categoryId={params.categoryId}
            subCategoryId={params.subCategoryId}
          />
        )}
      </Route>
      {/* Subcategory detail page */}
      <Route path="/subcategory/:subcategorySlug">
        {(params) => (
          <SubcategoryDetail subcategorySlug={params.subcategorySlug} />
        )}
      </Route>
      {/* Slug-based routes (primary) */}
      <Route path="/subject/:slug" component={ExamSelection} />
      <Route path="/exam/:slug" component={QuestionInterface} />
      <Route path="/results/:slug" component={Results} />

      {/* Backup ID-based routes for backward compatibility */}
      <Route path="/subject/id/:id" component={ExamSelection} />
      <Route path="/exam/id/:id" component={QuestionInterface} />
      <Route path="/results/id/:id" component={Results} />

      <Route path="/analytics" component={Analytics} />

      {/* Protected admin route with proper authorization */}
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
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedIconProvider>
        <SecuredAuthProvider>
          <QuestionLimitProvider>
            <Router />
            <Toaster />
          </QuestionLimitProvider>
        </SecuredAuthProvider>
      </UnifiedIconProvider>
    </QueryClientProvider>
  );
}
