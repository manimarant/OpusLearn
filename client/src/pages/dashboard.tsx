import { useEffect } from "react";
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
import { BookOpen, Users, TrendingUp, Star, MessageSquare, FileText, Award, Sparkles, Zap, Target, Clock, Plus } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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
    queryKey: ["api", "analytics", "instructor"],
    enabled: !!user && user.role === "instructor",
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

  const isInstructor = user?.role === "instructor";

  return (
    <div className="saas-main">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-3xl font-bold text-foreground">
                {isInstructor ? "Dashboard" : "Student Dashboard"}
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {isInstructor 
                ? "Create engaging courses, track student progress, and leverage AI-powered tools to enhance learning outcomes"
                : "Continue your learning journey with personalized recommendations and progress tracking"
              }
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {isInstructor ? (
              <>
                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Active Courses</p>
                        <p className="text-3xl font-bold text-foreground">
                          {analytics?.activeCourses || 0}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">+2 this month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                        <p className="text-3xl font-bold text-foreground">
                          {analytics?.totalStudents || 0}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">+58 this week</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Completion Rate</p>
                        <p className="text-3xl font-bold text-foreground">87%</p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">+5% vs last month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Rating</p>
                        <p className="text-3xl font-bold text-foreground">4.8</p>
                        <div className="flex items-center mt-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground ml-2">(324 reviews)</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Enrolled Courses</p>
                        <p className="text-3xl font-bold text-foreground">
                          {courses?.length || 0}
                        </p>
                        <div className="flex items-center mt-2">
                          <Clock className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm text-muted-foreground">Active learning</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                        <p className="text-3xl font-bold text-foreground">3</p>
                        <div className="flex items-center mt-2">
                          <Award className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">Great progress!</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                        <p className="text-3xl font-bold text-foreground">
                          {courses?.length ? courses.length - 3 : 0}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-yellow-600 font-medium">Keep going!</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="saas-card saas-card-hover animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Study Streak</p>
                        <p className="text-3xl font-bold text-foreground">12</p>
                        <div className="flex items-center mt-2">
                          <Zap className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-sm text-purple-600 font-medium">days</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Zap className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
            {/* Recent Activity & Quick Access */}
            <div className="xl:col-span-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Courses */}
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" className="saas-button-ghost" onClick={() => window.location.href = '/courses'}>
                        View All →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {courses?.slice(0, 2).map((course: any) => (
                      <div key={course.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors mb-3 last:mb-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {isInstructor ? `${course.status} • Updated ${new Date(course.updatedAt).toLocaleDateString()}` : 'Continue learning'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = isInstructor ? `/course-builder/${course.id}` : `/courses/${course.id}`}>
                          {isInstructor ? 'Edit' : 'Continue'}
                        </Button>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isInstructor ? "No courses created yet" : "No courses enrolled yet"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {isInstructor ? (
                        <>
                          <Button className="w-full justify-start saas-button-primary" onClick={() => window.location.href = '/course-builder/'}>
                            <Plus className="h-4 w-4 mr-3" />
                            Create New Course
                          </Button>
                          <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => window.location.href = '/courses'}>
                            <BookOpen className="h-4 w-4 mr-3" />
                            Manage Courses
                          </Button>
                          <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => window.location.href = '/assignments'}>
                            <FileText className="h-4 w-4 mr-3" />
                            View Assignments
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button className="w-full justify-start saas-button-primary" onClick={() => window.location.href = '/courses'}>
                            <BookOpen className="h-4 w-4 mr-3" />
                            Browse Courses
                          </Button>
                          <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => window.location.href = '/assignments'}>
                            <FileText className="h-4 w-4 mr-3" />
                            My Assignments
                          </Button>
                          <Button variant="outline" className="w-full justify-start saas-button-secondary" onClick={() => window.location.href = '/discussions'}>
                            <MessageSquare className="h-4 w-4 mr-3" />
                            Join Discussions
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="grid grid-cols-1 gap-6">
              {/* Quick Actions for Instructors */}
              {isInstructor && (
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle>AI-Powered Tools</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <Button variant="outline" className="w-full justify-start saas-button-secondary">
                        <BookOpen className="h-4 w-4 mr-3" />
                        Course Builder
                      </Button>
                      <Button variant="outline" className="w-full justify-start saas-button-secondary">
                        <FileText className="h-4 w-4 mr-3" />
                        Quiz Builder
                      </Button>
                      <Button variant="outline" className="w-full justify-start saas-button-secondary">
                        <Award className="h-4 w-4 mr-3" />
                        Assignment Creator
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="saas-card animate-slide-up">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Activity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {notifications?.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Chart for Students */}
              {!isInstructor && (
                <Card className="saas-card animate-slide-up">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle>Learning Progress</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
