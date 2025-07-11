import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseBuilder from "@/pages/course-builder";
import Discussions from "@/pages/discussions";
import Assignments from "@/pages/assignments";
import Analytics from "@/pages/analytics";

// Create the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/courses" component={Courses} />
          <Route path="/course-builder/:id?" component={CourseBuilder} />
          <Route path="/discussions" component={Discussions} />
          <Route path="/assignments" component={Assignments} />
          <Route path="/analytics" component={Analytics} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;
