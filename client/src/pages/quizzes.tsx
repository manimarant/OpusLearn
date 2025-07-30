import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Timer, Award, CheckCircle, XCircle } from "lucide-react";
import RubricBuilder from "@/components/rubric/rubric-builder";
import RubricEvaluator from "@/components/rubric/rubric-evaluator";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  attempts: number;
  passingScore: number;
  courseId: number;
  createdAt: string;
}

interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  points: number;
  orderIndex: number;
}

export default function Quizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    attempts: 1,
    passingScore: 70,
    courseId: "",
  });
  const [, setLocation] = useLocation();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: quizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/courses", selectedCourse, "quizzes"],
    enabled: !!selectedCourse,
  });

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const { courseId, ...data } = quizData;
      const response = await apiRequest("POST", `/api/courses/${courseId}/quizzes`, data);
      const result = await response.json();
      return { ...result, courseId };
    },
    onError: (error: any) => {
      console.error('Quiz creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create quiz",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", data.courseId, "quizzes"] });
      setIsCreateDialogOpen(false);
      setNewQuiz({
        title: "",
        description: "",
        timeLimit: 30,
        attempts: 1,
        passingScore: 70,
        courseId: "",
      });
      toast({
        title: "Quiz Created",
        description: "Your quiz has been created successfully.",
      });
    },
  });

  const handleCreateQuiz = () => {
    if (!newQuiz.title || !newQuiz.description || !newQuiz.courseId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a course.",
        variant: "destructive",
      });
      return;
    }

    createQuizMutation.mutate({
      ...newQuiz,
      courseId: parseInt(newQuiz.courseId),
      timeLimit: parseInt(String(newQuiz.timeLimit)),
      attempts: parseInt(String(newQuiz.attempts)),
      passingScore: parseInt(String(newQuiz.passingScore)),
    });
  };

  const getStatusBadge = (quiz: Quiz) => {
    const attempts = 0; // TODO: Get actual attempts from user progress
    if (attempts >= quiz.attempts) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

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
                <h2 className="text-2xl font-bold text-slate-800">Quizzes</h2>
                <p className="text-slate-600 mt-1">
                  {isInstructor 
                    ? "Create and manage course quizzes" 
                    : "Take quizzes to test your knowledge"
                  }
                </p>
              </div>
              {isInstructor && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Quiz</DialogTitle>
                      <DialogDescription>
                        Create a new quiz for your students.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="course">Course</Label>
                        <Select 
                          value={newQuiz.courseId} 
                          onValueChange={(value) => setNewQuiz({ ...newQuiz, courseId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses?.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                          id="title"
                          value={newQuiz.title}
                          onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                          placeholder="Enter quiz title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newQuiz.description}
                          onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                          placeholder="Brief quiz description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                          <Input
                            id="timeLimit"
                            type="number"
                            value={newQuiz.timeLimit}
                            onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: parseInt(e.target.value) || 30 })}
                            min={1}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="attempts">Max Attempts</Label>
                          <Input
                            id="attempts"
                            type="number"
                            value={newQuiz.attempts}
                            onChange={(e) => setNewQuiz({ ...newQuiz, attempts: parseInt(e.target.value) || 1 })}
                            min={1}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="passingScore">Passing Score (%)</Label>
                          <Input
                            id="passingScore"
                            type="number"
                            value={newQuiz.passingScore}
                            onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: parseInt(e.target.value) || 70 })}
                            min={0}
                            max={100}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateQuiz}
                        disabled={createQuizMutation.isPending}
                      >
                        {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Course Filter */}
          <div className="mb-6">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse ? (
            <div className="space-y-4">
              {quizzes?.length ? (
                quizzes.map((quiz) => (
                  <Card 
                    key={quiz.id} 
                    className="cursor-pointer transition-colors hover:border-slate-300"
                    onClick={() => setLocation(`/quizzes/${quiz.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-slate-800">{quiz.title}</h3>
                            {getStatusBadge(quiz)}
                          </div>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {quiz.description}
                          </p>
                          <div className="flex items-center space-x-6 text-sm text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Timer className="h-4 w-4" />
                              <span>{quiz.timeLimit} minutes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Award className="h-4 w-4" />
                              <span>{quiz.passingScore}% to pass</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No quizzes found for this course.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Select a course to view its quizzes.
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 