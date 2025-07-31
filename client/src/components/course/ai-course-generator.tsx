import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Lightbulb, 
  Wand2, 
  Copy, 
  Check,
  Loader2,
  Brain,
  Target,
  Users,
  Clock,
  Award,
  Zap,
  Play,
  BookMarked,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AICourseGeneratorProps {
  onCourseGenerated: (courseData: {
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
  }) => void;
  disabled?: boolean;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const AI_MODELS: AIModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Advanced language model with deep understanding",
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: "claude-3",
    name: "Claude 3",
    description: "Anthropic's latest model with excellent reasoning",
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Google's multimodal AI with creative capabilities",
    icon: <Zap className="h-4 w-4" />
  }
];

export default function AICourseGenerator({
  onCourseGenerated,
  disabled = false
}: AICourseGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [coursePrompt, setCoursePrompt] = useState("");
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);
  const [courseDetails, setCourseDetails] = useState({
    title: "",
    description: "",
    category: "Programming",
    difficulty: "beginner"
  });

  const generateCompleteCourse = async () => {
    if (!coursePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a detailed prompt describing the course you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate AI course generation with different models
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const courseTemplates = {
        "gpt-4": {
          title: "Complete Course on " + coursePrompt.split(" ").slice(0, 3).join(" "),
          description: `A comprehensive course covering all aspects of ${coursePrompt}. This course is designed to take you from beginner to advanced level with practical examples and real-world projects.`,
          modules: [
            {
              title: "Introduction and Fundamentals",
              description: "Get started with the basics and understand core concepts",
              chapters: [
                {
                  title: "What is " + coursePrompt.split(" ")[0] + "?",
                  content: `# Introduction to ${coursePrompt.split(" ")[0]}

## Overview
This chapter provides a comprehensive introduction to ${coursePrompt.split(" ")[0]} and its importance in modern development.

## Learning Objectives
- Understand the basic concepts
- Learn about the history and evolution
- Explore real-world applications

## Key Topics
1. **Definition and Scope**: What exactly is ${coursePrompt.split(" ")[0]}?
2. **History and Evolution**: How did it develop over time?
3. **Current State**: What's happening in the field today?
4. **Future Trends**: Where is it heading?

## Practical Examples
- Basic setup and configuration
- Simple "Hello World" examples
- Common use cases and scenarios

## Summary
By the end of this chapter, you'll have a solid foundation to build upon.`,
                  contentType: "text",
                  duration: 45
                },
                {
                  title: "Setting Up Your Environment",
                  content: `# Setting Up Your Development Environment

## Prerequisites
Before we begin, you'll need to set up your development environment.

## Installation Steps
1. **Download Required Tools**
2. **Configure Your IDE**
3. **Set Up Version Control**
4. **Install Dependencies**

## Verification
- Test your installation
- Run your first program
- Troubleshoot common issues

## Best Practices
- Keep your environment updated
- Use virtual environments
- Follow security guidelines`,
                  contentType: "text",
                  duration: 30
                }
              ]
            },
            {
              title: "Core Concepts and Theory",
              description: "Deep dive into the fundamental principles and theories",
              chapters: [
                {
                  title: "Understanding Core Principles",
                  content: `# Core Principles of ${coursePrompt.split(" ")[0]}

## Fundamental Concepts
1. **Principle 1**: Detailed explanation with examples
2. **Principle 2**: Step-by-step breakdown
3. **Principle 3**: Advanced concepts and applications

## Theory Behind the Practice
- Mathematical foundations
- Logical reasoning
- Problem-solving approaches

## Real-World Applications
- Industry use cases
- Success stories
- Common challenges and solutions`,
                  contentType: "text",
                  duration: 60
                }
              ]
            },
            {
              title: "Practical Implementation",
              description: "Hands-on projects and real-world applications",
              chapters: [
                {
                  title: "Building Your First Project",
                  content: `# Your First Project

## Project Overview
We'll build a complete application that demonstrates all the concepts we've learned.

## Project Structure
- Planning and design
- Implementation steps
- Testing and debugging
- Deployment considerations

## Step-by-Step Guide
1. **Project Setup**
2. **Core Implementation**
3. **Advanced Features**
4. **Testing and Optimization**

## Best Practices
- Code organization
- Documentation
- Performance optimization
- Security considerations`,
                  contentType: "text",
                  duration: 90
                }
              ],
              assignments: [
                {
                  title: "Final Project Implementation",
                  description: "Create a complete application using all the concepts learned in this course. Submit your code, documentation, and a brief presentation.",
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
                  points: 100
                }
              ],
              quizzes: [
                {
                  title: "Practical Implementation Quiz",
                  description: "Test your understanding of practical implementation concepts",
                  timeLimit: 30,
                  questions: [
                    {
                      question: "What is the first step in building a project?",
                      type: "multiple-choice",
                      options: ["Planning and design", "Coding", "Testing", "Deployment"],
                      correctAnswer: "Planning and design",
                      points: 10
                    },
                    {
                      question: "Why is documentation important in project development?",
                      type: "text",
                      points: 15
                    }
                  ]
                }
              ],
              discussions: [
                {
                  title: "Project Challenges and Solutions",
                  description: "Share the challenges you faced during your project implementation and how you solved them",
                  prompt: "What was the most challenging aspect of your project, and how did you overcome it? Share your experience and learn from others."
                }
              ]
            }
          ]
        },
        "claude-3": {
          title: "Mastering " + coursePrompt.split(" ").slice(0, 2).join(" "),
          description: `An in-depth exploration of ${coursePrompt} with a focus on practical applications and real-world scenarios. This course combines theoretical knowledge with hands-on experience.`,
          modules: [
            {
              title: "Foundation and Basics",
              description: "Establish a strong foundation with essential concepts",
              chapters: [
                {
                  title: "Getting Started with " + coursePrompt.split(" ")[0],
                  content: `# Getting Started

## Welcome to the Course
This comprehensive course will guide you through ${coursePrompt} from the ground up.

## What You'll Learn
- Fundamental concepts and principles
- Practical implementation strategies
- Real-world problem solving
- Advanced techniques and optimization

## Course Structure
The course is organized into logical modules, each building upon the previous one.

## Getting the Most from This Course
- Complete all exercises
- Practice regularly
- Join the community
- Build your own projects`,
                  contentType: "text",
                  duration: 40
                }
              ],
              assignments: [
                {
                  title: "Foundation Concepts Assignment",
                  description: "Create a comprehensive summary of the foundational concepts covered in this module. Include examples and practical applications.",
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                  points: 50
                }
              ],
              quizzes: [
                {
                  title: "Foundation Basics Quiz",
                  description: "Test your understanding of the foundational concepts",
                  timeLimit: 20,
                  questions: [
                    {
                      question: "What are the key principles covered in this module?",
                      type: "text",
                      points: 10
                    },
                    {
                      question: "How do you apply these concepts in practice?",
                      type: "text",
                      points: 15
                    }
                  ]
                }
              ],
              discussions: [
                {
                  title: "Understanding Fundamentals",
                  description: "Discuss the importance of understanding fundamental concepts before moving to advanced topics",
                  prompt: "Why is it crucial to master the fundamentals before advancing to more complex topics? Share your thoughts and experiences."
                }
              ]
            }
          ]
        },
        "gemini-pro": {
          title: "Creative " + coursePrompt.split(" ").slice(0, 2).join(" ") + " Course",
          description: `An innovative approach to learning ${coursePrompt} with creative projects and interactive learning experiences.`,
          modules: [
            {
              title: "Creative Introduction",
              description: "Learn through creative and engaging methods",
              chapters: [
                {
                  title: "Creative Learning Approach",
                  content: `# Creative Learning Journey

## Why Creative Learning?
Traditional learning methods are effective, but creative approaches can make learning more engaging and memorable.

## Our Approach
- Interactive exercises
- Creative projects
- Real-world applications
- Collaborative learning

## What Makes This Different
- Hands-on projects from day one
- Creative problem-solving
- Real-world applications
- Community-driven learning`,
                  contentType: "text",
                  duration: 50
                }
              ],
              assignments: [
                {
                  title: "Creative Learning Project",
                  description: "Create a creative project that demonstrates your understanding of the concepts learned through innovative approaches.",
                  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
                  points: 75
                }
              ],
              quizzes: [
                {
                  title: "Creative Learning Assessment",
                  description: "Test your understanding of creative learning approaches",
                  timeLimit: 25,
                  questions: [
                    {
                      question: "What are the benefits of creative learning approaches?",
                      type: "text",
                      points: 15
                    },
                    {
                      question: "How can you apply creative methods to problem-solving?",
                      type: "text",
                      points: 20
                    }
                  ]
                }
              ],
              discussions: [
                {
                  title: "Creative Learning Experiences",
                  description: "Share your experiences with creative learning methods and their effectiveness",
                  prompt: "What creative learning methods have you found most effective? Share your experiences and learn from others' approaches."
                }
              ]
            }
          ]
        }
      };

      const template = courseTemplates[selectedModel as keyof typeof courseTemplates];
      const generatedData = {
        ...courseDetails,
        ...template,
        modules: template.modules
      };

      setGeneratedCourse(generatedData);
      
      toast({
        title: "Course Generated Successfully",
        description: `AI has created a complete course structure using ${AI_MODELS.find(m => m.id === selectedModel)?.name}.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedCourse = () => {
    if (generatedCourse) {
      onCourseGenerated(generatedCourse);
      setIsOpen(false);
      setGeneratedCourse(null);
      setCoursePrompt("");
      toast({
        title: "Course Applied Successfully",
        description: "The AI-generated course has been applied. You can now edit and customize it.",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" 
            disabled={disabled}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Course Generator
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Course Generator
            </DialogTitle>
            <DialogDescription>
              Create a complete course with modules and chapters using AI. Choose your preferred AI model and describe your course.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Course Setup</TabsTrigger>
              <TabsTrigger value="generate">AI Generation</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    value={courseDetails.title}
                    onChange={(e) => setCourseDetails({ ...courseDetails, title: e.target.value })}
                    placeholder="Enter course title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    value={courseDetails.description}
                    onChange={(e) => setCourseDetails({ ...courseDetails, description: e.target.value })}
                    placeholder="Describe your course..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={courseDetails.category}
                      onValueChange={(value) => setCourseDetails({ ...courseDetails, category: value })}
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
                      value={courseDetails.difficulty}
                      onValueChange={(value) => setCourseDetails({ ...courseDetails, difficulty: value })}
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
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Select AI Model</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {AI_MODELS.map((model) => (
                      <Card
                        key={model.id}
                        className={`cursor-pointer transition-all ${
                          selectedModel === model.id
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedModel(model.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-blue-600">{model.icon}</div>
                            <div>
                              <h4 className="font-semibold">{model.name}</h4>
                              <p className="text-sm text-slate-600">{model.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="course-prompt">Course Description Prompt</Label>
                  <Textarea
                    id="course-prompt"
                    value={coursePrompt}
                    onChange={(e) => setCoursePrompt(e.target.value)}
                    placeholder="Describe the course you want to create. Be specific about topics, learning objectives, and target audience..."
                    rows={4}
                  />
                  <p className="text-sm text-slate-500">
                    Example: "Create a comprehensive JavaScript course for beginners covering ES6, DOM manipulation, and modern web development practices"
                  </p>
                </div>

                <Button
                  onClick={generateCompleteCourse}
                  disabled={isGenerating || !coursePrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Complete Course
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {generatedCourse ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5" />
                        Generated Course: {generatedCourse.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">{generatedCourse.description}</p>
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline">{generatedCourse.category}</Badge>
                        <Badge variant="outline">{generatedCourse.difficulty}</Badge>
                        <Badge variant="outline">{generatedCourse.modules.length} Modules</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Course Structure:</h4>
                        {generatedCourse.modules.map((module: any, moduleIndex: number) => (
                          <div key={moduleIndex} className="border rounded-lg p-3 bg-slate-50">
                            <h5 className="font-medium text-slate-800 mb-2">
                              Module {moduleIndex + 1}: {module.title}
                            </h5>
                            <p className="text-sm text-slate-600 mb-2">{module.description}</p>
                            <div className="space-y-1">
                              {module.chapters.map((chapter: any, chapterIndex: number) => (
                                <div key={chapterIndex} className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  <span>Chapter {chapterIndex + 1}: {chapter.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {chapter.duration} min
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setGeneratedCourse(null)}>
                      Regenerate
                    </Button>
                    <Button onClick={applyGeneratedCourse}>
                      <Check className="h-4 w-4 mr-2" />
                      Apply Course
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No Course Generated Yet</h3>
                  <p className="text-slate-500">
                    Go to the "AI Generation" tab to create your course with AI.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
} 