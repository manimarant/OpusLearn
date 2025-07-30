import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Target, Star, Eye, Edit, Trash2 } from "lucide-react";

interface RubricCriteria {
  id: number;
  rubricId: number;
  title: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

interface RubricLevel {
  id: number;
  rubricId: number;
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
  type: string;
  assignmentId: number | null;
  quizId: number | null;
  maxPoints: number;
  criteria: RubricCriteria[];
  levels: RubricLevel[];
}

interface RubricDetailProps {
  rubricId: number;
  onClose?: () => void;
}

export default function RubricDetail({ rubricId, onClose }: RubricDetailProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: rubric, isLoading } = useQuery<Rubric>({
    queryKey: ["/api/rubrics", rubricId, "detail"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rubrics/${rubricId}`);
      return response.json();
    },
    enabled: !!rubricId,
  });

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading rubric details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!rubric) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
        <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
          <Eye className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>{rubric.title}</span>
          </DialogTitle>
          <DialogDescription>
            {rubric.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rubric Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rubric Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{rubric.maxPoints}</div>
                  <div className="text-sm text-slate-600">Maximum Points</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{rubric.criteria?.length || 0}</div>
                  <div className="text-sm text-slate-600">Criteria</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{rubric.levels?.length || 0}</div>
                  <div className="text-sm text-slate-600">Performance Levels</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criteria and Levels */}
          <Tabs defaultValue="criteria" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="criteria" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Criteria</span>
              </TabsTrigger>
              <TabsTrigger value="levels" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Performance Levels</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="criteria" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rubric.criteria && rubric.criteria.length > 0 ? (
                      rubric.criteria.map((criterion, index) => (
                        <div key={criterion.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <h4 className="font-medium">{criterion.title}</h4>
                            </div>
                            <Badge variant="secondary">{criterion.maxPoints} points</Badge>
                          </div>
                          {criterion.description && (
                            <p className="text-sm text-slate-600 mb-2">{criterion.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No criteria defined yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="levels" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rubric.levels && rubric.levels.length > 0 ? (
                      rubric.levels.map((level, index) => (
                        <div key={level.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: level.color }}
                              ></div>
                              <h4 className="font-medium">{level.title}</h4>
                            </div>
                            <Badge variant="secondary">{level.points} points</Badge>
                          </div>
                          {level.description && (
                            <p className="text-sm text-slate-600">{level.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Star className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No performance levels defined yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Rubric
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 