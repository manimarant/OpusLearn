import { useState } from "react";
import { useParams } from "wouter";
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
import { Plus, Timer, Award, CheckCircle, XCircle, Edit, Eye } from "lucide-react";
import RubricBuilder from "@/components/rubric/rubric-builder";
import RubricEvaluator from "@/components/rubric/rubric-evaluator";
import RubricDetail from "@/components/rubric/rubric-detail";

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

interface Rubric {
  id: number;
  title: string;
  description: string;
  type: string;
  assignmentId: number | null;
  quizId: number | null;
  maxPoints: number;
  createdAt: string;
  updatedAt: string;
}

export default function QuizDetail() {
  const params = useParams();
  const quizId = params.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateQuestionDialogOpen, setIsCreateQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState<{
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: string[];
    correctAnswer: string;
    points: number;
    orderIndex: number;
  }>({
    question: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
    orderIndex: 1,
  });

  const isInstructor = user?.role === 'instructor';

  const { data: quiz, isLoading: isQuizLoading } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      return response.json();
    },
    enabled: !!quizId,
  });

  const { data: questions, isLoading: isQuestionsLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/quizzes", quizId, "questions"],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}/questions`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
    enabled: !!quizId,
  });

  const { data: rubrics } = useQuery<Rubric[]>({
    queryKey: ["/api/rubrics", "quiz", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/rubrics?type=quiz&quizId=${quizId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rubrics');
      }
      return response.json();
    },
    enabled: !!quizId && isInstructor,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/questions`, questionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", quizId, "questions"] });
      setIsCreateQuestionDialogOpen(false);
      setNewQuestion({
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 10,
        orderIndex: 1,
      });
      toast({
        title: "Question Added",
        description: "Your question has been added successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Question creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/quizzes/${quizId}/questions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", quizId, "questions"] });
      setIsEditQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({
        title: "Question Updated",
        description: "Your question has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Question update error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuestion = () => {
    if (!newQuestion.question) {
      toast({
        title: "Validation Error",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    if (newQuestion.type === "multiple_choice" && newQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in all options for multiple choice questions.",
        variant: "destructive",
      });
      return;
    }

    if (!newQuestion.correctAnswer) {
      toast({
        title: "Validation Error",
        description: "Please set the correct answer.",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating question with data:', newQuestion);
    const questionData = {
      ...newQuestion,
      orderIndex: (questions?.length || 0) + 1,
    };

    createQuestionMutation.mutate(questionData);
  };

  const handleEditQuestion = () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question) {
      toast({
        title: "Validation Error",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    updateQuestionMutation.mutate({
      id: editingQuestion.id,
      updates: editingQuestion,
    });
  };

  if (isQuizLoading || isQuestionsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading quiz...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Not Found</h2>
              <p className="text-slate-600">The quiz you're looking for doesn't exist or has been removed.</p>
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
                <h2 className="text-2xl font-bold text-slate-800">{quiz?.title}</h2>
                <p className="text-slate-600 mt-1">{quiz?.description}</p>
              </div>
              {isInstructor && (
                <div className="flex items-center space-x-3">
                  <RubricBuilder
                    type="quiz"
                    quizId={quizId}
                    onRubricCreated={(rubric) => {
                      toast({
                        title: "Rubric Created",
                        description: "Rubric has been created for this quiz.",
                      });
                    }}
                  />
                  <Dialog open={isCreateQuestionDialogOpen} onOpenChange={setIsCreateQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Question</DialogTitle>
                        <DialogDescription>
                          Create a new question for this quiz.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="question">Question</Label>
                          <Textarea
                            id="question"
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            placeholder="Enter your question"
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="type">Question Type</Label>
                          <Select
                            value={newQuestion.type}
                            onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => {
                              setNewQuestion({
                                ...newQuestion,
                                type: value,
                                options: value === 'true_false' ? ['True', 'False'] : value === 'multiple_choice' ? ["", "", "", ""] : [],
                                correctAnswer: "",
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newQuestion.type === "multiple_choice" && (
                          <div className="grid gap-2">
                            <Label>Options</Label>
                            {newQuestion.options.map((option, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...newQuestion.options];
                                    newOptions[index] = e.target.value;
                                    setNewQuestion({ ...newQuestion, options: newOptions });
                                  }}
                                  placeholder={`Option ${index + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: option })}
                                  className={newQuestion.correctAnswer === option ? "border-green-500" : ""}
                                >
                                  {newQuestion.correctAnswer === option ? <CheckCircle className="h-4 w-4" /> : "Set Correct"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {newQuestion.type === "true_false" && (
                          <div className="grid gap-2">
                            <Label>Correct Answer</Label>
                            <div className="flex gap-2">
                              {['True', 'False'].map((option) => (
                                <Button
                                  key={option}
                                  type="button"
                                  variant={newQuestion.correctAnswer === option ? "default" : "outline"}
                                  onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: option })}
                                  className="flex-1"
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {newQuestion.type === "short_answer" && (
                          <div className="grid gap-2">
                            <Label htmlFor="correctAnswer">Correct Answer</Label>
                            <Input
                              id="correctAnswer"
                              value={newQuestion.correctAnswer}
                              onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                              placeholder="Enter the correct answer"
                            />
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="points">Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={newQuestion.points}
                            onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 10 })}
                            min={1}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleCreateQuestion}
                          disabled={createQuestionMutation.isPending}
                        >
                          {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-6 mt-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{quiz?.timeLimit} minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4" />
                <span>{quiz?.passingScore}% to pass</span>
              </div>
            </div>
          </div>

          {/* Rubrics Section for Instructors */}
          {isInstructor && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Grading Rubrics</h3>
              </div>
              <div className="space-y-3">
                {rubrics && rubrics.length > 0 ? (
                  rubrics.map((rubric) => (
                    <div key={rubric.id} className="p-4 border border-slate-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-3">
                              <Award className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <h4 className="font-semibold text-slate-800 truncate">{rubric.title}</h4>
                            </div>
                            {rubric.description && rubric.description !== rubric.title && (
                              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{rubric.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center space-x-1 flex-shrink-0">
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                <span>Max Points: {rubric.maxPoints}</span>
                              </span>
                              <span className="flex items-center space-x-1 flex-shrink-0">
                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                <span>Type: {rubric.type}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                          <RubricDetail rubricId={rubric.id} />
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap">
                            <Award className="h-3 w-3 mr-1" />
                            Use for Grading
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 border border-slate-200 rounded-lg text-center bg-slate-50">
                    <Award className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 mb-1">No rubrics created yet</p>
                    <p className="text-xs text-slate-500">Create a rubric to start grading quiz attempts for this quiz.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {questions?.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-slate-800">Question {index + 1}</h3>
                          <Badge variant="outline">{question.points} points</Badge>
                          <Badge>{question.type.replace('_', ' ')}</Badge>
                        </div>
                        {isInstructor && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(question);
                              setIsEditQuestionDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <p className="text-slate-800 mb-4">{question.question}</p>
                      {question.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border ${
                                option === question.correctAnswer
                                  ? "border-green-500 bg-green-50"
                                  : "border-slate-200"
                              }`}
                            >
                              {option}
                              {option === question.correctAnswer && (
                                <Badge className="ml-2 bg-green-500">Correct Answer</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'true_false' && (
                        <div className="space-y-2">
                          {['True', 'False'].map((option) => (
                            <div
                              key={option}
                              className={`p-3 rounded-lg border ${
                                option === question.correctAnswer
                                  ? "border-green-500 bg-green-50"
                                  : "border-slate-200"
                              }`}
                            >
                              {option}
                              {option === question.correctAnswer && (
                                <Badge className="ml-2 bg-green-500">Correct Answer</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'short_answer' && (
                        <div className="p-3 rounded-lg border border-green-500 bg-green-50">
                          <span className="font-medium">Correct Answer: </span>
                          {question.correctAnswer}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!questions?.length && (
              <div className="text-center py-8 text-slate-500">
                No questions added yet.
              </div>
            )}
          </div>

          {/* Edit Question Dialog */}
          {editingQuestion && (
            <Dialog open={isEditQuestionDialogOpen} onOpenChange={setIsEditQuestionDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Question</DialogTitle>
                  <DialogDescription>
                    Update the question details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-question">Question</Label>
                    <Textarea
                      id="edit-question"
                      value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                      placeholder="Enter your question"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">Question Type</Label>
                    <Select
                      value={editingQuestion.type}
                      onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => {
                        setEditingQuestion({
                          ...editingQuestion,
                          type: value,
                          options: value === 'true_false' ? ['True', 'False'] : value === 'multiple_choice' ? ["", "", "", ""] : [],
                          correctAnswer: "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editingQuestion.type === "multiple_choice" && (
                    <div className="grid gap-2">
                      <Label>Options</Label>
                      {editingQuestion.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...editingQuestion.options];
                              newOptions[index] = e.target.value;
                              setEditingQuestion({ ...editingQuestion, options: newOptions });
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: option })}
                            className={editingQuestion.correctAnswer === option ? "border-green-500" : ""}
                          >
                            {editingQuestion.correctAnswer === option ? <CheckCircle className="h-4 w-4" /> : "Set Correct"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editingQuestion.type === "true_false" && (
                    <div className="grid gap-2">
                      <Label>Correct Answer</Label>
                      <div className="flex gap-2">
                        {['True', 'False'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={editingQuestion.correctAnswer === option ? "default" : "outline"}
                            onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: option })}
                            className="flex-1"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {editingQuestion.type === "short_answer" && (
                    <div className="grid gap-2">
                      <Label htmlFor="edit-correctAnswer">Correct Answer</Label>
                      <Input
                        id="edit-correctAnswer"
                        value={editingQuestion.correctAnswer}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                        placeholder="Enter the correct answer"
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="edit-points">Points</Label>
                    <Input
                      id="edit-points"
                      type="number"
                      value={editingQuestion.points}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 10 })}
                      min={1}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleEditQuestion}
                    disabled={updateQuestionMutation.isPending}
                  >
                    {updateQuestionMutation.isPending ? "Updating..." : "Update Question"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
} 