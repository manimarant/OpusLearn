import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, BookOpen, FileText, MessageSquare, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface AICourseGeneratorProps {
  onGenerate: (courseData: any) => void;
  onClose: () => void;
}

interface GeneratedCourse {
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
      timeLimit?: number;
      questions?: Array<{
        question: string;
        type: string;
        options?: string[];
        correctAnswer?: string;
        points: number;
      }>;
    }>;
    discussions?: Array<{
      title: string;
      prompt: string;
    }>;
  }>;
}

export function AICourseGenerator({ onGenerate, onClose }: AICourseGeneratorProps) {
  const [coursePrompt, setCoursePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek-coder:6.7b");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState("");
  const { toast } = useToast();

  // Pre-constructed prompts that are unique and encourage AI generation
  const promptTemplates = [
    {
      id: "ai-ml-beginners",
      name: "AI/ML for Beginners",
      description: "Comprehensive AI/ML course with practical projects",
      prompt: "Create an introductory course on Artificial Intelligence and Machine Learning for complete beginners. Focus on practical applications, real-world examples, and hands-on projects. Include modern AI tools and frameworks."
    },
    {
      id: "web-development",
      name: "Modern Web Development",
      description: "Full-stack web development with modern technologies",
      prompt: "Design a comprehensive web development course covering modern frontend and backend technologies. Include responsive design, modern JavaScript frameworks, API development, and deployment strategies."
    },
    {
      id: "python-basics",
      name: "Python Programming",
      description: "Python from basics to advanced concepts",
      prompt: "Create a Python programming course that covers everything from basic syntax to advanced topics like web development, data analysis, and automation. Include practical projects and real-world applications."
    },
    {
      id: "data-science",
      name: "Data Science & Analytics",
      description: "Data analysis, visualization, and machine learning",
      prompt: "Develop a data science course that teaches data analysis, visualization, statistical modeling, and introductory machine learning. Include tools like Python, pandas, matplotlib, and scikit-learn."
    },
    {
      id: "javascript-es6",
      name: "Modern JavaScript Development",
      description: "ES6+, React, Node.js, and modern web development",
      prompt: "Create an advanced JavaScript course covering modern ES6+ features, React development, Node.js backend, and full-stack web applications. Focus on practical, industry-relevant skills."
    }
  ];

  // Auto-switch to preview when course is generated
  useEffect(() => {
    console.log("useEffect triggered - generatedCourse:", generatedCourse?.title, "activeTab:", activeTab);
    if (generatedCourse && activeTab === "generation") {
      console.log("Auto-switching to preview tab");
      setActiveTab("preview");
    }
  }, [generatedCourse, activeTab]);

  // Handle prompt template selection
  const handlePromptTemplateChange = (templateId: string) => {
    setSelectedPromptTemplate(templateId);
    const template = promptTemplates.find(t => t.id === templateId);
    if (template) {
      setCoursePrompt(template.prompt);
    }
  };

  const availableModels = [
    "codellama:7b",
    "deepseek-coder:6.7b",
    "llama3.2:3b", 
    "llama3.2:1b"
  ];

  // Helper function to extract main topic from prompt
  const extractTopicFromPrompt = (prompt: string): string => {
    // Clean the prompt and extract key terms
    let cleanPrompt = prompt.toLowerCase()
        .replace(/create\s+(a\s+)?course\s+(on|about|for)\s+/i, '')
        .replace(/with\s+\d+\s*modules?/i, '')
        .replace(/with\s+\d+\s*chapters?/i, '')
        .replace(/\d+\s*modules?/i, '')
        .replace(/\d+\s*chapters?/i, '')
        .trim();
    
    // Take first few meaningful words
    const words = cleanPrompt.split(/\s+/).filter(word => 
        word.length > 2 && 
        !['the', 'and', 'for', 'with', 'each', 'course'].includes(word)
    );
    
    return words.slice(0, 3).join(' ') || 'Programming';
  };

  // Function to clean up generated course data - simplified since server now generates clean content
  const cleanGeneratedCourseData = (courseData: GeneratedCourse, originalPrompt: string): GeneratedCourse => {
    // Since we've improved the server-side generation, just return the data as-is
    // The server should now generate clean titles and content
    return courseData;
  };

  const generateCompleteCourse = async () => {
    if (!coursePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a course prompt to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setActiveTab("generation");

    try {
      const response = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coursePrompt,
          model: selectedModel,
        }),
      });

             const data = await response.json();
       console.log("=== CLIENT-SIDE AI RESPONSE ===");
       console.log("Response status:", response.ok);
       console.log("Course title:", data.course?.title);
       console.log("Modules count:", data.course?.modules?.length);
       console.log("=== END CLIENT-SIDE AI RESPONSE ===");

       if (!response.ok) {
         throw new Error(data.message || "Failed to generate course");
               } else {
          // Clean up the generated course data to extract topics from titles
          const cleanedCourse = cleanGeneratedCourseData(data.course, coursePrompt);
          console.log("Setting generated course:", cleanedCourse.title);
          console.log("Course data structure:", {
            title: cleanedCourse.title,
            modules: cleanedCourse.modules?.length,
            hasData: !!cleanedCourse
          });
          setGeneratedCourse(cleanedCourse);
         
        toast({
          title: "Course Generated Successfully",
          description: `AI has created a complete course structure using ${selectedModel}.`,
        });
      }
    } catch (error) {
      console.error("Error generating course:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate course. Please try again.",
        variant: "destructive",
      });
      setActiveTab("setup");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCourse = () => {
    if (generatedCourse) {
      onGenerate(generatedCourse);
      onClose();
      toast({
        title: "Course Creation Started",
        description: "Your AI-generated course is being created. You'll see it in your course list shortly.",
      });
    }
  };

  const getContentStats = (course: GeneratedCourse) => {
    const totalModules = course.modules.length;
    const totalChapters = course.modules.reduce((sum, module) => sum + module.chapters.length, 0);
    const totalAssignments = course.modules.reduce((sum, module) => sum + (module.assignments?.length || 0), 0);
    const totalQuizzes = course.modules.reduce((sum, module) => sum + (module.quizzes?.length || 0), 0);
    const totalDiscussions = course.modules.reduce((sum, module) => sum + (module.discussions?.length || 0), 0);

    return { totalModules, totalChapters, totalAssignments, totalQuizzes, totalDiscussions };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">AI Course Generator</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="setup" disabled={isGenerating}>Setup</TabsTrigger>
            <TabsTrigger value="generation" disabled={!coursePrompt.trim()}>Generation</TabsTrigger>
                         <TabsTrigger value="preview" disabled={!generatedCourse}>
               Preview {generatedCourse ? '(Ready)' : '(Empty)'}
             </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="setup" className="h-full overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="prompt-template">Quick Start Templates</Label>
                  <Select value={selectedPromptTemplate} onValueChange={handlePromptTemplateChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a pre-built template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-sm text-gray-500">{template.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    💡 <strong>Tip:</strong> Choose a template for quick start, or write your own prompt for unique AI-generated content. All courses are generated by AI.
                  </p>
                </div>

                <div>
                  <Label htmlFor="prompt">Course Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the course you want to create (e.g., 'JavaScript for beginners with ES6, DOM manipulation, and modern web development')"
                    value={coursePrompt}
                    onChange={(e) => setCoursePrompt(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 <strong>Custom:</strong> Write your own prompt for unique, AI-generated content tailored to your specific needs. All content is generated by AI.
                  </p>
                </div>

                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model}</span>
                            <span className="text-sm text-gray-500">
                              {model.includes("llama3.2") ? "Fast and reliable" : "Best for programming"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    💡 <strong>Free AI:</strong> Using Ollama for local AI generation. 
                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      Install Ollama
                    </a>
                  </p>
                </div>

                <Button 
                  onClick={generateCompleteCourse}
                  disabled={!coursePrompt.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Complete Course
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="generation" className="h-full flex items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generating Your Course</h3>
                <p className="text-gray-600 text-center max-w-md">
                  AI is creating a comprehensive course structure with modules, chapters, assignments, quizzes, and discussions...
                </p>
                <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" />
                  <span>Using {selectedModel} for AI generation</span>
                </div>
              </div>
            </TabsContent>

                        {activeTab === "preview" && (
              <div className="h-full p-6 overflow-y-auto">
                {/* Force render test */}
                <div style={{backgroundColor: 'red', color: 'white', padding: '20px', margin: '20px'}}>
                  <h1>PREVIEW TAB TEST</h1>
                  <p>If you can see this red box, the preview tab is rendering.</p>
                  <p>Active Tab: {activeTab}</p>
                  <p>Generated Course: {generatedCourse ? 'EXISTS' : 'NULL'}</p>
                </div>
                
                 {generatedCourse ? (
                <div className="space-y-6">
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{generatedCourse.title}</h3>
                        <p className="text-gray-700 text-lg leading-relaxed">{generatedCourse.description}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Badge variant="secondary" className="text-sm px-3 py-1">{generatedCourse.category}</Badge>
                        <Badge variant="outline" className="text-sm px-3 py-1">{generatedCourse.difficulty}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Course Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(getContentStats(generatedCourse)).map(([key, value]) => (
                      <Card key={key} className="text-center hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{value}</div>
                          <div className="text-sm text-gray-600 capitalize font-medium">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h4 className="text-xl font-semibold text-gray-900">Course Structure</h4>
                    </div>
                    {generatedCourse.modules.map((module, moduleIndex) => (
                      <Card key={moduleIndex} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                          <CardTitle className="flex items-center space-x-2 text-lg">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {moduleIndex + 1}
                            </div>
                            <span>{module.title}</span>
                          </CardTitle>
                          <CardDescription className="text-gray-700">{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Chapters ({module.chapters.length})</span>
                              </h5>
                              <ul className="space-y-2">
                                {module.chapters.map((chapter, chapterIndex) => (
                                  <li key={chapterIndex} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-sm font-medium">{chapter.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-4">
                              {module.assignments && module.assignments.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span>Assignments ({module.assignments.length})</span>
                                  </h5>
                                  <ul className="space-y-2">
                                    {module.assignments.map((assignment, assignmentIndex) => (
                                      <li key={assignmentIndex} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm font-medium">{assignment.title}</span>
                                        <Badge variant="outline" className="text-xs">{assignment.points} pts</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {module.quizzes && module.quizzes.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span>Quizzes ({module.quizzes.length})</span>
                                  </h5>
                                  <ul className="space-y-2">
                                    {module.quizzes.map((quiz, quizIndex) => (
                                      <li key={quizIndex} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm font-medium">{quiz.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {quiz.timeLimit ? `${quiz.timeLimit}m` : 'Quiz'}
                                        </Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {module.discussions && module.discussions.length > 0 && (
                                <div>
                                  <h5 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
                                    <MessageSquare className="h-4 w-4 text-orange-600" />
                                    <span>Discussions ({module.discussions.length})</span>
                                  </h5>
                                  <ul className="space-y-2">
                                    {module.discussions.map((discussion, discussionIndex) => (
                                      <li key={discussionIndex} className="p-2 rounded hover:bg-gray-50">
                                        <span className="text-sm font-medium">{discussion.title}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-12">
                   <div className="text-center">
                     <h3 className="text-lg font-semibold mb-2">No Course Generated</h3>
                     <p className="text-gray-600 mb-4">
                       No course content is available. Please generate a course first.
                     </p>
                     <Button onClick={() => setActiveTab("setup")}>
                       Go to Setup
                     </Button>
                   </div>
                 </div>
               )}
               </div>
             )}
          </div>
        </Tabs>
        
        {/* Footer buttons for preview tab */}
        {activeTab === "preview" && (
          <div className="flex-shrink-0 p-6 border-t bg-gray-50">
            <div className="flex space-x-3">
              <Button onClick={handleCreateCourse} className="flex-1 h-12 text-base font-medium" disabled={!generatedCourse}>
                Create Course
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("setup")} className="flex-1 h-12 text-base font-medium">
                Generate Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 