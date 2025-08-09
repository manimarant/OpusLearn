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
        return "border-gray-200 text-gray-600 bg-gray-50/50";
      case "intermediate":
        return "border-gray-300 text-gray-700 bg-gray-100/50";
      case "advanced":
        return "border-gray-400 text-gray-800 bg-gray-200/50";
      default:
        return "border-gray-200 text-gray-600 bg-gray-50/50";
    }
  };

  // Mock data for demonstration
  const mockProgress = Math.floor(Math.random() * 100);
  const mockStudentCount = Math.floor(Math.random() * 200) + 50;
  const mockDuration = Math.floor(Math.random() * 20) + 5;

  return (
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-white/50 backdrop-blur-sm hover:bg-white/80" onClick={handleCardClick}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Course Header */}
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50/50">
                {course.status}
              </Badge>
              <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                {course.difficulty}
              </Badge>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/50">
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

          <h3 className="font-semibold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {course.description}
          </p>

          {/* Course Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{mockDuration}h</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{course.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{mockStudentCount}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Course Footer */}
        <div className="p-6 pt-4 flex flex-col gap-4 mt-auto">
          {/* Progress Bar for Students */}
          {!isInstructor && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">Progress</span>
                <span className="text-xs text-gray-500">{mockProgress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gray-600 to-gray-700 transition-all duration-300"
                  style={{ width: `${mockProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructor Info */}
          {course.instructor && (
            <div className="flex items-center gap-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={course.instructor.profileImageUrl} />
                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                  {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-gray-800">
                  {course.instructor.firstName} {course.instructor.lastName}
                </p>
                <p className="text-xs text-gray-500">Instructor</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {new Date(course.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <Button 
                  size="sm" 
                  onClick={handleEdit} 
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs h-8"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              ) : !isInstructor ? (
                <Button 
                  size="sm" 
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs h-8"
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/courses/${course.id}`);
                  }} 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs h-8"
                >
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
