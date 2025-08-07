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

  const getRandomNoteSource = () => {
    const sources = ["SME", "Faculty", "Instructional Designer"];
    return sources[Math.floor(Math.random() * sources.length)];
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
            <li>Learning Architecture
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm text-slate-600">
                <li>Learning Units (Chapters)</li>
                <li>Performance Assessments (Assignments)</li>
                <li>Knowledge Checks (Quizzes)</li>
                <li>Collaborative Activities (Discussions)</li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Course Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">1. Course Overview</h2>
          
          {/* Course Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Course Description</h3>
            <p className="text-slate-700 leading-relaxed">
              {course.description || "This comprehensive course is designed to provide learners with essential knowledge and practical skills in the subject matter. Through structured modules and hands-on activities, participants will develop competencies aligned with industry standards and best practices."}
            </p>
          </div>

          {/* Learning Outcomes */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Learning Outcomes</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>Master foundational concepts and theoretical frameworks</li>
              <li>Apply knowledge through practical exercises and real-world scenarios</li>
              <li>Develop competency in industry-standard practices and methodologies</li>
              <li>Implement advanced strategies and optimization techniques</li>
            </ul>
          </div>
        </section>

        {/* Learning Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">2. Learning Architecture</h2>
          <div className="space-y-10">
            {modules?.map((module: any, moduleIndex: number) => {
              // Distribute assignments, discussions, and quizzes across modules
              const moduleAssignments = assignments?.filter((_, index) => index % modules.length === moduleIndex) || [];
              const moduleDiscussions = discussions?.filter((_, index) => index % modules.length === moduleIndex) || [];
              const moduleQuizzes = quizzes?.filter((_, index) => index % modules.length === moduleIndex) || [];
              const moduleChapters = chapters?.filter((chapter: any) => chapter.moduleId === module.id) || [];

              // Generate random stakeholder notes
              const stakeholderNotes = [
                { type: "SME", note: "Ensure technical accuracy of all content examples", show: Math.random() > 0.7 },
                { type: "Instructional Designer", note: "Consider adding interactive elements to increase engagement", show: Math.random() > 0.6 },
                { type: "Project Manager", note: "Timeline for this module: 2 weeks development + 1 week review", show: Math.random() > 0.8 },
                { type: "SME", note: "Real-world case studies needed for practical application", show: Math.random() > 0.7 },
                { type: "Instructional Designer", note: "Align assessments with Bloom's taxonomy levels", show: Math.random() > 0.6 },
                { type: "Project Manager", note: "Resource requirements: 3 videos, 5 documents, 2 simulations", show: Math.random() > 0.8 }
              ];

              const moduleNote = stakeholderNotes.find(note => note.show && moduleIndex % 3 === 0);

              return (
                <div key={module.id} className="ml-4 relative">
                  {/* Module Header */}
                  <div className="mb-6 flex">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
                      {module.description && (
                        <p className="text-slate-600 ml-2">{module.description}</p>
                      )}
                    </div>
                    {moduleNote && (
                      <div className="w-80 ml-8 mt-4 mb-4">
                        <div className="pl-3 border-l-2 border-slate-300 text-xs italic text-slate-500 inline-block">
                          <span className="font-medium">Note from {moduleNote.type}:</span> {moduleNote.note}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {/* Learning Units (Chapters) */}
                    {moduleChapters.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">
                          Learning Units ({moduleChapters.length})
                        </h4>
                        <div className="ml-6 space-y-4">
                          {moduleChapters.map((chapter: any, index: number) => {
                            const showChapterNote = index === 0 && Math.random() > 0.6;
                            return (
                              <div key={chapter.id} className="ml-2 flex">
                                <div className="flex-1">
                                  <div className="mb-2">
                                    <h5 className="font-medium text-slate-800">{chapter.title}</h5>
                                    {chapter.duration && (
                                      <span className="text-xs text-slate-500 ml-4">
                                        {chapter.duration} min
                                      </span>
                                    )}
                                  </div>
                                  {chapter.content && (
                                    <div className="prose prose-sm text-slate-600 max-w-none ml-4" dangerouslySetInnerHTML={{ __html: chapter.content }} />
                                  )}
                                </div>
                                {showChapterNote && (
                                  <div className="w-80 ml-8 mt-3 mb-3">
                                    <div className="pl-3 border-l-2 border-slate-300 text-xs italic text-slate-500 inline-block">
                                      <span className="font-medium">Note from Instructional Designer:</span> Include knowledge check questions after this unit
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Performance Assessments (Assignments) */}
                    {moduleAssignments.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">
                          Performance Assessments ({moduleAssignments.length})
                        </h4>
                        <div className="ml-6 space-y-6">
                          {moduleAssignments.map((assignment: any, assignmentIndex: number) => {
                            const showAssignmentNote = assignmentIndex === 0 && Math.random() > 0.5;
                            return (
                              <div key={assignment.id} className="ml-2 flex">
                                <div className="flex-1">
                                  <h5 className="font-medium text-slate-800 mb-2">{assignment.title}</h5>
                                  <p className="text-slate-600 mb-3 ml-4">{assignment.description}</p>
                                  {assignment.instructions && (
                                    <div className="ml-4 mb-3">
                                      <h6 className="font-medium text-slate-700 mb-2 text-sm">Instructions:</h6>
                                      <div 
                                        className="prose prose-sm text-slate-600 max-w-none ml-2"
                                        dangerouslySetInnerHTML={{ __html: assignment.instructions }} 
                                      />
                                    </div>
                                  )}
                                  <div className="text-sm text-slate-500 ml-4 space-y-1">
                                    <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                    <p className="text-slate-600">
                                      {assignment.maxPoints} points
                                    </p>
                                  </div>
                                </div>
                                {showAssignmentNote && (
                                  <div className="w-80 ml-8 mt-3 mb-3">
                                    <div className="pl-3 border-l-2 border-slate-300 text-xs italic text-slate-500 inline-block">
                                      <span className="font-medium">Note from SME:</span> Consider providing rubric with detailed scoring criteria
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Knowledge Checks (Quizzes) */}
                    {moduleQuizzes.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">
                          Knowledge Checks ({moduleQuizzes.length})
                        </h4>
                        <div className="ml-6 space-y-4">
                          {moduleQuizzes.map((quiz: any, quizIndex: number) => {
                            const showQuizNote = quizIndex === 0 && Math.random() > 0.7;
                            return (
                              <div key={quiz.id} className="ml-2 flex">
                                <div className="flex-1">
                                  <h5 className="font-medium text-slate-800 mb-2">{quiz.title}</h5>
                                  <p className="text-slate-600 mb-3 ml-4">{quiz.description}</p>
                                  <div className="ml-4">
                                    <div className="grid grid-cols-3 gap-6 text-sm">
                                      <div>
                                        <p className="font-medium text-slate-700">Time Limit</p>
                                        <p className="text-slate-600">{quiz.timeLimit} minutes</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-700">Passing Score</p>
                                        <p className="text-slate-600">{quiz.passingScore || 70}%</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-700">Attempts</p>
                                        <p className="text-slate-600">{quiz.attempts || 'Unlimited'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {showQuizNote && (
                                  <div className="w-80 ml-8 mt-3 mb-3">
                                    <div className="pl-3 border-l-2 border-slate-300 text-xs italic text-slate-500 inline-block">
                                      <span className="font-medium">Note from Project Manager:</span> Review quiz questions during SME validation phase
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Collaborative Activities (Discussions) */}
                    {moduleDiscussions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-medium text-slate-800 mb-4">
                          Collaborative Activities ({moduleDiscussions.length})
                        </h4>
                        <div className="ml-6 space-y-4">
                          {moduleDiscussions.map((discussion: any, discussionIndex: number) => {
                            const showDiscussionNote = discussionIndex === 0 && Math.random() > 0.4;
                            return (
                              <div key={discussion.id} className="ml-2 flex">
                                <div className="flex-1">
                                  <h5 className="font-medium text-slate-800 mb-2">{discussion.title}</h5>
                                  <p className="text-slate-600 mb-3 ml-4">{discussion.content}</p>
                                  <div className="text-sm text-slate-500 ml-4">
                                    <p>Discussion initiated: {new Date(discussion.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                {showDiscussionNote && (
                                  <div className="w-80 ml-8 mt-3 mb-3">
                                    <div className="pl-3 border-l-2 border-slate-300 text-xs italic text-slate-500 inline-block">
                                      <span className="font-medium">Note from Instructional Designer:</span> Consider adding discussion prompts to guide meaningful peer interaction
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!modules?.length && (
              <div className="text-center py-12">
                <p className="text-slate-500 italic text-lg">No learning modules available.</p>
              </div>
            )}
          </div>
        </section>


      </div>
    </div>
  );
} 