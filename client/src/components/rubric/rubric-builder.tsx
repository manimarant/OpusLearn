import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Trash2, Edit, Eye, Award, Target, Users } from "lucide-react";

interface RubricBuilderProps {
  type: "assignment" | "quiz";
  assignmentId?: number;
  quizId?: number;
  onRubricCreated?: (rubric: any) => void;
}

interface RubricCriteria {
  id?: number;
  title: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

interface RubricLevel {
  id?: number;
  title: string;
  description: string;
  points: number;
  color: string;
  orderIndex: number;
}

interface Rubric {
  id?: number;
  title: string;
  description: string;
  type: "assignment" | "quiz";
  assignmentId?: number;
  quizId?: number;
  maxPoints: number;
  criteria: RubricCriteria[];
  levels: RubricLevel[];
}

const DEFAULT_LEVELS: RubricLevel[] = [
  { title: "Excellent", description: "Outstanding work that exceeds expectations", points: 100, color: "#10B981", orderIndex: 1 },
  { title: "Good", description: "Solid work that meets expectations", points: 85, color: "#3B82F6", orderIndex: 2 },
  { title: "Fair", description: "Adequate work with some issues", points: 70, color: "#F59E0B", orderIndex: 3 },
  { title: "Poor", description: "Work that needs significant improvement", points: 50, color: "#EF4444", orderIndex: 4 },
];

const DEFAULT_CRITERIA: RubricCriteria[] = [
  { title: "Content Quality", description: "Accuracy and depth of content", maxPoints: 40, orderIndex: 1 },
  { title: "Organization", description: "Structure and flow of work", maxPoints: 30, orderIndex: 2 },
  { title: "Presentation", description: "Clarity and professionalism", maxPoints: 30, orderIndex: 3 },
];

export default function RubricBuilder({ type, assignmentId, quizId, onRubricCreated }: RubricBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [rubric, setRubric] = useState<Rubric>({
    title: "",
    description: "",
    type,
    assignmentId,
    quizId,
    maxPoints: 100,
    criteria: [...DEFAULT_CRITERIA],
    levels: [...DEFAULT_LEVELS],
  });

  const createRubricMutation = useMutation({
    mutationFn: async (rubricData: any) => {
      const response = await apiRequest("POST", "/api/rubrics", rubricData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      setIsOpen(false);
      setRubric({
        title: "",
        description: "",
        type,
        assignmentId,
        quizId,
        maxPoints: 100,
        criteria: [...DEFAULT_CRITERIA],
        levels: [...DEFAULT_LEVELS],
      });
      toast({
        title: "Rubric Created",
        description: "Your rubric has been created successfully.",
      });
      onRubricCreated?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create rubric",
        variant: "destructive",
      });
    },
  });

  const handleCreateRubric = async () => {
    if (!rubric.title) {
      toast({
        title: "Validation Error",
        description: "Please enter a rubric title.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the rubric first
      const rubricData = {
        title: rubric.title,
        description: rubric.description,
        type: rubric.type,
        assignmentId: rubric.assignmentId,
        quizId: rubric.quizId,
        maxPoints: rubric.maxPoints,
      };

      const createdRubric = await createRubricMutation.mutateAsync(rubricData);

      // Create criteria
      for (const criteria of rubric.criteria) {
        await apiRequest("POST", `/api/rubrics/${createdRubric.id}/criteria`, {
          title: criteria.title,
          description: criteria.description,
          maxPoints: criteria.maxPoints,
          orderIndex: criteria.orderIndex,
        });
      }

      // Create levels
      for (const level of rubric.levels) {
        await apiRequest("POST", `/api/rubrics/${createdRubric.id}/levels`, {
          title: level.title,
          description: level.description,
          points: level.points,
          color: level.color,
          orderIndex: level.orderIndex,
        });
      }

      toast({
        title: "Rubric Created",
        description: "Your rubric has been created successfully with all criteria and levels.",
      });
    } catch (error) {
      console.error("Error creating rubric:", error);
      toast({
        title: "Error",
        description: "Failed to create rubric",
        variant: "destructive",
      });
    }
  };

  const addCriteria = () => {
    const newCriteria: RubricCriteria = {
      title: "",
      description: "",
      maxPoints: 10,
      orderIndex: rubric.criteria.length + 1,
    };
    setRubric(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriteria],
    }));
  };

  const removeCriteria = (index: number) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const updateCriteria = (index: number, field: keyof RubricCriteria, value: any) => {
    setRubric(prev => ({
      ...prev,
      criteria: prev.criteria.map((criteria, i) =>
        i === index ? { ...criteria, [field]: value } : criteria
      ),
    }));
  };

  const addLevel = () => {
    const newLevel: RubricLevel = {
      title: "",
      description: "",
      points: 0,
      color: "#3B82F6",
      orderIndex: rubric.levels.length + 1,
    };
    setRubric(prev => ({
      ...prev,
      levels: [...prev.levels, newLevel],
    }));
  };

  const removeLevel = (index: number) => {
    setRubric(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index),
    }));
  };

  const updateLevel = (index: number, field: keyof RubricLevel, value: any) => {
    setRubric(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) =>
        i === index ? { ...level, [field]: value } : level
      ),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="saas-button-primary">
          <Award className="h-4 w-4 mr-2" />
          Create Rubric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Create Rubric for {type === "assignment" ? "Assignment" : "Quiz"}</span>
          </DialogTitle>
          <DialogDescription>
            Define clear criteria and performance levels for fair and consistent evaluation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Basic Info</TabsTrigger>
            <TabsTrigger value="criteria">Criteria</TabsTrigger>
            <TabsTrigger value="levels">Performance Levels</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="rubric-title">Rubric Title</Label>
                <Input
                  id="rubric-title"
                  value={rubric.title}
                  onChange={(e) => setRubric(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Essay Writing Rubric"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="rubric-description">Description</Label>
                <Textarea
                  id="rubric-description"
                  value={rubric.description}
                  onChange={(e) => setRubric(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rubric evaluates..."
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="rubric-max-points">Maximum Points</Label>
                <Input
                  id="rubric-max-points"
                  type="number"
                  value={rubric.maxPoints}
                  onChange={(e) => setRubric(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evaluation Criteria</h3>
              <Button onClick={addCriteria} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Criteria
              </Button>
            </div>
            
            <div className="space-y-4">
              {rubric.criteria.map((criteria, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Criteria {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriteria(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={criteria.title}
                        onChange={(e) => updateCriteria(index, "title", e.target.value)}
                        placeholder="e.g., Content Quality"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={criteria.description}
                        onChange={(e) => updateCriteria(index, "description", e.target.value)}
                        placeholder="Describe what this criteria evaluates..."
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Maximum Points</Label>
                      <Input
                        type="number"
                        value={criteria.maxPoints}
                        onChange={(e) => updateCriteria(index, "maxPoints", parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Performance Levels</h3>
              <Button onClick={addLevel} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            </div>
            
            <div className="space-y-4">
              {rubric.levels.map((level, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Level {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLevel(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={level.title}
                          onChange={(e) => updateLevel(index, "title", e.target.value)}
                          placeholder="e.g., Excellent"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={level.points}
                          onChange={(e) => updateLevel(index, "points", parseInt(e.target.value) || 0)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={level.description}
                        onChange={(e) => updateLevel(index, "description", e.target.value)}
                        placeholder="Describe what this level represents..."
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={level.color}
                        onChange={(e) => updateLevel(index, "color", e.target.value)}
                        className="mt-2 w-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRubric} disabled={createRubricMutation.isPending}>
            {createRubricMutation.isPending ? "Creating..." : "Create Rubric"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 