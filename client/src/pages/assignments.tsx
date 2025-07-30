import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Calendar, Clock, Users, CheckCircle, XCircle, Upload, Download, Eye, Award } from "lucide-react";
import RubricBuilder from "@/components/rubric/rubric-builder";
import RubricEvaluator from "@/components/rubric/rubric-evaluator";
import RubricDetail from "@/components/rubric/rubric-detail";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxPoints: number;
  status: string;
  courseId: number;
}

interface Submission {
  id: number;
  content: string;
  fileUrl: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
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

export default function Assignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    maxPoints: 100,
    courseId: "",
  });
  const [newSubmission, setNewSubmission] = useState({
    content: "",
    fileUrl: "",
  });

  const assignmentsQueryKey = (courseId: string) => ["/api/courses", courseId, "assignments"];

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: assignmentsQueryKey(selectedCourse),
    enabled: !!selectedCourse,
  });

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["/api/assignments", selectedAssignment?.id, "submissions"],
    enabled: !!selectedAssignment && user?.role === "instructor",
  });

  const { data: rubrics } = useQuery<Rubric[]>({
    queryKey: ["/api/rubrics", "assignment", selectedAssignment?.id],
    queryFn: async () => {
      const response = await fetch(`/api/rubrics?type=assignment&assignmentId=${selectedAssignment?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rubrics');
      }
      return response.json();
    },
    enabled: !!selectedAssignment && user?.role === "instructor",
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      console.log('Mutation data:', assignmentData);
      const { courseId, ...data } = assignmentData;
      console.log('Sending to server:', {
        url: `/api/courses/${courseId}/assignments`,
        data
      });
      const response = await apiRequest("POST", `/api/courses/${courseId}/assignments`, data);
      const result = await response.json();
      console.log('Server response:', result);
      return { ...result, courseId };
    },
    onError: (error: any) => {
      console.error('Assignment creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create assignment",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      console.log('Assignment created successfully:', data);
      queryClient.invalidateQueries({ queryKey: assignmentsQueryKey(data.courseId.toString()) });
      setIsCreateDialogOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        maxPoints: 100,
        courseId: "",
      });
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully.",
      });
    },
  });

  const createSubmissionMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      if (!selectedAssignment) return;
      const response = await apiRequest("POST", `/api/assignments/${selectedAssignment.id}/submissions`, submissionData);
      return response.json();
    },
    onSuccess: () => {
      if (!selectedAssignment) return;
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", selectedAssignment.id, "submissions"] });
      setIsSubmissionDialogOpen(false);
      setNewSubmission({ content: "", fileUrl: "" });
      toast({
        title: "Submission Created",
        description: "Your assignment submission has been uploaded successfully.",
      });
    },
  });

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.courseId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a course.",
        variant: "destructive",
      });
      return;
    }

    // Convert the date string to an ISO string for the server
    const dueDate = newAssignment.dueDate 
      ? new Date(newAssignment.dueDate).toISOString() // Convert to ISO string for Zod datetime validation
      : null;

    // Prepare assignment data according to the schema
    const assignmentData = {
      title: newAssignment.title,
      description: newAssignment.description || null,
      instructions: newAssignment.instructions || null,
      dueDate,
      maxPoints: parseInt(String(newAssignment.maxPoints)) || 100,
      courseId: parseInt(newAssignment.courseId),
    };

    console.log('Creating assignment with data:', {
      assignmentData,
      newAssignment,
      dueDate,
      courseId: newAssignment.courseId,
      rawDate: newAssignment.dueDate,
      isoDate: dueDate
    });
    
    createAssignmentMutation.mutate(assignmentData);
  };

  const handleCreateSubmission = () => {
    if (!newSubmission.content && !newSubmission.fileUrl) {
      toast({
        title: "Validation Error",
        description: "Please provide either text content or upload a file.",
        variant: "destructive",
      });
      return;
    }
    createSubmissionMutation.mutate(newSubmission);
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (assignment.status === "closed") {
      return <Badge variant="secondary">Closed</Badge>;
    } else if (dueDate < now) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
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
                <h2 className="text-2xl font-bold text-slate-800">Assignments</h2>
                <p className="text-slate-600 mt-1">
                  {isInstructor 
                    ? "Create and manage course assignments" 
                    : "Complete and submit your assignments"
                  }
                </p>
              </div>
              {isInstructor && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                      <DialogDescription>
                        Create a new assignment for your students.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="course">Course</Label>
                        <Select 
                          value={newAssignment.courseId} 
                          onValueChange={(value) => setNewAssignment({ ...newAssignment, courseId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses?.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                          id="title"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                          placeholder="Enter assignment title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                          placeholder="Brief assignment description"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newAssignment.instructions}
                          onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                          placeholder="Detailed assignment instructions"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="datetime-local"
                            value={newAssignment.dueDate}
                            onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="maxPoints">Max Points</Label>
                          <Input
                            id="maxPoints"
                            type="number"
                            value={newAssignment.maxPoints}
                            onChange={(e) => setNewAssignment({ ...newAssignment, maxPoints: parseInt(e.target.value) || 100 })}
                            placeholder="100"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateAssignment}
                        disabled={createAssignmentMutation.isPending}
                      >
                        {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
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
                {courses?.map((course: Course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assignments List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {assignments && assignments.length > 0 ? (
                    assignments.map((assignment: Assignment) => (
                      <Card 
                        key={assignment.id} 
                        className={`cursor-pointer transition-colors hover:border-slate-300 ${
                          selectedAssignment?.id === assignment.id ? "border-blue-300 bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-slate-800">{assignment.title}</h3>
                                {getStatusBadge(assignment)}
                              </div>
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                {assignment.description}
                              </p>
                              <div className="flex items-center space-x-6 text-sm text-slate-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <FileText className="h-4 w-4" />
                                  <span>{assignment.maxPoints} points</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-800">
                                {/* Mock submission count for instructors */}
                                {isInstructor ? "12" : "85%"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {isInstructor ? "submissions" : "avg score"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          No assignments in this course yet.
                        </p>
                        {isInstructor && (
                          <Button 
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Assignment
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Assignment Detail */}
              <div className="lg:col-span-1">
                {selectedAssignment ? (
                  <Card className="sticky top-8">
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedAssignment.title}</CardTitle>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(selectedAssignment)}
                        <div className="text-sm text-slate-500">
                          {selectedAssignment.maxPoints} points
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Assignment Details */}
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Description</h4>
                        <p className="text-sm text-slate-600">{selectedAssignment.description}</p>
                      </div>
                      
                      {selectedAssignment.instructions && (
                        <div>
                          <h4 className="font-medium text-slate-800 mb-2">Instructions</h4>
                          <p className="text-sm text-slate-600">{selectedAssignment.instructions}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                        <div>
                          <p className="text-xs text-slate-500">Due Date</p>
                          <p className="text-sm font-medium">
                            {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Max Points</p>
                          <p className="text-sm font-medium">{selectedAssignment.maxPoints}</p>
                        </div>
                      </div>

                      {isInstructor ? (
                        /* Instructor View - Submissions */
                        <Tabs defaultValue="submissions" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="submissions">Submissions</TabsTrigger>
                            <TabsTrigger value="grading">Grading</TabsTrigger>
                          </TabsList>
                          <TabsContent value="submissions" className="space-y-3">
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                              {submissions && submissions.length > 0 ? (
                                submissions.map((submission: Submission) => (
                                  <div key={submission.id} className="p-3 border border-slate-200 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={submission.user?.profileImageUrl || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {submission.user?.firstName?.[0]}{submission.user?.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          {submission.user?.firstName} {submission.user?.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {new Date(submission.submittedAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      {submission.score ? (
                                        <Badge variant="default">{submission.score}%</Badge>
                                      ) : (
                                        <Badge variant="secondary">Ungraded</Badge>
                                      )}
                                    </div>
                                    {submission.content && (
                                      <p className="text-xs text-slate-600 line-clamp-2">
                                        {submission.content}
                                      </p>
                                    )}
                                    {submission.fileUrl && (
                                      <Button size="sm" variant="outline" className="mt-2">
                                        <Download className="h-3 w-3 mr-1" />
                                        Download File
                                      </Button>
                                    )}
                                    <div className="flex items-center space-x-2 mt-2">
                                      <RubricEvaluator
                                        type="assignment"
                                        submissionId={submission.id}
                                        rubricId={1} // This would be dynamic based on selected rubric
                                        onEvaluationComplete={(evaluation) => {
                                          toast({
                                            title: "Evaluation Complete",
                                            description: "Submission has been evaluated with rubric.",
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500 text-center py-4">
                                  No submissions yet.
                                </p>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="grading" className="space-y-3">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-slate-800">Rubric Management</h4>
                                <RubricBuilder
                                  type="assignment"
                                  assignmentId={selectedAssignment.id}
                                  onRubricCreated={(rubric) => {
                                    toast({
                                      title: "Rubric Created",
                                      description: "Rubric has been created for this assignment.",
                                    });
                                  }}
                                />
                              </div>
                              
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-slate-700">Available Rubrics</h5>
                                <div className="space-y-2">
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
                                      <p className="text-xs text-slate-500">Create a rubric to start grading submissions for this assignment.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        /* Student View - Submit Assignment */
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Time Remaining</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              {/* Calculate time remaining */}
                              {Math.ceil((new Date(selectedAssignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                          
                          <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Assignment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Assignment</DialogTitle>
                                <DialogDescription>
                                  Submit your work for {selectedAssignment.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="content">Written Response</Label>
                                  <Textarea
                                    id="content"
                                    value={newSubmission.content}
                                    onChange={(e) => setNewSubmission({ ...newSubmission, content: e.target.value })}
                                    placeholder="Enter your response here..."
                                    rows={6}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="file">File Upload (Optional)</Label>
                                  <Input
                                    id="file"
                                    type="url"
                                    value={newSubmission.fileUrl}
                                    onChange={(e) => setNewSubmission({ ...newSubmission, fileUrl: e.target.value })}
                                    placeholder="Paste file URL or upload link"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={handleCreateSubmission}
                                  disabled={createSubmissionMutation.isPending}
                                >
                                  {createSubmissionMutation.isPending ? "Submitting..." : "Submit Assignment"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">
                        Select an assignment to view details.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">
                  Select a course to view assignments.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
