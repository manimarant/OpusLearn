import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ContentEditor from "@/components/course/content-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Eye, Upload, ChevronRight, Edit, Trash2 } from "lucide-react";
import AIAssistant from "@/components/course/ai-assistant";
import AICourseGenerator from "@/components/course/ai-course-generator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
  instructorId: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  content: string;
  contentType: string;
  duration: number;
  orderIndex: number;
}

export default function CourseBuilder() {
  const params = useParams();
  const courseId = params.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [forceEditorUpdate, setForceEditorUpdate] = useState(0);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newChapter, setNewChapter] = useState({ title: "", content: "", contentType: "text", duration: 0 });
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
  });

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: ["/api/courses", courseId, "modules"],
    enabled: !!courseId,
  });

  const { data: chapters } = useQuery<Chapter[]>({
    queryKey: ["/api/modules", selectedModule?.id, "chapters"],
    enabled: !!selectedModule,
  });

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Debug logging
  console.log("Courses data:", courses);
  console.log("Courses loading:", coursesLoading);
  console.log("Courses error:", coursesError);

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/modules`, moduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "modules"] });
      setIsModuleDialogOpen(false);
      setNewModule({ title: "", description: "" });
      toast({
        title: "Module Created",
        description: "Your new module has been created successfully.",
      });
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest("POST", `/api/modules/${selectedModule?.id}/chapters`, chapterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule?.id, "chapters"] });
      setIsChapterDialogOpen(false);
      setNewChapter({ title: "", content: "", contentType: "text", duration: 0 });
      toast({
        title: "Chapter Created",
        description: "Your new chapter has been created successfully.",
      });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: async ({ chapterId, updates }: { chapterId: number; updates: any }) => {
      console.log("=== MUTATION FUNCTION START ===");
      console.log("Mutation called with chapterId:", chapterId);
      console.log("Mutation called with updates:", updates);
      
      const response = await apiRequest("PUT", `/api/chapters/${chapterId}`, updates);
      console.log("API response:", response);
      
      const data = await response.json();
      console.log("Parsed response data:", data);
      console.log("=== MUTATION FUNCTION END ===");
      
      return data;
    },
    onSuccess: (data) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Chapter update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule?.id, "chapters"] });
      toast({
        title: "Chapter Updated",
        description: "Your chapter has been saved successfully.",
      });
      console.log("=== MUTATION SUCCESS END ===");
    },
    onError: (error) => {
      console.log("=== MUTATION ERROR ===");
      console.error("Error updating chapter:", error);
      toast({
        title: "Update Failed",
        description: "Failed to save chapter. Please try again.",
        variant: "destructive",
      });
      console.log("=== MUTATION ERROR END ===");
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      window.location.href = `/course-builder/${data.id}`;
      toast({
        title: "Course Created",
        description: "Your new course has been created successfully.",
      });
    },
  });

  const handleCreateModule = () => {
    if (!newModule.title) {
      toast({
        title: "Validation Error",
        description: "Please enter a module title.",
        variant: "destructive",
      });
      return;
    }
    createModuleMutation.mutate({
      ...newModule,
      orderIndex: (modules?.length || 0) + 1,
    });
  };

  const handleCreateChapter = () => {
    if (!newChapter.title) {
      toast({
        title: "Validation Error",
        description: "Please enter a chapter title.",
        variant: "destructive",
      });
      return;
    }
    createChapterMutation.mutate({
      ...newChapter,
      orderIndex: (chapters?.length || 0) + 1,
    });
  };

  const handleSaveChapter = (chapterData: any) => {
    console.log("handleSaveChapter called with:", { chapterData, selectedChapter });
    
    if (selectedChapter) {
      console.log("Calling updateChapterMutation with:", {
        chapterId: selectedChapter.id,
        updates: chapterData,
      });
      
      updateChapterMutation.mutate({
        chapterId: selectedChapter.id,
        updates: chapterData,
      });
    } else {
      console.error("No selected chapter in handleSaveChapter");
    }
  };

  const handleCreateCourse = () => {
    if (!newCourse.title) {
      toast({
        title: "Validation Error",
        description: "Please enter a course title.",
        variant: "destructive",
      });
      return;
    }
    createCourseMutation.mutate(newCourse);
  };

  // AI Assistant handlers
  const handleAIGenerateContent = (content: string, type: string) => {
    console.log("=== AI CONTENT GENERATION START ===");
    console.log("AI Generate Content called with:", { content, type, selectedChapter });
    
    if (selectedChapter) {
      console.log("Selected chapter found:", selectedChapter);
      
      const updatedChapterData = {
        title: selectedChapter.title,
        content: content,
        contentType: type,
        duration: selectedChapter.duration
      };
      
      console.log("Updated chapter data for save:", updatedChapterData);
      
      // Update the selected chapter state to reflect the new content immediately
      const updatedChapter = {
        ...selectedChapter,
        content: content,
        contentType: type
      };
      
      console.log("Updated chapter object:", updatedChapter);
      console.log("Setting selected chapter state...");
      setSelectedChapter(updatedChapter);
      
      console.log("Triggering force editor update...");
      setForceEditorUpdate(prev => {
        console.log("Force update triggered, new value:", prev + 1);
        return prev + 1;
      });
      
      // Force a re-render by updating the chapters query
      console.log("Updating React Query cache...");
      queryClient.setQueryData(
        ["/api/modules", selectedModule?.id, "chapters"],
        (oldData: any) => {
          console.log("Old chapters data:", oldData);
          if (oldData) {
            const newData = oldData.map((chapter: any) => 
              chapter.id === selectedChapter.id ? updatedChapter : chapter
            );
            console.log("New chapters data:", newData);
            return newData;
          }
          return oldData;
        }
      );
      
      // Save the chapter with the new content
      console.log("Attempting to save chapter...");
      try {
        handleSaveChapter(updatedChapterData);
        console.log("Save chapter called successfully");
      } catch (error) {
        console.error("Error saving chapter:", error);
        toast({
          title: "Save Warning",
          description: "Content applied but save failed. Please manually save the chapter.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "AI Content Applied",
        description: "The AI-generated content has been applied to your chapter. Please save manually if needed.",
      });
      
      console.log("=== AI CONTENT GENERATION END ===");
    } else {
      console.error("No selected chapter found");
      toast({
        title: "Error",
        description: "No chapter selected. Please select a chapter first.",
        variant: "destructive",
      });
    }
  };

  const handleAIGenerateModule = (module: { title: string; description: string }) => {
    setNewModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleAIGenerateChapter = (chapter: { title: string; content: string; contentType: string; duration: number }) => {
    setNewChapter(chapter);
    setIsChapterDialogOpen(true);
  };

  const handleAIGenerateCompleteCourse = async (courseData: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    modules: Array<{
      title: string;
      description: string;
      chapters: Array<{
        title: string;
        content: string;
        contentType: string;
        duration: number;
      }>;
      assignments?: Array<{
        title: string;
        description: string;
        dueDate: string;
        points: number;
      }>;
      quizzes?: Array<{
        title: string;
        description: string;
        timeLimit: number;
        questions: Array<{
          question: string;
          type: string;
          options?: string[];
          correctAnswer?: string;
          points: number;
        }>;
      }>;
      discussions?: Array<{
        title: string;
        description: string;
        prompt: string;
      }>;
    }>;
  }) => {
    console.log("=== AI Course Generator Debug ===");
    console.log("Course data received:", courseData);
    console.log("Number of modules:", courseData.modules.length);
    
    try {
      // First create the course
      console.log("Creating course with data:", {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        difficulty: courseData.difficulty,
        status: "draft"
      });
      
      const courseResponse = await apiRequest("POST", "/api/courses", {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        difficulty: courseData.difficulty,
        status: "draft"
      });
      
      const createdCourse = await courseResponse.json();
      const newCourseId = createdCourse.id;
      console.log("Course created successfully with ID:", newCourseId);

      // Create modules and chapters for the course
      for (let moduleIndex = 0; moduleIndex < courseData.modules.length; moduleIndex++) {
        const moduleData = courseData.modules[moduleIndex];
        // Create module
        console.log(`Creating module ${moduleIndex + 1}:`, moduleData.title);
        const moduleResponse = await apiRequest("POST", `/api/courses/${newCourseId}/modules`, {
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleIndex + 1
        });
        
        const createdModule = await moduleResponse.json();
        const moduleId = createdModule.id;
        console.log(`Module created successfully with ID:`, moduleId);

        // Create chapters for this module
        console.log(`Creating ${moduleData.chapters.length} chapters for module ${moduleIndex + 1}`);
        for (let chapterIndex = 0; chapterIndex < moduleData.chapters.length; chapterIndex++) {
          const chapterData = moduleData.chapters[chapterIndex];
          console.log(`Creating chapter ${chapterIndex + 1}:`, chapterData.title);
          await apiRequest("POST", `/api/modules/${moduleId}/chapters`, {
            title: chapterData.title,
            content: chapterData.content,
            contentType: chapterData.contentType,
            duration: chapterData.duration,
            orderIndex: chapterIndex + 1
          });
          console.log(`Chapter ${chapterIndex + 1} created successfully`);
        }

        // Create assignments for this module
        if (moduleData.assignments) {
          for (const assignmentData of moduleData.assignments) {
            await apiRequest("POST", `/api/courses/${newCourseId}/assignments`, {
              title: assignmentData.title,
              description: assignmentData.description,
              dueDate: assignmentData.dueDate,
              maxPoints: assignmentData.points
            });
          }
        }

        // Create quizzes for this module
        if (moduleData.quizzes) {
          for (const quizData of moduleData.quizzes) {
            const quizResponse = await apiRequest("POST", `/api/courses/${newCourseId}/quizzes`, {
              title: quizData.title,
              description: quizData.description,
              timeLimit: quizData.timeLimit
            });
            
            const createdQuiz = await quizResponse.json();
            const quizId = createdQuiz.id;

            // Create questions for this quiz
            for (const questionData of quizData.questions) {
              await apiRequest("POST", `/api/quizzes/${quizId}/questions`, {
                question: questionData.question,
                type: questionData.type,
                options: questionData.options,
                correctAnswer: questionData.correctAnswer,
                points: questionData.points,
                orderIndex: 1 // Default order index
              });
            }
          }
        }

        // Create discussions for this module
        if (moduleData.discussions) {
          for (const discussionData of moduleData.discussions) {
            await apiRequest("POST", `/api/courses/${newCourseId}/discussions`, {
              title: discussionData.title,
              content: discussionData.prompt // Use prompt as content
            });
          }
        }
      }

      // Invalidate the courses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      // Calculate totals
      const totalChapters = courseData.modules.reduce((acc, mod) => acc + mod.chapters.length, 0);
      const totalAssignments = courseData.modules.reduce((acc, mod) => acc + (mod.assignments?.length || 0), 0);
      const totalQuizzes = courseData.modules.reduce((acc, mod) => acc + (mod.quizzes?.length || 0), 0);
      const totalDiscussions = courseData.modules.reduce((acc, mod) => acc + (mod.discussions?.length || 0), 0);

      toast({
        title: "Course Created Successfully",
        description: `AI-generated course "${courseData.title}" has been created with ${courseData.modules.length} modules, ${totalChapters} chapters, ${totalAssignments} assignments, ${totalQuizzes} quizzes, and ${totalDiscussions} discussions.`,
      });

      // Navigate to the new course
      setLocation(`/course-builder/${newCourseId}`);
      
    } catch (error) {
      console.error("Error creating AI-generated course:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Creation Failed",
        description: `Failed to create the AI-generated course: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const [, setLocation] = useLocation();

  if (!courseId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Course Builder</h2>
                  <p className="text-slate-600 mt-1">Select a course to edit or create a new one</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/courses"] })}
                  >
                    Refresh Courses
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Course
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Course</DialogTitle>
                      <DialogDescription>
                        Set up your course structure and initial content.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                          id="title"
                          value={newCourse.title}
                          onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                          placeholder="Enter course title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newCourse.description}
                          onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                          placeholder="Describe your course..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newCourse.category}
                            onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Programming">Programming</SelectItem>
                              <SelectItem value="Web Development">Web Development</SelectItem>
                              <SelectItem value="Data Science">Data Science</SelectItem>
                              <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                              <SelectItem value="Databases">Databases</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select
                            value={newCourse.difficulty}
                            onValueChange={(value) => setNewCourse({ ...newCourse, difficulty: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <AICourseGenerator
                          onCourseGenerated={handleAIGenerateCompleteCourse}
                        />
                      </div>
                      <Button 
                        onClick={handleCreateCourse}
                        disabled={createCourseMutation.isPending}
                      >
                        {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading courses...</p>
                </div>
              ) : coursesError ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-red-600">Error loading courses. Please try again.</p>
                </div>
              ) : courses && courses.length > 0 ? (
                courses.map((course: Course) => (
                  <Card 
                    key={course.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setLocation(`/course-builder/${course.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-800 mb-1">{course.title}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                        </div>
                        <Badge variant="outline">{course.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{course.category}</span>
                        <span>{course.difficulty}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-slate-600">No courses found. Create your first course to get started.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                <h2 className="text-2xl font-bold text-slate-800">Course Builder</h2>
                <p className="text-slate-600 mt-1">
                  {course?.title || "Loading course..."}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                              <AIAssistant
                courseTitle={course?.title}
                courseDescription={course?.description}
                onGenerateContent={handleAIGenerateContent}
                onGenerateModule={handleAIGenerateModule}
                onGenerateChapter={handleAIGenerateChapter}
                disabled={!selectedChapter}
              />
              <Button 
                onClick={() => {
                  console.log("=== TEST BUTTON CLICKED ===");
                  console.log("Selected chapter:", selectedChapter);
                  if (selectedChapter) {
                    handleAIGenerateContent("This is a test content from the test button!", "text");
                  } else {
                    toast({
                      title: "No Chapter Selected",
                      description: "Please select a chapter first before testing AI content.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                size="sm"
                disabled={!selectedChapter}
              >
                Test AI Content
              </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/courses/${courseId}/preview`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = `/courses/${courseId}`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </div>

          {/* Course Builder Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Course Structure Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Course Structure</CardTitle>
                    <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Module</DialogTitle>
                          <DialogDescription>
                            Create a new module to organize your course content.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="module-title">Title</Label>
                            <Input
                              id="module-title"
                              value={newModule.title}
                              onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                              placeholder="Module title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="module-description">Description</Label>
                            <Textarea
                              id="module-description"
                              value={newModule.description}
                              onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                              placeholder="Module description (optional)"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateModule} disabled={createModuleMutation.isPending}>
                            {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2 p-6">
                    {modules?.map((module: Module, index: number) => (
                      <div
                        key={module.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedModule?.id === module.id
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-slate-50 border-slate-200"
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">
                            {index + 1}. {module.title}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        {chapters && selectedModule?.id === module.id && (
                          <div className="mt-2 ml-4 space-y-1">
                            {chapters.map((chapter: Chapter) => (
                              <div
                                key={chapter.id}
                                className={`p-2 text-xs rounded cursor-pointer transition-colors ${
                                  selectedChapter?.id === chapter.id
                                    ? "bg-blue-100 text-blue-800"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChapter(chapter);
                                }}
                              >
                                {chapter.title}
                              </div>
                            ))}
                            <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-full text-xs mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Chapter
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add New Chapter</DialogTitle>
                                  <DialogDescription>
                                    Create a new chapter in {module.title}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="chapter-title">Title</Label>
                                    <Input
                                      id="chapter-title"
                                      value={newChapter.title}
                                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                                      placeholder="Chapter title"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="chapter-duration">Duration (minutes)</Label>
                                    <Input
                                      id="chapter-duration"
                                      type="number"
                                      value={newChapter.duration}
                                      onChange={(e) => setNewChapter({ ...newChapter, duration: parseInt(e.target.value) || 0 })}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleCreateChapter} disabled={createChapterMutation.isPending}>
                                    {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    )) || (
                      <p className="text-slate-500 text-sm text-center py-4">
                        No modules yet. Create your first module to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Editor */}
            <div className="lg:col-span-3">
              {selectedChapter ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedChapter.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Module: {selectedModule?.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {selectedChapter.contentType}
                        </Badge>
                        <Badge variant="outline">
                          {selectedChapter.duration || 0} min
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ContentEditor
                      chapter={selectedChapter}
                      onSave={handleSaveChapter}
                      isLoading={updateChapterMutation.isPending}
                      forceUpdate={forceEditorUpdate}
                    />
                  </CardContent>
                </Card>
              ) : selectedModule ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-medium text-slate-800 mb-4">
                        {selectedModule.title}
                      </h3>
                      <p className="text-slate-600 mb-6">
                        {selectedModule.description || "Select a chapter to start editing, or create a new chapter in this module."}
                      </p>
                      <Button 
                        onClick={() => setIsChapterDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Chapter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-medium text-slate-800 mb-4">
                        Welcome to Course Builder
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Start by creating modules to organize your course content, then add chapters within each module.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => setIsModuleDialogOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Module
                        </Button>
                        <AICourseGenerator
                          onCourseGenerated={handleAIGenerateCompleteCourse}
                        />
                        <AIAssistant
                          courseTitle={course?.title}
                          courseDescription={course?.description}
                          onGenerateContent={handleAIGenerateContent}
                          onGenerateModule={handleAIGenerateModule}
                          onGenerateChapter={handleAIGenerateChapter}
                          disabled={!selectedChapter}
                        />
                      </div>
                    </div>
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
