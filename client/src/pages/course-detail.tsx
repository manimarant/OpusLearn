import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Clock, Edit, MessageSquare, FileText, Eye, Share2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExportDialog } from "@/components/course/export-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Force authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to landing page
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [publishDetails, setPublishDetails] = useState({
    platform: "",
    apiKey: "",
    courseId: "",
  });

  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ["/api/courses", id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      return response.json();
    },
  });

  const { data: discussions } = useQuery({
    queryKey: ["/api/courses", id, "discussions"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/discussions`);
      if (!response.ok) {
        throw new Error('Failed to fetch discussions');
      }
      return response.json();
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["/api/courses", id, "assignments"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      return response.json();
    },
  });

  const { data: modules } = useQuery({
    queryKey: ["/api/courses", id, "modules"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/modules`);
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      return response.json();
    },
  });

  const { data: chapters } = useQuery({
    queryKey: ["/api/courses", id, "chapters"],
    queryFn: async () => {
      if (!modules || modules.length === 0) return [];
      const allChapters = [];
      for (const module of modules) {
        const response = await fetch(`/api/modules/${module.id}/chapters`);
        if (response.ok) {
          const moduleChapters = await response.json();
          allChapters.push(...moduleChapters);
        }
      }
      return allChapters;
    },
    enabled: !!modules && modules.length > 0,
  });

  const { data: quizzes } = useQuery({
    queryKey: ["/api/courses", id, "quizzes"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/quizzes`);
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      return response.json();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/courses/${id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to publish course');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course Published",
        description: "Your course has been successfully published to the selected LMS platform.",
      });
      setIsPublishDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Publication Failed",
        description: error.message || "Failed to publish course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    if (!publishDetails.platform || !publishDetails.apiKey) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate(publishDetails);
  };

  if (isCourseLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-2/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-48 bg-slate-200 rounded"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Course Not Found</h2>
              <p className="text-slate-600">The course you're looking for doesn't exist or has been removed.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isInstructor = user?.role === "instructor";
  const isOwner = course.instructorId === user?.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* Course Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">{course.title}</h1>
                <p className="text-slate-600 mb-4">{course.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{course.category}</Badge>
                  <Badge variant="outline">{course.difficulty}</Badge>
                  <Badge variant="outline">{course.status}</Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                            <Button 
              variant="outline"
              onClick={() => window.location.href = `/courses/${course.id}/preview`}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
                {isOwner && (
                  <>
                    <Button onClick={() => window.location.href = `/course-builder/${course.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => setIsExportDialogOpen(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Export Package
                    </Button>
                    <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">
                          <Share2 className="h-4 w-4 mr-2" />
                          Publish
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Publish Course</DialogTitle>
                          <DialogDescription>
                            Publish this course to another Learning Management System (LMS).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="platform">LMS Platform</Label>
                            <Select
                              value={publishDetails.platform}
                              onValueChange={(value) => setPublishDetails({ ...publishDetails, platform: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="moodle">Moodle</SelectItem>
                                <SelectItem value="canvas">Canvas</SelectItem>
                                <SelectItem value="blackboard">Blackboard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                              id="apiKey"
                              type="password"
                              value={publishDetails.apiKey}
                              onChange={(e) => setPublishDetails({ ...publishDetails, apiKey: e.target.value })}
                              placeholder="Enter your API key"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="courseId">Course ID (Optional)</Label>
                            <Input
                              id="courseId"
                              value={publishDetails.courseId}
                              onChange={(e) => setPublishDetails({ ...publishDetails, courseId: e.target.value })}
                              placeholder="Enter course ID if updating existing course"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handlePublish}
                            disabled={publishMutation.isPending}
                          >
                            {publishMutation.isPending ? "Publishing..." : "Publish Course"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="discussions">
                    Discussions
                    {discussions?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{discussions.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="assignments">
                    Assignments
                    {assignments?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{assignments.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="quizzes">
                    Quizzes
                    {quizzes?.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{quizzes.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium">Learning Modules</p>
                            <p className="text-2xl font-bold">{modules?.length || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium">Estimated Time</p>
                            <p className="text-2xl font-bold">{chapters?.length ? Math.ceil(chapters.length * 0.5) : 8}h</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium">Content Units</p>
                            <p className="text-2xl font-bold">{chapters?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Learning Outcomes</h3>
                        <ul className="list-disc list-inside space-y-2 text-slate-600">
                          <li>Master foundational concepts and theoretical frameworks</li>
                          <li>Apply knowledge through practical exercises and real-world scenarios</li>
                          <li>Develop competency in industry-standard practices and methodologies</li>
                          <li>Implement advanced strategies and optimization techniques</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="discussions" className="space-y-4">
                  {discussions?.map((discussion: any) => (
                    <Card key={discussion.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={discussion.user?.profileImageUrl} />
                            <AvatarFallback>
                              {discussion.user?.firstName?.[0]}{discussion.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{discussion.title}</h4>
                              <span className="text-sm text-slate-500">
                                {new Date(discussion.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">{discussion.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="assignments" className="space-y-4">
                  {assignments?.map((assignment: any) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-slate-600 mt-1">{assignment.description}</p>
                          </div>
                          <Badge>
                            Due {new Date(assignment.dueDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="quizzes" className="space-y-4">
                  {quizzes?.map((quiz: any) => (
                    <Card 
                      key={quiz.id} 
                      className="cursor-pointer hover:border-slate-300" 
                      onClick={() => setLocation(`/quizzes/${quiz.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{quiz.title}</h4>
                            <p className="text-slate-600 mt-1">{quiz.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {quiz.timeLimit} minutes
                              </div>
                              <div>
                                Passing Score: {quiz.passingScore}%
                              </div>
                              <div>
                                Attempts: {quiz.attempts}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!quizzes?.length && (
                    <div className="text-center py-8 text-slate-500">
                      No quizzes available for this course.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructor Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={course.instructor?.profileImageUrl} />
                      <AvatarFallback>
                        {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">Instructor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                  <Button className="w-full" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Assignments
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Card (for students) */}
              {!isInstructor && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Course Completion</span>
                          <span className="text-sm text-slate-500">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Statistics</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Chapters Completed</p>
                            <p className="font-medium">12/24</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Time Spent</p>
                            <p className="font-medium">5h 30m</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Export Dialog */}
      {course && (
        <ExportDialog
          courseId={course.id.toString()}
          courseName={course.title}
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      )}
    </div>
  );
} 