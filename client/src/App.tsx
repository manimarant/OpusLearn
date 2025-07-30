import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import CoursePreview from "@/pages/course-preview";
import CourseBuilder from "@/pages/course-builder";
import Discussions from "@/pages/discussions";
import Assignments from "@/pages/assignments";
import Quizzes from "@/pages/quizzes";
import QuizDetail from "@/pages/quiz-detail";
import Settings from "@/pages/settings";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Router />
      </div>
    </QueryClientProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Show loading state only on initial load, not on navigation
  const isPreviewRoute = window.location.pathname.includes('/preview');
  const isInitialLoad = !sessionStorage.getItem('app-initialized');
  
  // Force authentication check for course detail pages
  const isCourseDetailPage = window.location.pathname.match(/^\/courses\/\d+$/);
  const shouldForceAuth = isCourseDetailPage && !isAuthenticated && !isLoading;
  

  
  if (isLoading && !isPreviewRoute && isInitialLoad) {
    // Mark as initialized after first load
    sessionStorage.setItem('app-initialized', 'true');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Preview route is always available */}
      <Route path="/courses/:id/preview" component={CoursePreview} />
      
      {/* Landing page is always the default */}
      <Route path="/" component={Landing} />
      
      {/* Common routes available to both authenticated and unauthenticated users */}
      <Route path="/courses" component={Courses} />
      
      {/* Authenticated routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/course-builder/:id?" component={CourseBuilder} />
      <Route path="/discussions" component={Discussions} />
      <Route path="/assignments" component={Assignments} />
      <Route path="/quizzes" component={Quizzes} />
      <Route path="/quizzes/:id" component={QuizDetail} />
      <Route path="/settings" component={Settings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}
