import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, CheckCircle, Clock, Star, MessageSquare, FileText } from "lucide-react";

interface RubricEvaluatorProps {
  type: "assignment" | "quiz";
  submissionId?: number;
  quizAttemptId?: number;
  rubricId: number;
  onEvaluationComplete?: (evaluation: any) => void;
}

interface RubricCriteria {
  id: number;
  title: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

interface RubricLevel {
  id: number;
  title: string;
  description: string;
  points: number;
  color: string;
  orderIndex: number;
}

interface Rubric {
  id: number;
  title: string;
  description: string;
  type: "assignment" | "quiz";
  maxPoints: number;
  criteria: RubricCriteria[];
  levels: RubricLevel[];
}

interface CriteriaScore {
  levelId: number;
  points: number;
  feedback: string;
}

interface Evaluation {
  rubricId: number;
  submissionId?: number;
  quizAttemptId?: number;
  evaluatorId: string;
  criteriaScores: Record<number, CriteriaScore>;
  totalScore: number;
  feedback: string;
}

export default function RubricEvaluator({ 
  type, 
  submissionId, 
  quizAttemptId, 
  rubricId, 
  onEvaluationComplete 
}: RubricEvaluatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("evaluation");
  const [evaluation, setEvaluation] = useState<Evaluation>({
    rubricId,
    submissionId,
    quizAttemptId,
    evaluatorId: "dev-user-123", // This should come from auth
    criteriaScores: {},
    totalScore: 0,
    feedback: "",
  });

  const { data: rubric, isLoading } = useQuery<Rubric>({
    queryKey: ["/api/rubrics", rubricId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rubrics/${rubricId}`);
      return response.json();
    },
    enabled: !!rubricId,
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const response = await apiRequest("POST", `/api/rubrics/${rubricId}/evaluate`, evaluationData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      setIsOpen(false);
      toast({
        title: "Evaluation Complete",
        description: "The rubric evaluation has been saved successfully.",
      });
      onEvaluationComplete?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save evaluation",
        variant: "destructive",
      });
    },
  });

  const handleCriteriaScore = (criteriaId: number, levelId: number, points: number, feedback: string) => {
    setEvaluation(prev => ({
      ...prev,
      criteriaScores: {
        ...prev.criteriaScores,
        [criteriaId]: {
          levelId,
          points,
          feedback,
        },
      },
    }));
  };

  const calculateTotalScore = () => {
    const total = Object.values(evaluation.criteriaScores).reduce(
      (sum, score) => sum + score.points,
      0
    );
    setEvaluation(prev => ({ ...prev, totalScore: total }));
    return total;
  };

  const handleSubmitEvaluation = () => {
    if (!rubric) return;

    const totalScore = calculateTotalScore();
    
    if (Object.keys(evaluation.criteriaScores).length !== rubric.criteria.length) {
      toast({
        title: "Incomplete Evaluation",
        description: "Please evaluate all criteria before submitting.",
        variant: "destructive",
      });
      return;
    }

    createEvaluationMutation.mutate({
      ...evaluation,
      totalScore,
    });
  };

  const getLevelForCriteria = (criteriaId: number) => {
    return evaluation.criteriaScores[criteriaId]?.levelId;
  };

  const getPointsForCriteria = (criteriaId: number) => {
    return evaluation.criteriaScores[criteriaId]?.points || 0;
  };

  const getFeedbackForCriteria = (criteriaId: number) => {
    return evaluation.criteriaScores[criteriaId]?.feedback || "";
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="saas-button-primary">
            <Award className="h-4 w-4 mr-2" />
            Evaluate with Rubric
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading rubric...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!rubric) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="saas-button-primary">
            <Award className="h-4 w-4 mr-2" />
            Evaluate with Rubric
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="text-center py-8">
            <p className="text-red-600">Rubric not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="saas-button-primary">
          <Award className="h-4 w-4 mr-2" />
          Evaluate with Rubric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Evaluate with "{rubric.title}"</span>
          </DialogTitle>
          <DialogDescription>
            Use the rubric to provide fair and consistent evaluation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluation" className="space-y-6">
            <div className="space-y-4">
              {rubric.criteria.map((criteria) => (
                <Card key={criteria.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{criteria.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {criteria.description}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Max: {criteria.maxPoints} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Performance Level</Label>
                      <Select
                        value={getLevelForCriteria(criteria.id)?.toString() || ""}
                        onValueChange={(value) => {
                          const level = rubric.levels.find(l => l.id === parseInt(value));
                          if (level) {
                            handleCriteriaScore(criteria.id, level.id, level.points, getFeedbackForCriteria(criteria.id));
                          }
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select performance level" />
                        </SelectTrigger>
                        <SelectContent>
                          {rubric.levels.map((level) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: level.color }}
                                />
                                <span>{level.title} ({level.points} pts)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Points Awarded</Label>
                      <Input
                        type="number"
                        value={getPointsForCriteria(criteria.id)}
                        onChange={(e) => {
                          const points = parseInt(e.target.value) || 0;
                          const currentLevelId = getLevelForCriteria(criteria.id);
                          handleCriteriaScore(criteria.id, currentLevelId || 0, points, getFeedbackForCriteria(criteria.id));
                        }}
                        max={criteria.maxPoints}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Feedback</Label>
                      <Textarea
                        value={getFeedbackForCriteria(criteria.id)}
                        onChange={(e) => {
                          const currentLevelId = getLevelForCriteria(criteria.id);
                          const currentPoints = getPointsForCriteria(criteria.id);
                          handleCriteriaScore(criteria.id, currentLevelId || 0, currentPoints, e.target.value);
                        }}
                        placeholder="Provide specific feedback for this criteria..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {getLevelForCriteria(criteria.id) && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ 
                              backgroundColor: rubric.levels.find(l => l.id === getLevelForCriteria(criteria.id))?.color 
                            }}
                          />
                          <span className="font-medium">
                            {rubric.levels.find(l => l.id === getLevelForCriteria(criteria.id))?.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rubric.levels.find(l => l.id === getLevelForCriteria(criteria.id))?.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Evaluation Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Score</Label>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {calculateTotalScore()} / {rubric.maxPoints}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Percentage</Label>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {rubric.maxPoints > 0 ? Math.round((calculateTotalScore() / rubric.maxPoints) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Overall Feedback</Label>
                  <Textarea
                    value={evaluation.feedback}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Provide overall feedback for this submission..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Criteria Breakdown</Label>
                  {rubric.criteria.map((criteria) => (
                    <div key={criteria.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{criteria.title}</span>
                      <span className="text-sm font-medium">
                        {getPointsForCriteria(criteria.id)} / {criteria.maxPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitEvaluation} 
            disabled={createEvaluationMutation.isPending}
            className="saas-button-primary"
          >
            {createEvaluationMutation.isPending ? "Saving..." : "Submit Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 