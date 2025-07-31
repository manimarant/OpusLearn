import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCourseSchema, 
  insertModuleSchema, 
  insertChapterSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertQuizAttemptSchema,
  insertRubricSchema,
  insertRubricCriteriaSchema,
  insertRubricLevelSchema,
  insertRubricEvaluationSchema,
  type Quiz
} from "@shared/schema";

// Helper function to get user ID (works in both development and production)
function getUserId(req: any): string {
  if (!process.env.REPLIT_DOMAINS) {
    return 'dev-user-123'; // Development mode
  }
  return req.user.claims.sub; // Production mode
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
// Development mode - return mock user
      console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
      if (!process.env.REPLIT_DOMAINS) {
        console.log('Returning mock user.');
        return res.json({
          id: 'dev-user-123',
          email: 'dev@example.com',
          firstName: 'Development',
          lastName: 'User',
          role: 'instructor',
          profileImageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Course routes
  app.get('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('Fetching courses for user:', userId);
      
      const user = await storage.getUser(userId);
      console.log('User role:', user?.role);
      
      let courses;
      if (user?.role === 'instructor') {
        console.log('Fetching instructor courses');
        courses = await storage.getCourses(userId);
      } else {
        console.log('Fetching student courses');
        const enrollments = await storage.getUserEnrollments(userId);
        courses = enrollments.map(e => e.course);
      }
      
      console.log('Returning courses:', courses);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Public course endpoint for preview
  app.get('/api/courses/:id/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'instructor') {
        return res.status(403).json({ message: "Only instructors can create courses" });
      }

      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse({
        ...courseData,
        instructorId: userId,
      });

      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/courses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(courseId, updates);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(400).json({ message: "Failed to update course" });
    }
  });

  // Course module routes
  app.get('/api/courses/:id/modules', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  // Public modules endpoint for preview
  app.get('/api/courses/:id/modules/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post('/api/courses/:id/modules', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const moduleData = insertModuleSchema.parse({
        ...req.body,
        courseId,
      });
      
      const module = await storage.createModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ message: "Failed to create module" });
    }
  });

  // Chapter routes
  app.get('/api/modules/:id/chapters', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const chapters = await storage.getModuleChapters(moduleId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  // Public chapters endpoint for preview
  app.get('/api/courses/:id/chapters/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const chapters = await storage.getCourseChapters(courseId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.post('/api/modules/:id/chapters', isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // TODO: Add authorization check for module ownership
      
      const chapterData = insertChapterSchema.parse({
        ...req.body,
        moduleId,
      });
      
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(400).json({ message: "Failed to create chapter" });
    }
  });

  app.put('/api/chapters/:id', isAuthenticated, async (req: any, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const updates = insertChapterSchema.partial().parse(req.body);
      
      const chapter = await storage.updateChapter(chapterId, updates);
      res.json(chapter);
    } catch (error) {
      console.error("Error updating chapter:", error);
      res.status(400).json({ message: "Failed to update chapter" });
    }
  });

  // Enrollment routes
  app.post('/api/courses/:id/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const enrollment = await storage.enrollInCourse(userId, courseId);
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(400).json({ message: "Failed to enroll in course" });
    }
  });

  app.get('/api/courses/:id/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const enrollments = await storage.getCourseEnrollments(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Discussion routes
  app.get('/api/courses/:id/discussions', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const discussions = await storage.getCourseDiscussions(courseId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  // Public discussions endpoint for preview
  app.get('/api/courses/:id/discussions/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const discussions = await storage.getCourseDiscussions(courseId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });

  app.post('/api/courses/:id/discussions', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const discussionData = insertDiscussionSchema.parse({
        ...req.body,
        courseId,
        userId,
      });
      
      const discussion = await storage.createDiscussion(discussionData);
      res.json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(400).json({ message: "Failed to create discussion" });
    }
  });

  app.get('/api/discussions/:id/replies', isAuthenticated, async (req, res) => {
    try {
      const discussionId = parseInt(req.params.id);
      const replies = await storage.getDiscussionReplies(discussionId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post('/api/discussions/:id/replies', isAuthenticated, async (req: any, res) => {
    try {
      const discussionId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const replyData = insertDiscussionReplySchema.parse({
        ...req.body,
        discussionId,
        userId,
      });
      
      const reply = await storage.createDiscussionReply(replyData);
      res.json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(400).json({ message: "Failed to create reply" });
    }
  });

  // Assignment routes
  app.get('/api/courses/:id/assignments', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const assignments = await storage.getCourseAssignments(courseId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Public assignments endpoint for preview
  app.get('/api/courses/:id/assignments/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const assignments = await storage.getCourseAssignments(courseId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/courses/:id/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      console.log('Creating assignment with data:', {
        body: req.body,
        courseId,
        userId,
        headers: req.headers,
        params: req.params,
      });
      
      const course = await storage.getCourse(courseId);
      console.log('Found course:', course);
      
      if (!course || course.instructorId !== userId) {
        console.log('Authorization failed:', {
          courseInstructorId: course?.instructorId,
          requestUserId: userId,
        });
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Remove courseId from body since it's in the URL params
      const { courseId: _, ...assignmentDataWithoutCourseId } = req.body;

      console.log('Preparing assignment data:', {
        original: req.body,
        withoutCourseId: assignmentDataWithoutCourseId,
        finalData: {
          ...assignmentDataWithoutCourseId,
          courseId,
        }
      });

      const assignmentData = insertAssignmentSchema.parse({
        ...assignmentDataWithoutCourseId,
        courseId,
      });
      
      console.log('Parsed assignment data:', assignmentData);
      
      const assignment = await storage.createAssignment(assignmentData);
      console.log('Created assignment:', assignment);
      
      res.json(assignment);
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      if (error?.errors) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("Request body:", JSON.stringify(req.body, null, 2));
        console.error("Schema:", JSON.stringify(insertAssignmentSchema.shape, null, 2));
      }
      res.status(400).json({ 
        message: "Failed to create assignment", 
        errors: error?.errors || error?.message || String(error)
      });
    }
  });

  app.get('/api/assignments/:id/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const submissions = await storage.getAssignmentSubmissions(assignmentId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/assignments/:id/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        assignmentId,
        userId,
      });
      
      const submission = await storage.createSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(400).json({ message: "Failed to create submission" });
    }
  });

  // Progress tracking
  app.post('/api/chapters/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { completed } = req.body;
      
      await storage.updateChapterProgress(userId, chapterId, completed);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(400).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/courses/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const progress = await storage.getUserProgress(userId, courseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(400).json({ message: "Failed to mark notification read" });
    }
  });

  // Quiz routes
  app.get('/api/courses/:id/quizzes', isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const quizzes = await storage.getCourseQuizzes(courseId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // Public quizzes endpoint for preview
  app.get('/api/courses/:id/quizzes/public', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const quizzes = await storage.getCourseQuizzes(courseId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/courses/:id/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const quizData = insertQuizSchema.parse({
        ...req.body,
        courseId,
      });
      
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ message: "Failed to create quiz" });
    }
  });

  // Get quiz by ID
  app.get('/api/quizzes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(404).json({ message: "Quiz not found" });
    }
  });

  // Get quiz questions
  app.get('/api/quizzes/:id/questions', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const questions = await storage.getQuizQuestions(quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(400).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post('/api/quizzes/:id/questions', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // Verify quiz ownership through course
      const quiz = await storage.getQuiz(quizId);
      const course = await storage.getCourse(quiz.courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const questionData = insertQuizQuestionSchema.parse({
        ...req.body,
        quizId,
      });
      
      const question = await storage.createQuizQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(400).json({ message: "Failed to create quiz question" });
    }
  });

  app.put('/api/quizzes/:quizId/questions/:questionId', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const questionId = parseInt(req.params.questionId);
      const userId = getUserId(req);
      
      // Verify quiz ownership through course
      let quiz: Quiz;
      try {
        quiz = await storage.getQuiz(quizId);
      } catch (error) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const course = await storage.getCourse(quiz.courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const questionData = insertQuizQuestionSchema.partial().parse({
        ...req.body,
        quizId,
      });
      
      const question = await storage.updateQuizQuestion(questionId, questionData);
      res.json(question);
    } catch (error: any) {
      console.error("Error updating quiz question:", error);
      if (error?.errors) {
        console.error("Validation errors:", error.errors);
      }
      res.status(400).json({ 
        message: "Failed to update quiz question", 
        errors: error?.errors || error?.message || String(error)
      });
    }
  });

  app.post('/api/quizzes/:id/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const attemptData = insertQuizAttemptSchema.parse({
        ...req.body,
        quizId,
        userId,
        startedAt: new Date(),
      });
      
      const attempt = await storage.createQuizAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      res.status(400).json({ message: "Failed to create quiz attempt" });
    }
  });

  app.put('/api/quiz-attempts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // Verify attempt ownership
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt || attempt.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = insertQuizAttemptSchema.partial().parse({
        ...req.body,
        completedAt: new Date(),
      });
      
      const updatedAttempt = await storage.updateQuizAttempt(attemptId, updates);
      res.json(updatedAttempt);
    } catch (error) {
      console.error("Error updating quiz attempt:", error);
      res.status(400).json({ message: "Failed to update quiz attempt" });
    }
  });

  app.get('/api/quizzes/:id/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const attempts = await storage.getQuizAttempts(quizId, userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Publish course to external LMS
  app.post('/api/courses/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // Verify course ownership
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get instructor details
      const instructor = await storage.getUser(course.instructorId);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }

      const { platform, apiKey, courseId: externalCourseId } = req.body;

      // Fetch all course content
      const [discussions, assignments, quizzes] = await Promise.all([
        storage.getCourseDiscussions(courseId),
        storage.getCourseAssignments(courseId),
        storage.getCourseQuizzes(courseId),
      ]);

      // Fetch quiz questions
      const quizzesWithQuestions = await Promise.all(
        quizzes.map(async (quiz) => ({
          ...quiz,
          questions: await storage.getQuizQuestions(quiz.id),
        }))
      );

      // Format course data for external LMS
      const courseData = {
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        instructor: {
          id: instructor.id,
          name: `${instructor.firstName} ${instructor.lastName}`,
          email: instructor.email,
        },
        discussions: discussions.map(d => ({
          title: d.title,
          content: d.content,
          pinned: d.pinned,
          locked: d.locked,
          author: {
            name: `${d.user?.firstName} ${d.user?.lastName}`,
            email: d.user?.email,
          },
          createdAt: d.createdAt,
        })),
        assignments: assignments.map(a => ({
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          dueDate: a.dueDate,
          maxPoints: a.maxPoints,
          status: a.status,
        })),
        quizzes: quizzesWithQuestions.map(q => ({
          title: q.title,
          description: q.description,
          timeLimit: q.timeLimit,
          attempts: q.attempts,
          passingScore: q.passingScore,
          questions: q.questions.map(question => ({
            question: question.question,
            type: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
          })),
        })),
      };

      // TODO: Implement actual LMS integration
      // This is a mock implementation
      console.log(`Publishing course to ${platform}:`, {
        courseData,
        apiKey: '***',
        externalCourseId,
      });

      // Mock successful publish
      await new Promise(resolve => setTimeout(resolve, 2000));

      res.json({ 
        message: "Course published successfully",
        platform,
        externalCourseId: externalCourseId || "new-course-123",
      });
    } catch (error: any) {
      console.error("Error publishing course:", error);
      res.status(500).json({ 
        message: "Failed to publish course", 
        error: error.message 
      });
    }
  });

  // Get course modules
  app.get('/api/courses/:id/modules', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await storage.getCourseModules(courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching course modules:", error);
      res.status(400).json({ message: "Failed to fetch course modules" });
    }
  });

  // Get course chapters
  app.get('/api/courses/:id/chapters', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const chapters = await storage.getCourseChapters(courseId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching course chapters:", error);
      res.status(400).json({ message: "Failed to fetch course chapters" });
    }
  });

  // Rubric routes
  // Get rubrics for assignment or quiz
  app.get('/api/rubrics', isAuthenticated, async (req: any, res) => {
    try {
      const { type, assignmentId, quizId } = req.query;
      const rubrics = await storage.getRubrics(type, assignmentId, quizId);
      res.json(rubrics);
    } catch (error) {
      console.error("Error fetching rubrics:", error);
      res.status(500).json({ message: "Failed to fetch rubrics" });
    }
  });

  // Get rubric with criteria and levels
  app.get('/api/rubrics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      const rubric = await storage.getRubricWithDetails(rubricId);
      
      if (!rubric) {
        return res.status(404).json({ message: "Rubric not found" });
      }
      
      res.json(rubric);
    } catch (error) {
      console.error("Error fetching rubric:", error);
      res.status(500).json({ message: "Failed to fetch rubric" });
    }
  });

  // Create rubric
  app.post('/api/rubrics', isAuthenticated, async (req: any, res) => {
    try {
      const rubricData = insertRubricSchema.parse(req.body);
      const rubric = await storage.createRubric(rubricData);
      res.json(rubric);
    } catch (error) {
      console.error("Error creating rubric:", error);
      res.status(400).json({ message: "Failed to create rubric" });
    }
  });

  // Update rubric
  app.put('/api/rubrics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      const updates = insertRubricSchema.partial().parse(req.body);
      const rubric = await storage.updateRubric(rubricId, updates);
      res.json(rubric);
    } catch (error) {
      console.error("Error updating rubric:", error);
      res.status(400).json({ message: "Failed to update rubric" });
    }
  });

  // Delete rubric
  app.delete('/api/rubrics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      await storage.deleteRubric(rubricId);
      res.json({ message: "Rubric deleted successfully" });
    } catch (error) {
      console.error("Error deleting rubric:", error);
      res.status(400).json({ message: "Failed to delete rubric" });
    }
  });

  // Add criteria to rubric
  app.post('/api/rubrics/:id/criteria', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      const criteriaData = insertRubricCriteriaSchema.parse({
        ...req.body,
        rubricId
      });
      const criteria = await storage.createRubricCriteria(criteriaData);
      res.json(criteria);
    } catch (error) {
      console.error("Error creating rubric criteria:", error);
      res.status(400).json({ message: "Failed to create rubric criteria" });
    }
  });

  // Add level to rubric
  app.post('/api/rubrics/:id/levels', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      const levelData = insertRubricLevelSchema.parse({
        ...req.body,
        rubricId
      });
      const level = await storage.createRubricLevel(levelData);
      res.json(level);
    } catch (error) {
      console.error("Error creating rubric level:", error);
      res.status(400).json({ message: "Failed to create rubric level" });
    }
  });

  // Evaluate submission/quiz with rubric
  app.post('/api/rubrics/:id/evaluate', isAuthenticated, async (req: any, res) => {
    try {
      const rubricId = parseInt(req.params.id);
      const evaluationData = insertRubricEvaluationSchema.parse({
        ...req.body,
        rubricId
      });
      const evaluation = await storage.createRubricEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      console.error("Error creating rubric evaluation:", error);
      res.status(400).json({ message: "Failed to create rubric evaluation" });
    }
  });

  // Get rubric evaluation
  app.get('/api/rubrics/:id/evaluations/:evaluationId', isAuthenticated, async (req: any, res) => {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const evaluation = await storage.getRubricEvaluation(evaluationId);
      
      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }
      
      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching rubric evaluation:", error);
      res.status(500).json({ message: "Failed to fetch rubric evaluation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
