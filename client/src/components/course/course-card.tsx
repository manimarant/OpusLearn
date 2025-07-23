import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Clock, Play, Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CourseCardProps {
  course: any;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/enroll`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the course.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in the course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    enrollMutation.mutate(course.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/course-builder/${course.id}`);
  };

  const handleCardClick = () => {
    setLocation(`/courses/${course.id}`);
  };

  const isInstructor = user?.role === "instructor";
  const isOwner = course.instructorId === user?.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Mock data for demonstration
  const mockProgress = Math.floor(Math.random() * 100);
  const mockStudentCount = Math.floor(Math.random() * 200) + 50;
  const mockDuration = Math.floor(Math.random() * 20) + 5;

  return (
    <Card className="interactive-card group overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={handleCardClick}>
      <CardContent className="p-0">
        {/* Course Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge className={getStatusColor(course.status)}>
              {course.status}
            </Badge>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="absolute bottom-4 left-4">
            <Badge className={getDifficultyColor(course.difficulty)}>
              {course.difficulty}
            </Badge>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="lg" className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
              <Play className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>

        {/* Course Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
          </div>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Course Metadata */}
          <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{mockStudentCount} students</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{mockDuration}h duration</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.category}</span>
            </div>
          </div>

          {/* Progress Bar for Students */}
          {!isInstructor && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm text-slate-500">{mockProgress}%</span>
              </div>
              <Progress value={mockProgress} className="h-2" />
            </div>
          )}

          {/* Instructor Info */}
          {course.instructor && (
            <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={course.instructor.profileImageUrl} />
                <AvatarFallback>
                  {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {course.instructor.firstName} {course.instructor.lastName}
                </p>
                <p className="text-xs text-slate-500">Instructor</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Updated {new Date(course.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              {isOwner ? (
                <Button size="sm" onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : !isInstructor ? (
                <Button 
                  size="sm" 
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/courses/${course.id}`);
                }}>
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
