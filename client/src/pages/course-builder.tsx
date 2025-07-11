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

export default function CourseBuilder() {
  const params = useParams();
  const courseId = params.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newLesson, setNewLesson] = useState({ title: "", content: "", contentType: "text", duration: 0 });

  const { data: course } = useQuery({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });

  const { data: modules } = useQuery({
    queryKey: ["/api/courses", courseId, "modules"],
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ["/api/modules", selectedModule?.id, "lessons"],
    enabled: !!selectedModule,
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
      const response = await apiRequest("POST", `/api/modules/${selectedModule.id}/lessons`, lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule.id, "lessons"] });
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
      const response = await apiRequest("PUT", `/api/lessons/${lessonId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule?.id, "lessons"] });
      toast({
        title: "Lesson Updated",
        description: "Your lesson has been saved successfully.",
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
    if (selectedLesson) {
      updateLessonMutation.mutate({
        lessonId: selectedLesson.id,
        updates: lessonData,
      });
    }
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Please select a course to edit.</p>
          </CardContent>
        </Card>
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
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                    {modules?.map((module: any, index: number) => (
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
                            {lessons.map((lesson: any) => (
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
                      <Button 
                        onClick={() => setIsModuleDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Module
                      </Button>
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
