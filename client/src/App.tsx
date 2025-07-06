import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/home";
import ExamSelection from "@/pages/exam-selection";
import QuestionInterface from "@/pages/question-interface";
import Results from "@/pages/results";
import Analytics from "@/pages/analytics";
import AdminSimple from "@/pages/admin-simple";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/subject/:id" component={ExamSelection} />
      <Route path="/exam/:id" component={QuestionInterface} />
      <Route path="/results/:id" component={Results} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={AdminSimple} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
