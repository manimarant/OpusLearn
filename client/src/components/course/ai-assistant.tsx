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
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantProps {
  courseTitle?: string;
  courseDescription?: string;
  onGenerateContent?: (content: string, type: string) => void;
  onGenerateModule?: (module: { title: string; description: string }) => void;
  onGenerateLesson?: (lesson: { title: string; content: string; contentType: string; duration: number }) => void;
  disabled?: boolean;
}

export default function AIAssistant({
  courseTitle,
  courseDescription,
  onGenerateContent,
  onGenerateModule,
  onGenerateLesson,
  disabled = false
}: AIAssistantProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [contentType, setContentType] = useState("text");
  const [lessonDuration, setLessonDuration] = useState(15);

  // AI Content Generation Functions
  const generateCourseContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for the AI to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const context = courseTitle ? `Course: ${courseTitle}` : "";
      const description = courseDescription ? `Description: ${courseDescription}` : "";
      
      const generatedText = `Based on your prompt: "${prompt}"

${context}
${description}

Here's the AI-generated content:

# ${prompt}

## Introduction
This section provides a comprehensive overview of the topic, designed to engage learners and establish foundational knowledge.

## Key Concepts
- **Concept 1**: Detailed explanation with practical examples
- **Concept 2**: Step-by-step breakdown with visual aids
- **Concept 3**: Real-world applications and case studies

## Learning Objectives
By the end of this lesson, students will be able to:
1. Understand the core principles
2. Apply concepts in practical scenarios
3. Demonstrate mastery through assessments

## Interactive Elements
- **Discussion Questions**: Thought-provoking prompts for engagement
- **Practice Exercises**: Hands-on activities to reinforce learning
- **Assessment**: Knowledge checks to validate understanding

## Summary
A concise recap of the main points covered in this lesson.`;

      setGeneratedContent(generatedText);
      
      toast({
        title: "Content Generated",
        description: "AI has created content based on your prompt.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateModuleStructure = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const moduleSuggestions = [
        {
          title: "Introduction to the Fundamentals",
          description: "Lay the groundwork with essential concepts and terminology"
        },
        {
          title: "Core Principles and Methods",
          description: "Deep dive into the main techniques and approaches"
        },
        {
          title: "Practical Applications",
          description: "Real-world examples and hands-on practice"
        },
        {
          title: "Advanced Techniques",
          description: "Complex scenarios and optimization strategies"
        },
        {
          title: "Assessment and Review",
          description: "Comprehensive testing and knowledge validation"
        }
      ];

      const randomModule = moduleSuggestions[Math.floor(Math.random() * moduleSuggestions.length)];
      
      if (onGenerateModule) {
        onGenerateModule(randomModule);
        toast({
          title: "Module Generated",
          description: "AI has created a module structure for your course.",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLessonPlan = async () => {
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      const lessonTypes = [
        { type: "text", duration: 15, title: "Understanding Core Concepts" },
        { type: "video", duration: 20, title: "Step-by-Step Tutorial" },
        { type: "interactive", duration: 25, title: "Hands-On Practice Session" },
        { type: "quiz", duration: 10, title: "Knowledge Check" }
      ];

      const randomLesson = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
      
      const lessonContent = `# ${randomLesson.title}

## Learning Objectives
- Master the fundamental concepts
- Apply knowledge in practical scenarios
- Demonstrate understanding through assessment

## Content Overview
This lesson provides comprehensive coverage of the topic with interactive elements and practical examples.

## Key Points
1. **Foundation**: Essential background information
2. **Application**: Real-world usage examples
3. **Practice**: Hands-on exercises and activities
4. **Assessment**: Knowledge validation through quizzes

## Interactive Elements
- Discussion forums for peer learning
- Practice exercises with immediate feedback
- Progress tracking and achievement badges

## Duration: ${randomLesson.duration} minutes`;

      if (onGenerateLesson) {
        onGenerateLesson({
          title: randomLesson.title,
          content: lessonContent,
          contentType: randomLesson.type,
          duration: randomLesson.duration
        });
        toast({
          title: "Lesson Generated",
          description: "AI has created a lesson plan for your course.",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied to Clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const applyContent = () => {
    if (onGenerateContent && generatedContent) {
      if (disabled) {
        toast({
          title: "No Lesson Selected",
          description: "Please select a lesson first before applying AI content.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Applying AI content:", { generatedContent, contentType });
      onGenerateContent(generatedContent, contentType);
      setIsOpen(false);
      setGeneratedContent("");
      setPrompt("");
      toast({
        title: "Content Applied Successfully",
        description: "AI-generated content has been applied to your lesson. You can now edit and save it.",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
                          <DialogTrigger asChild>
                    <Button 
                      className="saas-button-primary" 
                      disabled={disabled}
                      title={disabled ? "Please select a lesson first" : "AI Assistant"}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Assistant
                    </Button>
                  </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Course Content Assistant</span>
            </DialogTitle>
            <DialogDescription>
              Get AI-powered suggestions and content generation for your course materials.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Content</span>
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Structure</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Suggestions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="prompt">What would you like to create?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the content you want to generate (e.g., 'Create a lesson about JavaScript fundamentals')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Lesson</SelectItem>
                        <SelectItem value="video">Video Script</SelectItem>
                        <SelectItem value="interactive">Interactive Content</SelectItem>
                        <SelectItem value="quiz">Quiz Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateCourseContent}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full saas-button-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <Card className="mt-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Generated Content</CardTitle>
                                                 <div className="flex space-x-2">
                           <Button size="sm" variant="outline" onClick={copyToClipboard}>
                             <Copy className="h-4 w-4 mr-1" />
                             Copy
                           </Button>
                           <Button size="sm" onClick={applyContent} className="saas-button-primary">
                             <Check className="h-4 w-4 mr-1" />
                             Apply & Save
                           </Button>
                         </div>
                         <p className="text-xs text-muted-foreground mt-2">
                           Content will be applied to your lesson and saved automatically.
                         </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg">
                          {generatedContent}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>Module Structure</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a complete module structure with suggested lessons and content flow.
                    </p>
                    <Button 
                      onClick={generateModuleStructure}
                      disabled={isGenerating}
                      className="w-full saas-button-secondary"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Module Structure
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>Lesson Plan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a detailed lesson plan with learning objectives and activities.
                    </p>
                    <Button 
                      onClick={generateLessonPlan}
                      disabled={isGenerating}
                      className="w-full saas-button-secondary"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Lesson Plan
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Learning Objectives</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="mr-2">Understand core concepts</Badge>
                      <Badge variant="secondary" className="mr-2">Apply knowledge practically</Badge>
                      <Badge variant="secondary" className="mr-2">Demonstrate mastery</Badge>
                      <Badge variant="secondary" className="mr-2">Collaborate effectively</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span>Engagement Ideas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm">Discussion forums</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm">Achievement badges</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm">Progress tracking</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <span>Content Tips</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>• Keep lessons under 20 minutes for better retention</p>
                      <p>• Include interactive elements every 5-7 minutes</p>
                      <p>• Use real-world examples to illustrate concepts</p>
                      <p>• Provide immediate feedback on assessments</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 