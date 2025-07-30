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

interface Lesson {
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
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [forceEditorUpdate, setForceEditorUpdate] = useState(0);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newLesson, setNewLesson] = useState({ title: "", content: "", contentType: "text", duration: 0 });
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

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/modules", selectedModule?.id, "lessons"],
    enabled: !!selectedModule,
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

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

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest("POST", `/api/modules/${selectedModule?.id}/lessons`, lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule?.id, "lessons"] });
      setIsLessonDialogOpen(false);
      setNewLesson({ title: "", content: "", contentType: "text", duration: 0 });
      toast({
        title: "Lesson Created",
        description: "Your new lesson has been created successfully.",
      });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, updates }: { lessonId: number; updates: any }) => {
      console.log("=== MUTATION FUNCTION START ===");
      console.log("Mutation called with lessonId:", lessonId);
      console.log("Mutation called with updates:", updates);
      
      const response = await apiRequest("PUT", `/api/lessons/${lessonId}`, updates);
      console.log("API response:", response);
      
      const data = await response.json();
      console.log("Parsed response data:", data);
      console.log("=== MUTATION FUNCTION END ===");
      
      return data;
    },
    onSuccess: (data) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Lesson update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule?.id, "lessons"] });
      toast({
        title: "Lesson Updated",
        description: "Your lesson has been saved successfully.",
      });
      console.log("=== MUTATION SUCCESS END ===");
    },
    onError: (error) => {
      console.log("=== MUTATION ERROR ===");
      console.error("Error updating lesson:", error);
      toast({
        title: "Update Failed",
        description: "Failed to save lesson. Please try again.",
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

  const handleCreateLesson = () => {
    if (!newLesson.title) {
      toast({
        title: "Validation Error",
        description: "Please enter a lesson title.",
        variant: "destructive",
      });
      return;
    }
    createLessonMutation.mutate({
      ...newLesson,
      orderIndex: (lessons?.length || 0) + 1,
    });
  };

  const handleSaveLesson = (lessonData: any) => {
    console.log("handleSaveLesson called with:", { lessonData, selectedLesson });
    
    if (selectedLesson) {
      console.log("Calling updateLessonMutation with:", {
        lessonId: selectedLesson.id,
        updates: lessonData,
      });
      
      updateLessonMutation.mutate({
        lessonId: selectedLesson.id,
        updates: lessonData,
      });
    } else {
      console.error("No selected lesson in handleSaveLesson");
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
    console.log("AI Generate Content called with:", { content, type, selectedLesson });
    
    if (selectedLesson) {
      console.log("Selected lesson found:", selectedLesson);
      
      const updatedLessonData = {
        title: selectedLesson.title,
        content: content,
        contentType: type,
        duration: selectedLesson.duration
      };
      
      console.log("Updated lesson data for save:", updatedLessonData);
      
      // Update the selected lesson state to reflect the new content immediately
      const updatedLesson = {
        ...selectedLesson,
        content: content,
        contentType: type
      };
      
      console.log("Updated lesson object:", updatedLesson);
      console.log("Setting selected lesson state...");
      setSelectedLesson(updatedLesson);
      
      console.log("Triggering force editor update...");
      setForceEditorUpdate(prev => {
        console.log("Force update triggered, new value:", prev + 1);
        return prev + 1;
      });
      
      // Force a re-render by updating the lessons query
      console.log("Updating React Query cache...");
      queryClient.setQueryData(
        ["/api/modules", selectedModule?.id, "lessons"],
        (oldData: any) => {
          console.log("Old lessons data:", oldData);
          if (oldData) {
            const newData = oldData.map((lesson: any) => 
              lesson.id === selectedLesson.id ? updatedLesson : lesson
            );
            console.log("New lessons data:", newData);
            return newData;
          }
          return oldData;
        }
      );
      
      // Save the lesson with the new content
      console.log("Attempting to save lesson...");
      try {
        handleSaveLesson(updatedLessonData);
        console.log("Save lesson called successfully");
      } catch (error) {
        console.error("Error saving lesson:", error);
        toast({
          title: "Save Warning",
          description: "Content applied but save failed. Please manually save the lesson.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "AI Content Applied",
        description: "The AI-generated content has been applied to your lesson. Please save manually if needed.",
      });
      
      console.log("=== AI CONTENT GENERATION END ===");
    } else {
      console.error("No selected lesson found");
      toast({
        title: "Error",
        description: "No lesson selected. Please select a lesson first.",
        variant: "destructive",
      });
    }
  };

  const handleAIGenerateModule = (module: { title: string; description: string }) => {
    setNewModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleAIGenerateLesson = (lesson: { title: string; content: string; contentType: string; duration: number }) => {
    setNewLesson(lesson);
    setIsLessonDialogOpen(true);
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
                    <DialogFooter>
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
              {courses?.map((course: Course) => (
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
              ))}
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
                onGenerateLesson={handleAIGenerateLesson}
                disabled={!selectedLesson}
              />
              <Button 
                onClick={() => {
                  console.log("=== TEST BUTTON CLICKED ===");
                  console.log("Selected lesson:", selectedLesson);
                  if (selectedLesson) {
                    handleAIGenerateContent("This is a test content from the test button!", "text");
                  } else {
                    toast({
                      title: "No Lesson Selected",
                      description: "Please select a lesson first before testing AI content.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                size="sm"
                disabled={!selectedLesson}
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
                        {lessons && selectedModule?.id === module.id && (
                          <div className="mt-2 ml-4 space-y-1">
                            {lessons.map((lesson: Lesson) => (
                              <div
                                key={lesson.id}
                                className={`p-2 text-xs rounded cursor-pointer transition-colors ${
                                  selectedLesson?.id === lesson.id
                                    ? "bg-blue-100 text-blue-800"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLesson(lesson);
                                }}
                              >
                                {lesson.title}
                              </div>
                            ))}
                            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-full text-xs mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Lesson
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add New Lesson</DialogTitle>
                                  <DialogDescription>
                                    Create a new lesson in {module.title}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="lesson-title">Title</Label>
                                    <Input
                                      id="lesson-title"
                                      value={newLesson.title}
                                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                      placeholder="Lesson title"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                                    <Input
                                      id="lesson-duration"
                                      type="number"
                                      value={newLesson.duration}
                                      onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 0 })}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleCreateLesson} disabled={createLessonMutation.isPending}>
                                    {createLessonMutation.isPending ? "Creating..." : "Create Lesson"}
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
              {selectedLesson ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedLesson.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Module: {selectedModule?.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {selectedLesson.contentType}
                        </Badge>
                        <Badge variant="outline">
                          {selectedLesson.duration || 0} min
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ContentEditor
                      lesson={selectedLesson}
                      onSave={handleSaveLesson}
                      isLoading={updateLessonMutation.isPending}
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
                        {selectedModule.description || "Select a lesson to start editing, or create a new lesson in this module."}
                      </p>
                      <Button 
                        onClick={() => setIsLessonDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Lesson
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
                        Start by creating modules to organize your course content, then add lessons within each module.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => setIsModuleDialogOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Module
                        </Button>
                        <AIAssistant
                          courseTitle={course?.title}
                          courseDescription={course?.description}
                          onGenerateContent={handleAIGenerateContent}
                          onGenerateModule={handleAIGenerateModule}
                          onGenerateLesson={handleAIGenerateLesson}
                          disabled={!selectedLesson}
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
