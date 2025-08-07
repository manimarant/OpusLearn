import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Upload, BookOpen, Sparkles, Pencil, Trash2, Search, Filter, Loader2, FileText } from "lucide-react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ContentEditor from "@/components/course/content-editor";
import AIAssistant from "@/components/course/ai-assistant";
import { AICourseGenerator } from "@/components/course/ai-course-generator";
import CourseCard from "@/components/course/course-card";

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
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isEditChapterDialogOpen, setIsEditChapterDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isAICourseGeneratorOpen, setIsAICourseGeneratorOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner",
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseCategory, setEditCourseCategory] = useState("");
  const [editCourseDifficulty, setEditCourseDifficulty] = useState("");

  // Auto-save states
  const [moduleToSave, setModuleToSave] = useState<Module | null>(null);
  const [chapterToSave, setChapterToSave] = useState<any>(null);
  
  // Debounced auto-save triggers
  const debouncedModuleToSave = useDebounce(moduleToSave, 1000);
  const debouncedChapterToSave = useDebounce(chapterToSave, 1000);

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

  const { 
    data: chapters = [], 
    isLoading: chaptersLoading, 
    error: chaptersError 
  } = useQuery({
    queryKey: ["/api/chapters", selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule) return [];
      console.log("Fetching chapters for module:", selectedModule.id);
      const response = await apiRequest("GET", `/api/modules/${selectedModule.id}/chapters`);
      const data = await response.json();
      console.log("Chapters data:", data);
      return data;
    },
    enabled: !!selectedModule
  });

  // Auto-select first module when modules are loaded
  useEffect(() => {
    if (modules && modules.length > 0 && !selectedModule) {
      console.log("Auto-selecting first module:", modules[0]);
      setSelectedModule(modules[0]);
    }
  }, [modules, selectedModule]);

  // Auto-save effects
  useEffect(() => {
    if (debouncedModuleToSave && debouncedModuleToSave.id) {
      autoSaveModuleMutation.mutate(debouncedModuleToSave);
    }
  }, [debouncedModuleToSave]);

  useEffect(() => {
    if (debouncedChapterToSave && debouncedChapterToSave.id) {
      autoSaveChapterMutation.mutate(debouncedChapterToSave);
    }
  }, [debouncedChapterToSave]);



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

  const updateCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("PUT", `/api/courses/${courseId}`, courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      toast({
        title: "Course Updated",
        description: "Your course has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
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



  const updateModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest("PUT", `/api/modules/${moduleData.id}`, moduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "modules"] });
      setIsEditModuleDialogOpen(false);
      toast({
        title: "Module Saved",
        description: "Your module changes have been saved.",
      });
    }
  });

  // Auto-save mutation for modules
  const autoSaveModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest("PUT", `/api/modules/${moduleData.id}`, moduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "modules"] });
    },
    onError: (error) => {
      console.error("Auto-save failed for module:", error);
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest("DELETE", `/api/modules/${moduleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "modules"] });
      toast({
        title: "Module Deleted",
        description: "Module has been deleted successfully.",
      });
    }
  });

    const updateChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest("PUT", `/api/chapters/${chapterData.id}`, chapterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", selectedModule?.id] });
      toast({
        title: "Chapter Saved",
        description: "Your changes have been saved.",
      });
    }
  });

  // Auto-save mutation for chapters
  const autoSaveChapterMutation = useMutation({
    mutationFn: async (chapterData: any) => {
      const response = await apiRequest("PUT", `/api/chapters/${chapterData.id}`, chapterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", selectedModule?.id] });
    },
    onError: (error) => {
      console.error("Auto-save failed for chapter:", error);
    }
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: number) => {
      const response = await apiRequest("DELETE", `/api/chapters/${chapterId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", selectedModule?.id] });
      toast({
        title: "Chapter Deleted",
        description: "Chapter has been deleted successfully.",
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



  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsEditModuleDialogOpen(true);
  };

  const handleUpdateModule = () => {
    if (editingModule) {
      const titleInput = document.getElementById("edit-module-title") as HTMLInputElement;
      const descriptionInput = document.getElementById("edit-module-description") as HTMLTextAreaElement;
      updateModuleMutation.mutate({
        ...editingModule,
        title: titleInput.value,
        description: descriptionInput.value,
      });
    }
  };

  const handleDeleteModule = (moduleId: number) => {
    if (window.confirm("Are you sure you want to delete this module and all its chapters?")) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setIsEditChapterDialogOpen(true);
  };

  const handleUpdateChapter = () => {
    if (editingChapter) {
      const titleInput = document.getElementById("edit-chapter-title") as HTMLInputElement;
      const contentInput = document.getElementById("edit-chapter-content") as HTMLTextAreaElement;
      updateChapterMutation.mutate({
        ...editingChapter,
        title: titleInput.value,
        content: contentInput.value,
      });
    }
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (window.confirm("Are you sure you want to delete this chapter?")) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleSaveChapter = (chapterData: any) => {
    // Use auto-save mutation for better UX (no toast notifications)
    autoSaveChapterMutation.mutate(chapterData);
  };

  const handleEditCourse = () => {
    if (course) {
      setEditingCourse(course);
      setEditCourseCategory(course.category);
      setEditCourseDifficulty(course.difficulty);
      setIsCourseDialogOpen(true);
    }
  };

  const handleUpdateCourse = () => {
    if (editingCourse) {
      const titleInput = document.getElementById("edit-course-title") as HTMLInputElement;
      const descriptionInput = document.getElementById("edit-course-description") as HTMLTextAreaElement;
      
      updateCourseMutation.mutate({
        title: titleInput?.value || editingCourse.title,
        description: descriptionInput?.value || editingCourse.description,
        category: editCourseCategory,
        difficulty: editCourseDifficulty,
      });
    }
  };



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

  const handleDeleteCourse = (courseId: number) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  // Filter courses for search and category
  const filteredCourses = courses?.filter((course: any) => {
    const matchesSearch = course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course?.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

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
          {/* Main content goes here */}
            {!courseId ? (
              // Redirect to My Courses for course selection
              <main className="flex-1 p-8">
                <div className="max-w-2xl mx-auto text-center py-16">
                  <BookOpen className="h-24 w-24 text-slate-300 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Course Builder</h2>
                  <p className="text-slate-600 mb-8">
                    Select a course to start building content, or create a new course to get started.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => setLocation('/courses')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse My Courses
                    </Button>
                    <Button
                      onClick={() => setIsAICourseGeneratorOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create with AI
                    </Button>
            </div>
                </div>

                {/* AI Course Generator */}
                {isAICourseGeneratorOpen && (
                  <AICourseGenerator
                    onGenerate={handleAIGenerateCompleteCourse}
                    onClose={() => setIsAICourseGeneratorOpen(false)}
                  />
                )}
              </main>
          ) : (
            // Course Builder View
            <main className="flex-1 p-8">
              {/* Course Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                      <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation('/courses')}
                        className="text-slate-600 hover:text-slate-800"
                      >
                        ← Back to Courses
                      </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">
                      {course?.title || "Loading..."}
                    </h1>
                    <p className="text-slate-600 mt-1">
                      {course?.description || "Loading course details..."}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant={course?.status === 'published' ? 'default' : 'secondary'}>
                        {course?.status || 'loading'}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        Category: {course?.category || 'loading'}
                      </span>
                      <span className="text-sm text-slate-500">
                        Difficulty: {course?.difficulty || 'loading'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleEditCourse}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAIAssistantOpen(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assistant
                    </Button>

                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Modules Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-8">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Course Modules</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsModuleDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                                              <div className="space-y-2">
                          {modules.map((module: any, index: number) => (
                            <div
                              key={module.id}
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                                selectedModule?.id === module.id
                                  ? 'bg-blue-100 border-2 border-blue-300 shadow-sm'
                                  : 'bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200'
                              }`}
                              onClick={() => setSelectedModule(module)}
                              title={`Click to select ${module.title}`}
                            >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  Module {index + 1}
                                </p>
                                <p className="text-xs text-slate-600 truncate">
                                  {module.title}
                                </p>
                              </div>

                            </div>
                          </div>
                        ))}
                        {modules.length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">No modules yet</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsModuleDialogOpen(true)}
                              className="mt-2"
                            >
                              Add your first module
                            </Button>
                                  </div>
                                )}
                              </div>
                    </CardContent>
                  </Card>
                          </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                  {selectedModule ? (
                    <div className="space-y-6">
                      {/* Module Header */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <Input
                                value={selectedModule.title}
                                onChange={(e) => {
                                  const updatedModule = { ...selectedModule, title: e.target.value };
                                  setSelectedModule(updatedModule);
                                  setModuleToSave(updatedModule);
                                }}
                                className="text-xl font-bold text-slate-800 border-none bg-transparent p-0 h-auto focus:ring-0 focus:border-none"
                                placeholder="Module title"
                              />
                              <Textarea
                                value={selectedModule.description || ''}
                                onChange={(e) => {
                                  const updatedModule = { ...selectedModule, description: e.target.value };
                                  setSelectedModule(updatedModule);
                                  setModuleToSave(updatedModule);
                                }}
                                className="text-slate-600 mt-1 border-none bg-transparent p-0 resize-none focus:ring-0 focus:border-none min-h-[1.5rem]"
                                placeholder="Module description"
                                rows={1}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteModule(selectedModule.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chapters */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Chapters</h3>
                            <Button
                              size="sm"
                              onClick={() => setIsChapterDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Chapter
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {chaptersLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-sm text-slate-600">Loading chapters...</span>
                              </div>
                            ) : chaptersError ? (
                              <div className="text-center py-8 text-red-500">
                                <p className="text-sm">Error loading chapters: {chaptersError.message}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.location.reload()}
                                  className="mt-2"
                                >
                                  Retry
                                </Button>
                              </div>
                            ) : chapters.length > 0 ? (
                              chapters.map((chapter: any, index: number) => (
                                <div
                                  key={chapter.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedChapter?.id === chapter.id
                                      ? 'border-blue-300 bg-blue-50'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                  onClick={() => setSelectedChapter(chapter)}
                                >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                        {index + 1}
                                      </span>
                                      <div className="flex-1">
                                        <Input
                                          value={chapter.title}
                                          onChange={(e) => {
                                            const updatedChapter = { ...chapter, title: e.target.value };
                                            setChapterToSave(updatedChapter);
                                          }}
                                          className="font-medium text-slate-800 border-none bg-transparent p-0 h-auto focus:ring-0 focus:border-none"
                                          placeholder="Chapter title"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <p className="text-sm text-slate-600">
                                          Duration: {chapter.duration} minutes
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChapter(chapter.id);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              )
                            )) : (
                              <div className="text-center py-8 text-slate-500">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">No chapters in this module</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setIsChapterDialogOpen(true)}
                                  className="mt-2"
                                >
                                  Add your first chapter
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chapter Content Editor */}
                      {selectedChapter && (
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Chapter Content</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAIAssistantOpen(true)}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                AI Help
                              </Button>
                            </div>
                            <ContentEditor
                              chapter={selectedChapter}
                              onSave={handleSaveChapter}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {/* Course Overview */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Course Overview</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
                              <div className="text-sm text-slate-600">Learning Modules</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{chapters.length}</div>
                              <div className="text-sm text-slate-600">Content Units</div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {Math.ceil(chapters.length * 15 / 60)}h
                              </div>
                              <div className="text-sm text-slate-600">Estimated Time</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                          {modules.length > 0 ? "Select a Module to Continue" : "Create Your First Module"}
                        </h3>
                        <p className="text-slate-600 mb-6">
                          {modules.length > 0 
                            ? "Click on a module from the sidebar to view and edit its chapters, assignments, and content."
                            : "Start building your course by creating your first learning module. Each module will contain chapters, assignments, and assessments."
                          }
                        </p>
                        {modules.length > 0 ? (
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={() => setSelectedModule(modules[0])}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Select First Module
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsModuleDialogOpen(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add New Module
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setIsModuleDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Module
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Create Module Dialog */}
              <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Module</DialogTitle>
                    <DialogDescription>
                      Create a new module to organize your course content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="module-title">Module Title</Label>
                      <Input
                        id="module-title"
                        placeholder="Enter module title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="module-description">Description</Label>
                      <Textarea
                        id="module-description"
                        placeholder="Enter module description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateModule} disabled={createModuleMutation.isPending}>
                      {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Create Chapter Dialog */}
              <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Chapter</DialogTitle>
                    <DialogDescription>
                      Create a new chapter in {selectedModule?.title || "this module"}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="chapter-title">Chapter Title</Label>
                      <Input
                        id="chapter-title"
                        placeholder="Enter chapter title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chapter-content">Content</Label>
                      <Textarea
                        id="chapter-content"
                        placeholder="Enter chapter content"
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChapter} disabled={createChapterMutation.isPending}>
                      {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Module Dialog */}
              <Dialog open={isEditModuleDialogOpen} onOpenChange={setIsEditModuleDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Module</DialogTitle>
                    <DialogDescription>
                      Update module information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-module-title">Module Title</Label>
                      <Input
                        id="edit-module-title"
                        defaultValue={editingModule?.title}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-module-description">Description</Label>
                      <Textarea
                        id="edit-module-description"
                        defaultValue={editingModule?.description}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditModuleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateModule} disabled={updateModuleMutation.isPending}>
                      {updateModuleMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Chapter Dialog */}
              <Dialog open={isEditChapterDialogOpen} onOpenChange={setIsEditChapterDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Chapter</DialogTitle>
                    <DialogDescription>
                      Update chapter information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-chapter-title">Chapter Title</Label>
                      <Input
                        id="edit-chapter-title"
                        defaultValue={editingChapter?.title}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-chapter-content">Content</Label>
                      <Textarea
                        id="edit-chapter-content"
                        defaultValue={editingChapter?.content}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditChapterDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateChapter} disabled={updateChapterMutation.isPending}>
                      {updateChapterMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>



              {/* AI Assistant Panel */}
              {isAIAssistantOpen && (
                <AIAssistant
                  onGenerate={handleAIGenerateContent}
                  onGenerateModule={handleAIGenerateModule}
                  onGenerateChapter={handleAIGenerateChapter}
                  onClose={() => setIsAIAssistantOpen(false)}
                />
              )}
            </main>
            )}
          </div>
        </div>

        {/* AI Course Generator - Global */}
        {isAICourseGeneratorOpen && (
          <AICourseGenerator
            onGenerate={handleAIGenerateCompleteCourse}
            onClose={() => setIsAICourseGeneratorOpen(false)}
          />
        )}

        {/* Edit Course Dialog - Global */}
        <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update your course information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-course-title">Course Title</Label>
                <Input
                  id="edit-course-title"
                  defaultValue={editingCourse?.title}
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <Label htmlFor="edit-course-description">Description</Label>
                <Textarea
                  id="edit-course-description"
                  defaultValue={editingCourse?.description}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-course-category">Category</Label>
                  <Select value={editCourseCategory} onValueChange={setEditCourseCategory}>
                    <SelectTrigger id="edit-course-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-course-difficulty">Difficulty</Label>
                  <Select value={editCourseDifficulty} onValueChange={setEditCourseDifficulty}>
                    <SelectTrigger id="edit-course-difficulty">
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
              <Button variant="outline" onClick={() => {
                setIsCourseDialogOpen(false);
                setEditingCourse(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCourse} disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}