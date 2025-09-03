import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CourseCard from "@/components/course/course-card";
import ProgressChart from "@/components/progress/progress-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Star, MessageSquare, FileText, Award, Sparkles, Zap, Target, Clock, Plus, Grid3X3, List, Copy, Download, Eye, BarChart3, Library, Video, Pin, MoreHorizontal } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pinnedMetrics, setPinnedMetrics] = useState<string[]>([]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: courses } = useQuery({
    queryKey: ["api", "courses"],
    enabled: !!user,
  });

  const { data: analytics } = useQuery({
    queryKey: ["api", "analytics", "instructional-designer"],
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["api", "notifications"],
    enabled: !!user,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="saas-main flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="saas-main">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header with Layout Toggle */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold text-foreground">
                Dashboard
              </h2>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="saas-button-secondary"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="saas-button-secondary"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Create engaging courses, track learner progress, and leverage AI-powered tools to enhance learning outcomes
            </p>
          </div>

          {/* Creation Shortcuts */}
          <div className="mb-8 animate-slide-up">
            <Card className="saas-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      // Navigate to course builder
                      window.location.href = '/course-builder';
                    }}
                  >
                    <Plus className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">New Course</div>
                      <div className="text-xs opacity-90">Create from scratch</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => {
                      toast({
                        title: "Duplicate Course",
                        description: "Select a course to duplicate from the list below.",
                      });
                    }}
                  >
                    <Copy className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Duplicate</div>
                      <div className="text-xs opacity-70">Copy existing course</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => {
                      toast({
                        title: "Import Course",
                        description: "Import functionality coming soon!",
                      });
                    }}
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Import</div>
                      <div className="text-xs opacity-70">Upload course files</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Cycle Status */}
          <div className="mb-8 animate-slide-up">
            <Card className="saas-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span>Review Cycle Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Unresolved Comments</span>
                      </div>
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
                        3 pending
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Comments requiring your attention across all courses
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Awaiting Sign-off</span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        2 versions
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Course versions ready for final approval
                    </div>
                  </div>
                </div>
                

              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Courses List/Tiles */}
            <div className="xl:col-span-3">
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                      <span>Course List</span>
                    </CardTitle>
                      <Button variant="ghost" size="sm" className="saas-button-ghost" onClick={() => window.location.href = '/courses'}>
                        View All →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                  {courses && courses.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                      {courses.slice(0, 6).map((course: any) => (
                        <div key={course.id} className={`${viewMode === 'grid' ? 'group rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer bg-white' : 'flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-white'}`} onClick={() => window.location.href = `/course-builder/${course.id}`}>
                          {viewMode === 'grid' ? (
                            <>
                              {/* Grid View */}
                              <div className="relative mb-4">
                                <div className="w-full h-32 rounded-lg overflow-hidden">
                                  <img 
                                    src={(() => {
                                      const title = course.title.toLowerCase();
                                      const imageMap = {
                                        // AI/Machine Learning
                                        'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&auto=format&q=80',
                                        'artificial': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop&auto=format&q=80',
                                        'machine': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'learning': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'neural': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'deep': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Web Development
                                        'web': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'html': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'css': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'javascript': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'react': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'angular': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        'vue': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Cloud/DevOps
                                        'cloud': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&auto=format&q=80',
                                        'aws': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&auto=format&q=80',
                                        'azure': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&auto=format&q=80',
                                        'docker': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=400&h=200&fit=crop&auto=format&q=80',
                                        'kubernetes': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=400&h=200&fit=crop&auto=format&q=80',
                                        'devops': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Data Science
                                        'data': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format&q=80',
                                        'analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format&q=80',
                                        'python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop&auto=format&q=80',
                                        'sql': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format&q=80',
                                        'database': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Mobile Development
                                        'mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'android': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'ios': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&auto=format&q=80',
                                        'flutter': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Cybersecurity
                                        'security': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop&auto=format&q=80',
                                        'cyber': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop&auto=format&q=80',
                                        'hack': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop&auto=format&q=80',
                                        
                                        // Default programming
                                        'default': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop&auto=format&q=80'
                                      };
                                      
                                      for (const [keyword, imageUrl] of Object.entries(imageMap)) {
                                        if (title.includes(keyword)) {
                                          return imageUrl;
                                        }
                                      }
                                      return imageMap.default;
                                    })()}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center hidden">
                                    <BookOpen className="h-8 w-8 text-gray-400" />
                                  </div>
                                </div>
                                <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800">
                                  {course.status || 'Draft'}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium text-foreground line-clamp-2">{course.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Updated {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>{Math.floor(Math.random() * 20) + 5} lessons</span>
                                  {course.instructorId !== user?.id && (
                                    <div className="flex items-center space-x-1">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs">JD</AvatarFallback>
                                      </Avatar>
                                      <span>Shared</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                                                            {/* List View */}
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={(() => {
                                    const title = course.title.toLowerCase();
                                    const imageMap = {
                                      // AI/Machine Learning
                                      'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop&auto=format&q=80',
                                      'artificial': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop&auto=format&q=80',
                                      'machine': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'learning': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'neural': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'deep': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Web Development
                                      'web': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'html': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'css': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'javascript': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'react': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'angular': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      'vue': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Cloud/DevOps
                                      'cloud': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop&auto=format&q=80',
                                      'aws': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop&auto=format&q=80',
                                      'azure': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop&auto=format&q=80',
                                      'docker': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=100&h=100&fit=crop&auto=format&q=80',
                                      'kubernetes': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=100&h=100&fit=crop&auto=format&q=80',
                                      'devops': 'https://images.unsplash.com/photo-1605745341112-85968b19335a?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Data Science
                                      'data': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&auto=format&q=80',
                                      'analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&auto=format&q=80',
                                      'python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=100&h=100&fit=crop&auto=format&q=80',
                                      'sql': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&auto=format&q=80',
                                      'database': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Mobile Development
                                      'mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'android': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'ios': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop&auto=format&q=80',
                                      'flutter': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Cybersecurity
                                      'security': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&auto=format&q=80',
                                      'cyber': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&auto=format&q=80',
                                      'hack': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&auto=format&q=80',
                                      
                                      // Default programming
                                      'default': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop&auto=format&q=80'
                                    };
                                    
                                    for (const [keyword, imageUrl] of Object.entries(imageMap)) {
                                      if (title.includes(keyword)) {
                                        return imageUrl;
                                      }
                                    }
                                    return imageMap.default;
                                  })()}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center hidden">
                                  <BookOpen className="h-6 w-6 text-gray-400" />
                                </div>
                              </div>
                        <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">{course.title}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {course.status || 'Draft'}
                                  </Badge>
                                </div>
                          <p className="text-sm text-muted-foreground">
                                  Updated {new Date(course.updatedAt || course.createdAt).toLocaleDateString()} • {Math.floor(Math.random() * 20) + 5} lessons
                                </p>
                                {course.instructorId !== user?.id && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-xs">JD</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">Shared by John Doe</span>
                                  </div>
                                )}
                        </div>
                              <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                            </>
                          )}
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        "No courses created yet"
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        "Get started by creating your first course"
                      </p>
                      <Button className="saas-button-primary" onClick={() => window.location.href = '/course-builder/'}>
                        <Plus className="h-4 w-4 mr-2" />
                        "Create Course"
                          </Button>
                    </div>
                  )}
                  </CardContent>
                </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Shared With Me */}
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Shared Content</span>
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-3">
                    {[
                      { title: "Advanced React Patterns", owner: "Sarah Johnson", date: "2 days ago" },
                      { title: "Design Systems 101", owner: "Mike Chen", date: "1 week ago" }
                    ].map((course, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{course.owner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">by {course.owner} • {course.date}</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-primary">
                      View all shared courses →
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              {/* Switch Apps */}
              <Card className="saas-card animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Switch Apps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => toast({ title: "Feature Coming Soon", description: "Review app will be available soon." })}>
                      <Eye className="h-4 w-4 mr-3" />
                      Review
                    </Button>
                    <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => toast({ title: "Feature Coming Soon", description: "Asset library will be available soon." })}>
                      <Library className="h-4 w-4 mr-3" />
                      Asset Library
                    </Button>
                    <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => toast({ title: "Feature Coming Soon", description: "Analytics dashboard will be available soon." })}>
                      <BarChart3 className="h-4 w-4 mr-3" />
                      Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => toast({ title: "Feature Coming Soon", description: "Training webinars will be available soon." })}>
                      <Video className="h-4 w-4 mr-3" />
                      Training Webinars
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pinned Metrics */}
              <Card className="saas-card animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pin className="h-5 w-5 text-primary" />
                    <span>Pinned Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pinnedMetrics.length > 0 ? (
                      pinnedMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">{metric}</span>
                          <Button variant="ghost" size="sm" onClick={() => setPinnedMetrics(prev => prev.filter((_, i) => i !== index))}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Pin your favorite metrics here
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
