import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CourseCard from "@/components/course/course-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Trash2, Sparkles, BookOpen, Users, BarChart3, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AICourseGenerator } from "@/components/course/ai-course-generator";

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAICourseGeneratorOpen, setIsAICourseGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.role === "instructor" ? "manage" : "enrolled");
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner",
  });

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      console.log("Fetching courses...");
      const response = await fetch("/api/courses");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch courses:", errorText);
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Courses data:", data);
      return data;
    },
  });

  // Show error state
  if (error) {
    console.error("Error loading courses:", error);
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-12">
              <p className="text-red-500">Error loading courses: {error.message}</p>
            </div>
                  </main>
      </div>

      {/* AI Course Generator */}
      {isAICourseGeneratorOpen && (
        <AICourseGenerator
          onGenerate={handleAIGenerateCompleteCourse}
          onClose={() => setIsAICourseGeneratorOpen(false)}
        />
      )}
    </div>
  );
}

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreateDialogOpen(false);
      setNewCourse({ title: "", description: "", category: "", difficulty: "beginner" });
      toast({
        title: "Course Created",
        description: "Your new course has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "Course has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAIGenerateCompleteCourse = async (courseData: any) => {
    console.log("Starting AI course generation with data:", courseData);
    
    try {
      // Create the course
      const courseResponse = await apiRequest("POST", "/api/courses", {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        difficulty: courseData.difficulty
      });
      const createdCourse = await courseResponse.json();
      console.log("Course created:", createdCourse);

      // Create modules and chapters
      for (let moduleIndex = 0; moduleIndex < courseData.modules.length; moduleIndex++) {
        const moduleData = courseData.modules[moduleIndex];
        
        const moduleResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/modules`, {
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleIndex + 1
        });
        const createdModule = await moduleResponse.json();

        // Create chapters for this module
        for (let chapterIndex = 0; chapterIndex < moduleData.chapters.length; chapterIndex++) {
          const chapterData = moduleData.chapters[chapterIndex];
          
          await apiRequest("POST", `/api/modules/${createdModule.id}/chapters`, {
            title: chapterData.title,
            content: chapterData.content,
            contentType: "text",
            duration: 30,
            orderIndex: chapterIndex + 1
          });
        }

        // Create assignments for this module
        if (moduleData.assignments && moduleData.assignments.length > 0) {
          for (const assignmentData of moduleData.assignments) {
            await apiRequest("POST", `/api/courses/${createdCourse.id}/assignments`, {
              title: assignmentData.title,
              description: assignmentData.description,
              dueDate: new Date(assignmentData.dueDate).toISOString(),
              maxPoints: assignmentData.points
            });
          }
        }

        // Create discussions for this module
        if (moduleData.discussions && moduleData.discussions.length > 0) {
          for (const discussionData of moduleData.discussions) {
            await apiRequest("POST", `/api/courses/${createdCourse.id}/discussions`, {
              title: discussionData.title,
              content: discussionData.prompt || "Share your thoughts and experiences with this module.",
              pinned: false,
              locked: false
            });
          }
        }

        // Create quizzes for this module
        if (moduleData.quizzes && moduleData.quizzes.length > 0) {
          for (const quizData of moduleData.quizzes) {
            const quizResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/quizzes`, {
              title: quizData.title,
              description: quizData.description,
              timeLimit: quizData.timeLimit || 30
            });
            const createdQuiz = await quizResponse.json();

            // Create quiz questions
            if (quizData.questions && quizData.questions.length > 0) {
              for (const questionData of quizData.questions) {
                await apiRequest("POST", `/api/quizzes/${createdQuiz.id}/questions`, {
                  question: questionData.question,
                  type: questionData.type,
                  options: questionData.options,
                  correctAnswer: questionData.correctAnswer,
                  points: questionData.points
                });
              }
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "AI Course Created",
        description: "Your AI-generated course has been created successfully!",
      });
    } catch (error) {
      console.error("Error creating AI course:", error);
      toast({
        title: "Error",
        description: "Failed to create AI course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCourse = () => {
    if (!newCourse.title || !newCourse.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCourseMutation.mutate(newCourse);
  };

  const handleDeleteCourse = (courseId: number) => {
    console.log("Delete button clicked for course:", courseId);
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      console.log("Confirmed deletion for course:", courseId);
      deleteCourseMutation.mutate(courseId);
    }
  };

  const filteredCourses = courses?.filter((course: any) => {
    console.log("Filtering course:", course);
    const matchesSearch = course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course?.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  console.log("Filtered courses:", filteredCourses);

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
                <h2 className="text-3xl font-bold text-slate-800">My Courses</h2>
                <p className="text-slate-600 mt-1">
                  {isInstructor 
                    ? "Manage your courses and create new content"
                    : "Track your learning journey and discover new courses"
                  }
                </p>
              </div>
              {isInstructor && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsAICourseGeneratorOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Course Generator
                  </Button>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="enrolled" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {isInstructor ? "All Courses" : "Enrolled"}
              </TabsTrigger>
              {isInstructor && (
                <>
                  <TabsTrigger value="manage" className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Manage
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Discover
              </TabsTrigger>
            </TabsList>

            {/* Enrolled/All Courses Tab */}
            <TabsContent value="enrolled" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Programming">Programming</SelectItem>
                          <SelectItem value="Web Development">Web Development</SelectItem>
                          <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                          <SelectItem value="Data Science">Data Science</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  // Loading skeletons
                  [...Array(6)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-40 bg-slate-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded mb-4"></div>
                        <div className="flex justify-between">
                          <div className="h-6 w-16 bg-slate-200 rounded"></div>
                          <div className="h-6 w-20 bg-slate-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredCourses.length > 0 ? (
                  filteredCourses.map((course: any) => (
                    <div key={course.id} className="relative group">
                      <CourseCard course={course} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">
                      {searchTerm || filterCategory !== "all" 
                        ? "No courses found matching your criteria" 
                        : isInstructor 
                          ? "You haven't created any courses yet" 
                          : "No courses available"
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Course Management Tab (Instructors only) */}
            {isInstructor && (
              <TabsContent value="manage" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Course Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCourses.map((course: any) => (
                        <div key={course.id} className="relative group">
                          <CourseCard course={course} />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-100 z-10"
                            onClick={() => handleDeleteCourse(course.id)}
                            disabled={deleteCourseMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Analytics Tab (Instructors only) */}
            {isInstructor && (
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                          <p className="text-2xl font-bold">{courses?.length || 0}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Published</p>
                          <p className="text-2xl font-bold">{courses?.filter((c: any) => c.status === 'published').length || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                          <p className="text-2xl font-bold">{courses?.filter((c: any) => c.status === 'draft').length || 0}</p>
                        </div>
                        <Settings2 className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                          <p className="text-2xl font-bold">284</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Discover Tab */}
            <TabsContent value="discover" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Discover New Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">Explore courses from other instructors and expand your learning.</p>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-4">Course discovery feature coming soon!</p>
                    <p className="text-slate-400">Stay tuned for an amazing catalog of courses from expert instructors.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* AI Course Generator */}
      {isAICourseGeneratorOpen && (
        <AICourseGenerator
          onGenerate={handleAIGenerateCompleteCourse}
          onClose={() => setIsAICourseGeneratorOpen(false)}
        />
      )}
    </div>
  );
}
