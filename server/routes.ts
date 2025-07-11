import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCourseSchema, 
  insertModuleSchema, 
  insertLessonSchema,
  insertDiscussionSchema,
  insertDiscussionReplySchema,
  insertAssignmentSchema,
  insertSubmissionSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'instructor') {
        const courses = await storage.getCourses(userId);
        res.json(courses);
      } else {
        const enrollments = await storage.getUserEnrollments(userId);
        res.json(enrollments.map(e => e.course));
      }
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

  app.post('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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

  app.post('/api/courses/:id/modules', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
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

  // Lesson routes
  app.get('/api/modules/:id/lessons', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const lessons = await storage.getModuleLessons(moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post('/api/modules/:id/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // TODO: Add authorization check for module ownership
      
      const lessonData = insertLessonSchema.parse({
        ...req.body,
        moduleId,
      });
      
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(400).json({ message: "Failed to create lesson" });
    }
  });

  app.put('/api/lessons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const updates = insertLessonSchema.partial().parse(req.body);
      
      const lesson = await storage.updateLesson(lessonId, updates);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(400).json({ message: "Failed to update lesson" });
    }
  });

  // Enrollment routes
  app.post('/api/courses/:id/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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

  app.post('/api/courses/:id/discussions', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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

  app.post('/api/courses/:id/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const assignmentData = insertAssignmentSchema.parse({
        ...req.body,
        courseId,
      });
      
      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(400).json({ message: "Failed to create assignment" });
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
      const userId = req.user.claims.sub;
      
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
  app.post('/api/lessons/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { completed } = req.body;
      
      await storage.updateLessonProgress(userId, lessonId, completed);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(400).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/courses/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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

  // Analytics
  app.get('/api/analytics/instructor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'instructor') {
        return res.status(403).json({ message: "Only instructors can access analytics" });
      }
      
      const stats = await storage.getInstructorStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching instructor stats:", error);
      res.status(500).json({ message: "Failed to fetch instructor stats" });
    }
  });

  app.get('/api/analytics/course/:id', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const course = await storage.getCourse(courseId);
      if (!course || course.instructorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const analytics = await storage.getCourseAnalytics(courseId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching course analytics:", error);
      res.status(500).json({ message: "Failed to fetch course analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
