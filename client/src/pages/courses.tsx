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
import { Plus, Search, Filter, Trash2, Sparkles } from "lucide-react";
import { AICourseGenerator } from "@/components/course/ai-course-generator";

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAICourseGeneratorOpen, setIsAICourseGeneratorOpen] = useState(false);
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
                <h2 className="text-2xl font-bold text-slate-800">
                  {isInstructor ? "My Courses" : "Available Courses"}
                </h2>
                <p className="text-slate-600 mt-1">
                  {isInstructor 
                    ? "Manage and create your courses"
                    : "Discover and enroll in courses"
                  }
                </p>
              </div>
              
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
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
                        <SelectItem value="web-development">Web Development</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  {isInstructor && course.instructorId === user?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-100 z-10"
                      onClick={() => handleDeleteCourse(course.id)}
                      disabled={deleteCourseMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-slate-500 text-lg">
                  {searchTerm || filterCategory !== "all" 
                    ? "No courses found matching your criteria" 
                    : isInstructor 
                      ? "You haven't created any courses yet" 
                      : "No courses available"
                  }
                </p>
                {isInstructor && !searchTerm && filterCategory === "all" && (
                  <Button 
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            )}
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
