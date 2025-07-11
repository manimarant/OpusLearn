import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProgressChart from "@/components/progress/progress-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, Clock, BookOpen, Award, Target, Calendar } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [timeRange, setTimeRange] = useState("30d");

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: instructorStats } = useQuery({
    queryKey: ["/api/analytics/instructor"],
    enabled: !!user && user.role === "instructor",
  });

  const { data: courseAnalytics } = useQuery({
    queryKey: ["/api/analytics/course", selectedCourse],
    enabled: !!selectedCourse && user?.role === "instructor",
  });

  const isInstructor = user?.role === "instructor";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
                <p className="text-slate-600 mt-1">
                  {isInstructor 
                    ? "Track course performance and student engagement" 
                    : "Monitor your learning progress and achievements"
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {isInstructor && (
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isInstructor ? (
            /* Instructor Analytics */
            <div className="space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Students</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                          {instructorStats?.totalStudents || 0}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +12% this month
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Active Courses</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                          {instructorStats?.activeCourses || 0}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +2 this month
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg. Completion</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">87%</p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +5% vs last month
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">$4,832</p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +18% this month
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Tabs */}
              <Tabs defaultValue="engagement" className="w-full">
                <TabsList>
                  <TabsTrigger value="engagement">Student Engagement</TabsTrigger>
                  <TabsTrigger value="performance">Course Performance</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Engagement Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Active Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProgressChart />
                      </CardContent>
                    </Card>

                    {/* Top Performing Courses */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Courses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {courses?.slice(0, 5).map((course: any, index: number) => (
                            <div key={course.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-medium text-blue-600">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{course.title}</p>
                                  <p className="text-sm text-slate-500">
                                    {Math.floor(Math.random() * 100) + 50} students
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-800">
                                  {Math.floor(Math.random() * 20) + 80}%
                                </p>
                                <p className="text-sm text-slate-500">completion</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Student Progress Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Progress Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">On Track</span>
                            <span className="text-sm text-slate-500">73%</span>
                          </div>
                          <Progress value={73} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">At Risk</span>
                            <span className="text-sm text-slate-500">18%</span>
                          </div>
                          <Progress value={18} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Behind</span>
                            <span className="text-sm text-slate-500">9%</span>
                          </div>
                          <Progress value={9} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Course Completion Rates */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Course Completion Rates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {courses?.map((course: any) => (
                            <div key={course.id} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{course.title}</span>
                                <span className="text-sm text-slate-500">
                                  {Math.floor(Math.random() * 30) + 70}%
                                </span>
                              </div>
                              <Progress value={Math.floor(Math.random() * 30) + 70} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assignment Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Assignment Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <p className="font-medium text-green-800">Average Score</p>
                              <p className="text-sm text-green-600">All assignments</p>
                            </div>
                            <div className="text-2xl font-bold text-green-800">85%</div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium text-blue-800">Submission Rate</p>
                              <p className="text-sm text-blue-600">On-time submissions</p>
                            </div>
                            <div className="text-2xl font-bold text-blue-800">92%</div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                              <p className="font-medium text-yellow-800">Avg. Time to Grade</p>
                              <p className="text-sm text-yellow-600">Instructor response</p>
                            </div>
                            <div className="text-2xl font-bold text-yellow-800">2.3d</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProgressChart />
                      </CardContent>
                    </Card>

                    {/* Revenue Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by Course</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {courses?.slice(0, 5).map((course: any) => (
                            <div key={course.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-800">{course.title}</p>
                                <p className="text-sm text-slate-500">
                                  {Math.floor(Math.random() * 50) + 25} enrollments
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-slate-800">
                                  ${(Math.floor(Math.random() * 1000) + 500).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {Math.floor(Math.random() * 20) + 10}% of total
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            /* Student Analytics */
            <div className="space-y-8">
              {/* Student Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Courses Enrolled</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">
                          {courses?.length || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Completed</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">3</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Study Hours</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">47</p>
                        <p className="text-sm text-slate-500 mt-1">this month</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg. Score</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">89%</p>
                        <p className="text-sm text-green-600 mt-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +3% improvement
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Student Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProgressChart />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Course Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses?.map((course: any) => (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{course.title}</span>
                            <span className="text-sm text-slate-500">
                              {Math.floor(Math.random() * 50) + 50}%
                            </span>
                          </div>
                          <Progress value={Math.floor(Math.random() * 50) + 50} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Learning Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">Course Completed</p>
                          <p className="text-sm text-green-600">React Fundamentals</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Perfect Score</p>
                          <p className="text-sm text-blue-600">JavaScript Quiz</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-800">Study Streak</p>
                          <p className="text-sm text-purple-600">12 days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
