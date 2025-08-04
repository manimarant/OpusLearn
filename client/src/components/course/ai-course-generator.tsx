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

  // Debug useEffect
  useEffect(() => {
    console.log("generatedCourse changed:", generatedCourse);
  }, [generatedCourse]);

  useEffect(() => {
    console.log("activeTab changed:", activeTab);
  }, [activeTab]);

  // Handle prompt template selection
  const handlePromptTemplateChange = (templateId: string) => {
    setSelectedPromptTemplate(templateId);
    const template = promptTemplates.find(t => t.id === templateId);
    if (template) {
      setCoursePrompt(template.prompt);
    }
  };

  const availableModels = [
    "deepseek-coder:6.7b",
    "llama3.2:3b", 
    "llama3.2:1b"
  ];

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
      console.log("AI Response:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate course");
      } else {
        console.log("Setting generated course:", data.course); // Debug log
        setGeneratedCourse(data.course);
        toast({
          title: "Course Generated Successfully",
          description: `AI has created a complete course structure using ${selectedModel}.`,
        });
      }

      setActiveTab("preview");
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
            <TabsTrigger value="preview" disabled={!generatedCourse}>Preview</TabsTrigger>
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

            <TabsContent value="preview" className="h-full p-6 overflow-y-auto">
              
              {/* Debug information */}
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-sm font-medium">Debug Info:</p>
                <p className="text-xs">activeTab: {activeTab}</p>
                <p className="text-xs">generatedCourse exists: {generatedCourse ? 'Yes' : 'No'}</p>
                <p className="text-xs">generatedCourse title: {generatedCourse?.title || 'N/A'}</p>
                <p className="text-xs">modules count: {generatedCourse?.modules?.length || 0}</p>
                <p className="text-xs">Raw generatedCourse: {JSON.stringify(generatedCourse, null, 2).substring(0, 500)}...</p>
              </div>
              
              {generatedCourse ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{generatedCourse.title}</h3>
                      <p className="text-gray-600">{generatedCourse.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{generatedCourse.category}</Badge>
                      <Badge variant="outline">{generatedCourse.difficulty}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(getContentStats(generatedCourse)).map(([key, value]) => (
                      <Card key={key} className="text-center">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-blue-600">{value}</div>
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Course Structure</h4>
                    {generatedCourse.modules.map((module, moduleIndex) => (
                      <Card key={moduleIndex}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{module.title}</span>
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2">Chapters ({module.chapters.length})</h5>
                              <ul className="space-y-1 text-sm">
                                {module.chapters.map((chapter, chapterIndex) => (
                                  <li key={chapterIndex} className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>{chapter.title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-3">
                              {module.assignments && module.assignments.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2 flex items-center space-x-1">
                                    <FileText className="h-4 w-4" />
                                    <span>Assignments ({module.assignments.length})</span>
                                  </h5>
                                  <ul className="space-y-1 text-sm">
                                    {module.assignments.map((assignment, assignmentIndex) => (
                                      <li key={assignmentIndex} className="flex items-center justify-between">
                                        <span>{assignment.title}</span>
                                        <Badge variant="outline">{assignment.points} pts</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {module.quizzes && module.quizzes.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2 flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Quizzes ({module.quizzes.length})</span>
                                  </h5>
                                  <ul className="space-y-1 text-sm">
                                    {module.quizzes.map((quiz, quizIndex) => (
                                      <li key={quizIndex} className="flex items-center justify-between">
                                        <span>{quiz.title}</span>
                                        <Badge variant="outline">
                                          {quiz.timeLimit ? `${quiz.timeLimit}m` : 'Quiz'}
                                        </Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {module.discussions && module.discussions.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2 flex items-center space-x-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Discussions ({module.discussions.length})</span>
                                  </h5>
                                  <ul className="space-y-1 text-sm">
                                    {module.discussions.map((discussion, discussionIndex) => (
                                      <li key={discussionIndex}>{discussion.title}</li>
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
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer buttons for preview tab */}
        {activeTab === "preview" && (
          <div className="flex-shrink-0 p-6 border-t bg-gray-50">
            <div className="flex space-x-3">
              <Button onClick={handleCreateCourse} className="flex-1" disabled={!generatedCourse}>
                Create Course
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("setup")}>
                Generate Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 