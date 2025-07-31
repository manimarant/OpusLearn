import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import "./course-preview.css";

export default function CoursePreview() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  

  

  
  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ["course", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/public`);
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
  });

  const { data: modules, isLoading: isModulesLoading, error: modulesError } = useQuery({
    queryKey: ["modules", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/modules/public`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      return response.json();
    },
  });

  const { data: chapters, isLoading: isChaptersLoading, error: chaptersError } = useQuery({
    queryKey: ["chapters", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/chapters/public`);
      if (!response.ok) throw new Error('Failed to fetch chapters');
      return response.json();
    },
  });

  const { data: discussions } = useQuery({
    queryKey: ["discussions", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/discussions/public`);
      if (!response.ok) throw new Error('Failed to fetch discussions');
      return response.json();
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/assignments/public`);
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
  });

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes", id, "public"],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${id}/quizzes/public`);
      if (!response.ok) throw new Error('Failed to fetch quizzes');
      return response.json();
    },
  });

  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .no-print {
          display: none;
        }
        .print-content {
          margin: 0;
          padding: 20px;
        }
        @page {
          margin: 20mm;
        }
        body {
          font-size: 12pt;
          background: white;
        }
        h1 {
          font-size: 24pt;
        }
        h2 {
          font-size: 20pt;
          break-before: page;
        }
        h3 {
          font-size: 16pt;
        }
        p {
          orphans: 3;
          widows: 3;
        }
        .border-b {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1em;
          margin-bottom: 1em;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);



  if (courseError || modulesError || chaptersError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Error Loading Course</h1>
                <p className="text-slate-600">
                  {courseError?.message || modulesError?.message || chaptersError?.message}
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isCourseLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="w-full p-8">
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
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="w-full p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Course Not Found</h2>
            <p className="text-slate-600">The course you're looking for doesn't exist or has been removed.</p>
          </div>
        </main>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back and Print Buttons */}
      <div className="no-print bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Always navigate to courses page for consistent behavior
                setLocation('/courses');
              }}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <h1 className="text-xl font-semibold text-slate-800">Course Preview</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Course Content
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="print-content max-w-4xl mx-auto py-8 px-6">
        {/* Course Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{course.title}</h1>
          <p className="text-xl text-slate-600 mb-4">{course.description}</p>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span>Category: {course.category}</span>
            <span>•</span>
            <span>Difficulty: {course.difficulty}</span>
            <span>•</span>
            <span>Status: {course.status}</span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Course Overview</li>
            <li>Modules and Chapters</li>
            <li>Assignments</li>
            <li>Discussions</li>
            <li>Quizzes</li>
          </ol>
        </div>

        {/* Course Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">1. Course Overview</h2>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Course Information</h3>
              <ul className="space-y-2 text-slate-600">
                <li><span className="font-medium">Category:</span> {course.category}</li>
                <li><span className="font-medium">Difficulty Level:</span> {course.difficulty}</li>
                <li><span className="font-medium">Status:</span> {course.status}</li>
                <li><span className="font-medium">Total Modules:</span> {modules?.length || 0}</li>
                <li><span className="font-medium">Total Chapters:</span> {chapters?.length || 0}</li>
                <li><span className="font-medium">Total Assignments:</span> {assignments?.length || 0}</li>
                <li><span className="font-medium">Total Quizzes:</span> {quizzes?.length || 0}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Instructor</h3>
              <div className="text-slate-600">
                <p className="font-medium">{course.instructor?.firstName} {course.instructor?.lastName}</p>
                <p>{course.instructor?.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">What you'll learn</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Understanding core concepts and fundamentals</li>
              <li>Practical hands-on exercises and projects</li>
              <li>Real-world application and best practices</li>
              <li>Advanced techniques and optimization</li>
            </ul>
          </div>
        </section>

        {/* Modules and Chapters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">2. Modules and Chapters</h2>
          <div className="space-y-8">
            {modules?.map((module: any) => (
              <div key={module.id} className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-4">{module.title}</h3>
                {module.description && (
                  <p className="text-slate-600 mb-4">{module.description}</p>
                )}
                <div className="space-y-4">
                  {chapters
                    ?.filter((chapter: any) => chapter.moduleId === module.id)
                    .map((chapter: any) => (
                      <div key={chapter.id} className="pl-6">
                        <h4 className="font-medium">{chapter.title}</h4>
                        {chapter.content && (
                          <div className="prose prose-sm text-slate-700 mt-2" dangerouslySetInnerHTML={{ __html: chapter.content }} />
                        )}
                        {chapter.duration && (
                          <p className="text-xs text-slate-500 mt-1">Duration: {chapter.duration} minutes</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {!modules?.length && (
              <p className="text-slate-500 italic">No modules available.</p>
            )}
          </div>
        </section>

        {/* Assignments */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">3. Assignments</h2>
          <div className="space-y-6">
            {assignments?.map((assignment: any) => (
              <div key={assignment.id} className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-2">{assignment.title}</h3>
                <p className="text-slate-600 mb-4">{assignment.description}</p>
                <div className="bg-slate-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <div 
                    className="prose max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: assignment.instructions }} 
                  />
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  <p>Due Date: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  <p>Maximum Points: {assignment.maxPoints}</p>
                </div>
              </div>
            ))}
            {!assignments?.length && (
              <p className="text-slate-500 italic">No assignments available.</p>
            )}
          </div>
        </section>

        {/* Discussions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">4. Discussions</h2>
          <div className="space-y-6">
            {discussions?.map((discussion: any) => (
              <div key={discussion.id} className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-2">{discussion.title}</h3>
                <p className="text-slate-600">{discussion.content}</p>
                <div className="mt-2 text-sm text-slate-500">
                  <p>Started by: {discussion.user?.firstName} {discussion.user?.lastName}</p>
                  <p>Date: {new Date(discussion.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {!discussions?.length && (
              <p className="text-slate-500 italic">No discussions available.</p>
            )}
          </div>
        </section>

        {/* Quizzes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">5. Quizzes</h2>
          <div className="space-y-6">
            {quizzes?.map((quiz: any) => (
              <div key={quiz.id} className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                <p className="text-slate-600 mb-4">{quiz.description}</p>
                <div className="bg-slate-50 p-4 rounded">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Time Limit</p>
                      <p>{quiz.timeLimit} minutes</p>
                    </div>
                    <div>
                      <p className="font-medium">Passing Score</p>
                      <p>{quiz.passingScore}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Attempts Allowed</p>
                      <p>{quiz.attempts}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!quizzes?.length && (
              <p className="text-slate-500 italic">No quizzes available.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 