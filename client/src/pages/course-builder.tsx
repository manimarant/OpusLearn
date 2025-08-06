import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Upload, BookOpen, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ContentEditor from "@/components/course/content-editor";
import AIAssistant from "@/components/course/ai-assistant";
import { AICourseGenerator } from "@/components/course/ai-course-generator";

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
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/course-builder/:id");
  const courseId = params?.id;

  // State
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isAICourseGeneratorOpen, setIsAICourseGeneratorOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner"
  });

  // Queries
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses");
      return response.json();
    },
    refetchOnMount: true, // Refetch data when component mounts
  });

  const { data: course } = useQuery({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/courses/${courseId}`);
      return response.json();
    },
    enabled: !!courseId
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["/api/courses", courseId, "modules"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/courses/${courseId}/modules`);
      return response.json();
    },
    enabled: !!courseId
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/chapters", selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule) return [];
      const response = await apiRequest("GET", `/api/modules/${selectedModule.id}/chapters`);
      return response.json();
    },
    enabled: !!selectedModule
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setLocation(`/course-builder/${data.id}`);
      setIsCourseDialogOpen(false);
      toast({
        title: "Course Created",
        description: "Your course has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/modules`, moduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "modules"] });
      setIsModuleDialogOpen(false);
      toast({
        title: "Module Created",
        description: "Module has been created successfully.",
      });
    }
  });

  const createChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest("POST", `/api/modules/${selectedModule?.id}/chapters`, chapterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", selectedModule?.id] });
      setIsChapterDialogOpen(false);
      toast({
        title: "Chapter Created",
        description: "Chapter has been created successfully.",
      });
    }
  });

  const updateChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest("PUT", `/api/chapters/${selectedChapter?.id}`, chapterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", selectedModule?.id] });
      toast({
        title: "Chapter Updated",
        description: "Chapter has been updated successfully.",
      });
    }
  });

  // Handlers
  const handleCreateCourse = () => {
    createCourseMutation.mutate(newCourse);
  };

  const handleCreateModule = () => {
    const titleInput = document.getElementById("module-title") as HTMLInputElement;
    const descriptionInput = document.getElementById("module-description") as HTMLTextAreaElement;
    
    createModuleMutation.mutate({
      title: titleInput?.value || "New Module",
      description: descriptionInput?.value || "Module description",
      orderIndex: modules.length + 1
    });
  };

  const handleCreateChapter = () => {
    const titleInput = document.getElementById("chapter-title") as HTMLInputElement;
    const contentInput = document.getElementById("chapter-content") as HTMLTextAreaElement;
    
    createChapterMutation.mutate({
      title: titleInput?.value || "New Chapter",
      content: contentInput?.value || "Chapter content",
      contentType: "text",
      duration: 30,
      orderIndex: chapters.length + 1
    });
  };

  const handleSaveChapter = (chapterData: any) => {
    updateChapterMutation.mutate(chapterData);
  };

  const handleAIGenerateContent = (content: string, type: string) => {
    if (selectedChapter) {
      updateChapterMutation.mutate({
        ...selectedChapter,
        content: content,
        contentType: type
      });
    }
  };

  const handleAIGenerateModule = (module: { title: string; description: string }) => {
    createModuleMutation.mutate({
      ...module,
      orderIndex: modules.length + 1
    });
  };

  const handleAIGenerateChapter = (chapter: { title: string; content: string; contentType: string; duration: number }) => {
    createChapterMutation.mutate({
      ...chapter,
      orderIndex: chapters.length + 1
    });
  };

  const handleAIGenerateCompleteCourse = async (courseData: any) => {
    console.log("Starting AI course generation with data:", courseData);
    console.log("Course data structure:", JSON.stringify(courseData, null, 2));
    
    // Use the user's course title from the form instead of AI-generated title
    const courseTitle = newCourse.title || courseData.title;
    
    try {
      // Create the course
      const courseResponse = await apiRequest("POST", "/api/courses", {
        title: courseTitle,
        description: courseData.description,
        category: courseData.category,
        difficulty: courseData.difficulty
      });
      const createdCourse = await courseResponse.json();
      console.log("Course created:", createdCourse);

      // Create modules and chapters
      for (let moduleIndex = 0; moduleIndex < courseData.modules.length; moduleIndex++) {
        const moduleData = courseData.modules[moduleIndex];
        console.log(`Creating module ${moduleIndex + 1}:`, moduleData.title);
        console.log("Module data structure:", JSON.stringify(moduleData, null, 2));
        console.log("Module has discussions:", moduleData.discussions ? moduleData.discussions.length : 0);
        console.log("Module has quizzes:", moduleData.quizzes ? moduleData.quizzes.length : 0);
        console.log("Module has assignments:", moduleData.assignments ? moduleData.assignments.length : 0);
        
        const moduleResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/modules`, {
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleIndex + 1
        });
        const createdModule = await moduleResponse.json();
        console.log("Module created:", createdModule);

        // Create chapters for this module
        for (let chapterIndex = 0; chapterIndex < moduleData.chapters.length; chapterIndex++) {
          const chapterData = moduleData.chapters[chapterIndex];
          console.log(`Creating chapter ${chapterIndex + 1}:`, chapterData.title);
          
          await apiRequest("POST", `/api/modules/${createdModule.id}/chapters`, {
            title: chapterData.title,
            content: chapterData.content,
            contentType: "text",
            duration: 30,
            orderIndex: chapterIndex + 1
          });
        }

        // Create assignments for this module
        console.log("=== ASSIGNMENT CREATION START ===");
        console.log("Checking for assignments in module:", moduleData.title);
        console.log("Module data keys:", Object.keys(moduleData));
        console.log("Full module data:", JSON.stringify(moduleData, null, 2));
        console.log("Module index:", moduleIndex);
        console.log("Module title:", moduleData.title);
        
        if (moduleData.assignments && moduleData.assignments.length > 0) {
          console.log("Found assignments:", moduleData.assignments.length);
          for (let assignmentIndex = 0; assignmentIndex < moduleData.assignments.length; assignmentIndex++) {
            const assignmentData = moduleData.assignments[assignmentIndex];
            console.log(`Creating assignment ${assignmentIndex + 1} for module ${moduleIndex + 1} (${moduleData.title}):`, assignmentData.title);
            console.log("Assignment data:", JSON.stringify(assignmentData, null, 2));
            
            try {
              const assignmentResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/assignments`, {
                title: assignmentData.title,
                description: assignmentData.description,
                dueDate: new Date(assignmentData.dueDate).toISOString(),
                maxPoints: assignmentData.points
              });
              const createdAssignment = await assignmentResponse.json();
              console.log("Assignment created successfully:", createdAssignment);
            } catch (assignmentError) {
              console.error("Error creating assignment:", assignmentError);
            }
          }
        } else {
          console.log("No assignments found in module:", moduleData.title);
        }
        console.log("=== ASSIGNMENT CREATION END ===");

        // Create discussions for this module
        console.log("=== DISCUSSION CREATION START ===");
        console.log("Checking for discussions in module:", moduleData.title);
        console.log("moduleData.discussions:", moduleData.discussions);
        console.log("moduleData.discussions.length:", moduleData.discussions ? moduleData.discussions.length : 0);
        
        if (moduleData.discussions && moduleData.discussions.length > 0) {
          console.log("Found discussions:", moduleData.discussions.length);
          for (const discussionData of moduleData.discussions) {
            console.log("Creating discussion:", discussionData.title);
            console.log("Discussion data:", JSON.stringify(discussionData, null, 2));
            
            try {
              const discussionResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/discussions`, {
                title: discussionData.title,
                content: discussionData.prompt || "Share your thoughts and experiences with this module.", // Map prompt to content
                pinned: false,
                locked: false
              });
              const createdDiscussion = await discussionResponse.json();
              console.log("Discussion created successfully:", createdDiscussion);
            } catch (discussionError) {
              console.error("Error creating discussion:", discussionError);
            }
          }
        } else {
          console.log("No discussions found in module, creating default discussion");
          // Create a default discussion if none exist
          try {
            const discussionResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/discussions`, {
              title: "Module Discussion",
              content: "Share your thoughts and experiences with this module. What did you learn and what challenges did you face?",
              pinned: false,
              locked: false
            });
            const createdDiscussion = await discussionResponse.json();
            console.log("Default discussion created successfully:", createdDiscussion);
          } catch (discussionError) {
            console.error("Error creating default discussion:", discussionError);
          }
        }
        console.log("=== DISCUSSION CREATION END ===");

        // Create quizzes for this module (only if quizzes are mentioned in the prompt)
        // Check if the course data contains 'quiz' - if not, skip quiz creation entirely
        const coursePrompt = courseData.description || courseData.title || '';
        const promptIncludesQuiz = coursePrompt.toLowerCase().includes('quiz');
        
        console.log("=== QUIZ CREATION START ===");
        console.log("Course prompt:", coursePrompt);
        console.log("Prompt includes quiz:", promptIncludesQuiz);
        console.log("moduleData.quizzes:", moduleData.quizzes);
        console.log("moduleData.quizzes.length:", moduleData.quizzes ? moduleData.quizzes.length : 0);
        
        // Create quizzes if they exist OR if the prompt mentions quizzes
        if ((moduleData.quizzes && moduleData.quizzes.length > 0) || promptIncludesQuiz) {
          console.log("Creating quizzes - found in data or prompt includes quiz");
          
          // If no quizzes in data but prompt mentions quiz, create a default quiz
          const quizzesToCreate = moduleData.quizzes && moduleData.quizzes.length > 0 
            ? moduleData.quizzes 
            : [{
                title: `${moduleData.title} Quiz`,
                description: `Test your understanding of ${moduleData.title}`,
                timeLimit: 30,
                questions: [
                  {
                    question: "What did you learn in this module?",
                    type: "multiple-choice",
                    options: ["A lot", "Some", "A little", "Nothing"],
                    correctAnswer: "A lot",
                    points: 10
                  }
                ]
              }];
          
          console.log("Quizzes to create:", JSON.stringify(quizzesToCreate, null, 2));
          
          for (const quizData of quizzesToCreate) {
            console.log("Creating quiz:", quizData.title);
            console.log("Quiz data:", JSON.stringify(quizData, null, 2));
            
            const quizResponse = await apiRequest("POST", `/api/courses/${createdCourse.id}/quizzes`, {
              title: quizData.title,
              description: quizData.description,
              timeLimit: quizData.timeLimit || 30,
              maxPoints: 100
            });
            const createdQuiz = await quizResponse.json();
            console.log("Quiz created successfully:", createdQuiz);

            // Create questions for the quiz
            if (quizData.questions && quizData.questions.length > 0) {
              console.log("Creating questions for quiz:", quizData.title);
              console.log("Questions to create:", JSON.stringify(quizData.questions, null, 2));
              
              for (let questionIndex = 0; questionIndex < quizData.questions.length; questionIndex++) {
                const questionData = quizData.questions[questionIndex];
                console.log(`Creating question ${questionIndex + 1}:`, questionData.question?.substring(0, 50) + "...");
                console.log("Question data:", JSON.stringify(questionData, null, 2));
                
                // Validate and sanitize question data
                if (!questionData.question || typeof questionData.question !== 'string') {
                  console.warn("Invalid question data, skipping:", questionData);
                  continue;
                }
                
                const sanitizedQuestion = {
                  question: String(questionData.question || "Question"),
                  type: String(questionData.type || "multiple-choice"),
                  options: Array.isArray(questionData.options) && questionData.options.length > 0 
                    ? questionData.options.map((opt: any) => String(opt)).filter((opt: any) => opt.trim() !== '')
                    : ["Option 1", "Option 2", "Option 3", "Option 4"],
                  correctAnswer: String(questionData.correctAnswer || "Option 1"),
                  points: Number(questionData.points) || 10,
                  orderIndex: questionIndex + 1
                };
                
                // Ensure we have valid options
                if (sanitizedQuestion.options.length === 0) {
                  sanitizedQuestion.options = ["Option 1", "Option 2", "Option 3", "Option 4"];
                }
                
                // Ensure correctAnswer is one of the options
                if (!sanitizedQuestion.options.includes(sanitizedQuestion.correctAnswer)) {
                  sanitizedQuestion.correctAnswer = sanitizedQuestion.options[0];
                }
                
                try {
                  const questionResponse = await apiRequest("POST", `/api/quizzes/${createdQuiz.id}/questions`, {
                    question: sanitizedQuestion.question,
                    type: sanitizedQuestion.type,
                    options: sanitizedQuestion.options,
                    correctAnswer: sanitizedQuestion.correctAnswer,
                    points: sanitizedQuestion.points,
                    orderIndex: sanitizedQuestion.orderIndex
                  });
                  const createdQuestion = await questionResponse.json();
                  console.log("Question created successfully:", createdQuestion);
                } catch (questionError) {
                  console.error("Error creating question:", questionError);
                }
              }
            } else {
              console.log("No questions found in quiz data");
            }
          }
        } else {
          console.log("No quizzes to create - prompt doesn't mention quiz and no quiz data found");
        }
        console.log("=== QUIZ CREATION END ===");
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

      // Navigate to the new course builder page
      setLocation(`/course-builder/${createdCourse.id}`);
      
      toast({
        title: "Course Generated Successfully",
        description: "Your AI-generated course has been created. You are now on the course builder page.",
      });
      
    } catch (error) {
      console.error("Error generating complete course:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to create the complete course. Please try again.",
        variant: "destructive",
      });
    }
  };

    return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
        <div className="flex-1">
          {!courseId ? (
            // Course List View
            <main className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Course Builder</h1>
                  <p className="text-slate-600">Create and manage your courses</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setIsCourseDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Course
                    </Button>
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
                  className="hover:shadow-lg transition-shadow cursor-pointer"
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        <span>{course.category}</span>
                        <span className="mx-2">•</span>
                        <span>{course.difficulty}</span>
                      </div>
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

              {/* Create Course Dialog */}
              <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                          <DialogDescription>
                      Create a new course to start building your content.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                      <Label htmlFor="course-title">Course Title</Label>
                            <Input
                        id="course-title"
                        placeholder="Enter course title"
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                      <Label htmlFor="course-description">Description</Label>
                            <Textarea
                        id="course-description"
                        placeholder="Describe your course..."
                              rows={3}
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                            />
                          </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="course-category">Category</Label>
                        <Select value={newCourse.category} onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Programming">Programming</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="course-difficulty">Difficulty</Label>
                        <Select value={newCourse.difficulty} onValueChange={(value) => setNewCourse({ ...newCourse, difficulty: value })}>
                          <SelectTrigger>
                            <SelectValue />
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
                      <Button
                        onClick={() => {
                          setIsCourseDialogOpen(false);
                          setIsAICourseGeneratorOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Course Generator
                      </Button>
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
            </main>
          ) : (
            // Course Builder View
            <main className="p-6">
              {course ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => setLocation("/course-builder")}
                        variant="outline"
                        size="sm"
                      >
                        ← Back to Courses
                      </Button>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                        <p className="text-gray-600">{course.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => window.location.href = `/courses/${course.id}/preview`}
                        variant="outline"
                      >
                        Preview
                      </Button>
                      <Button onClick={() => setIsAIAssistantOpen(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Assistant
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold">Modules</h2>
                          <Button
                            onClick={() => setIsModuleDialogOpen(true)}
                            size="sm"
                          >
                            Add Module
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {modules.map((module: Module) => (
                      <div
                        key={module.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedModule?.id === module.id
                            ? "bg-blue-50 border-blue-200"
                                  : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                              <h3 className="font-medium">{module.title}</h3>
                              <p className="text-sm text-gray-600">{module.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      {selectedModule ? (
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Chapters in {selectedModule.title}</h2>
                            <Button
                              onClick={() => setIsChapterDialogOpen(true)}
                              size="sm"
                            >
                              Add Chapter
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {chapters.map((chapter: Chapter, index: number) => (
                              <div
                                key={chapter.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedChapter?.id === chapter.id
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-gray-50 hover:bg-gray-100"
                                }`}
                                onClick={() => setSelectedChapter(chapter)}
                              >
                                <h3 className="font-medium">{chapter.title}</h3>
                                <p className="text-sm text-gray-600">{chapter.content.substring(0, 100)}...</p>
                                {index === 0 && (
                                  <div className="mt-2">
                                    <video width="100%" controls>
                                      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                    </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-medium text-slate-800 mb-4">
                                Select a Module
                      </h3>
                      <p className="text-slate-600 mb-6">
                                Choose a module from the left to view and manage its chapters.
                      </p>
                      <Button 
                        onClick={() => setIsModuleDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                                Add Module
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

                  {selectedChapter && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold mb-4">Edit Chapter: {selectedChapter.title}</h2>
                      <ContentEditor
                        chapter={selectedChapter}
                        onSave={handleSaveChapter}
                        isLoading={false}
                        forceUpdate={0}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">No Course Selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please select a course from the list or create a new one to start building.
                  </p>
                </div>
              )}
        </main>
          )}
        </div>
      </div>

      {/* AI Course Generator */}
      {isAICourseGeneratorOpen && (
        <AICourseGenerator
          onGenerate={handleAIGenerateCompleteCourse}
          onClose={() => setIsAICourseGeneratorOpen(false)}
        />
      )}

      {/* AI Assistant */}
      {isAIAssistantOpen && selectedChapter && (
        <AIAssistant
          onGenerateChapter={handleAIGenerateChapter}
          onGenerateContent={handleAIGenerateContent}
          onGenerateModule={handleAIGenerateModule}
          courseTitle={course?.title}
          courseDescription={course?.description}
          disabled={!selectedChapter}
        />
      )}

      {/* Module Creation Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>
              Add a new module to organize your course content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-title">Module Title</Label>
              <Input
                id="module-title"
                placeholder="Enter module title"
                defaultValue="New Module"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-description">Description</Label>
              <Textarea
                id="module-description"
                placeholder="Describe this module..."
                rows={3}
                defaultValue="Module description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateModule}>
              Create Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Creation Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to the selected module.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="chapter-title">Chapter Title</Label>
              <Input
                id="chapter-title"
                placeholder="Enter chapter title"
                defaultValue="New Chapter"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chapter-content">Content</Label>
              <Textarea
                id="chapter-content"
                placeholder="Enter chapter content..."
                rows={5}
                defaultValue="Chapter content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateChapter}>
              Create Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}