import {
  users,
  courses,
  courseModules,
  lessons,
  enrollments,
  discussions,
  discussionReplies,
  assignments,
  submissions,
  quizzes,
  quizQuestions,
  notifications,
  certificates,
  lessonProgress,
  type User,
  type UpsertUser,
  type Course,
  type CourseModule,
  type Lesson,
  type Enrollment,
  type Discussion,
  type DiscussionReply,
  type Assignment,
  type Submission,
  type Quiz,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(instructorId?: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: any): Promise<Course>;
  updateCourse(id: number, updates: any): Promise<Course>;
  
  // Module operations
  getCourseModules(courseId: number): Promise<CourseModule[]>;
  createModule(module: any): Promise<CourseModule>;
  updateModule(id: number, updates: any): Promise<CourseModule>;
  
  // Lesson operations
  getModuleLessons(moduleId: number): Promise<Lesson[]>;
  createLesson(lesson: any): Promise<Lesson>;
  updateLesson(id: number, updates: any): Promise<Lesson>;
  
  // Enrollment operations
  enrollInCourse(userId: string, courseId: number): Promise<Enrollment>;
  getUserEnrollments(userId: string): Promise<any[]>;
  getCourseEnrollments(courseId: number): Promise<any[]>;
  
  // Discussion operations
  getCourseDiscussions(courseId: number): Promise<any[]>;
  createDiscussion(discussion: any): Promise<Discussion>;
  getDiscussionReplies(discussionId: number): Promise<any[]>;
  createDiscussionReply(reply: any): Promise<DiscussionReply>;
  
  // Assignment operations
  getCourseAssignments(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: any): Promise<Assignment>;
  getAssignmentSubmissions(assignmentId: number): Promise<any[]>;
  createSubmission(submission: any): Promise<Submission>;
  
  // Progress tracking
  updateLessonProgress(userId: string, lessonId: number, completed: boolean): Promise<void>;
  getUserProgress(userId: string, courseId: number): Promise<any>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: any): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  
  // Analytics
  getInstructorStats(instructorId: string): Promise<any>;
  getCourseAnalytics(courseId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(instructorId?: string): Promise<Course[]> {
    if (instructorId) {
      return db.select().from(courses).where(eq(courses.instructorId, instructorId));
    }
    return db.select().from(courses).where(eq(courses.status, "published"));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(courseData: any): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async updateCourse(id: number, updates: any): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  // Module operations
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return db
      .select()
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId))
      .orderBy(courseModules.orderIndex);
  }

  async createModule(moduleData: any): Promise<CourseModule> {
    const [module] = await db.insert(courseModules).values(moduleData).returning();
    return module;
  }

  async updateModule(id: number, updates: any): Promise<CourseModule> {
    const [module] = await db
      .update(courseModules)
      .set(updates)
      .where(eq(courseModules.id, id))
      .returning();
    return module;
  }

  // Lesson operations
  async getModuleLessons(moduleId: number): Promise<Lesson[]> {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.orderIndex);
  }

  async createLesson(lessonData: any): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(lessonData).returning();
    return lesson;
  }

  async updateLesson(id: number, updates: any): Promise<Lesson> {
    const [lesson] = await db
      .update(lessons)
      .set(updates)
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  }

  // Enrollment operations
  async enrollInCourse(userId: string, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();
    return enrollment;
  }

  async getUserEnrollments(userId: string): Promise<any[]> {
    return db
      .select({
        id: enrollments.id,
        progress: enrollments.progress,
        enrolledAt: enrollments.enrolledAt,
        course: courses,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));
  }

  async getCourseEnrollments(courseId: number): Promise<any[]> {
    return db
      .select({
        id: enrollments.id,
        progress: enrollments.progress,
        enrolledAt: enrollments.enrolledAt,
        user: users,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, courseId));
  }

  // Discussion operations
  async getCourseDiscussions(courseId: number): Promise<any[]> {
    return db
      .select({
        id: discussions.id,
        title: discussions.title,
        content: discussions.content,
        pinned: discussions.pinned,
        createdAt: discussions.createdAt,
        user: users,
        replyCount: count(discussionReplies.id),
      })
      .from(discussions)
      .leftJoin(users, eq(discussions.userId, users.id))
      .leftJoin(discussionReplies, eq(discussions.id, discussionReplies.discussionId))
      .where(eq(discussions.courseId, courseId))
      .groupBy(discussions.id, users.id)
      .orderBy(desc(discussions.pinned), desc(discussions.createdAt));
  }

  async createDiscussion(discussionData: any): Promise<Discussion> {
    const [discussion] = await db.insert(discussions).values(discussionData).returning();
    return discussion;
  }

  async getDiscussionReplies(discussionId: number): Promise<any[]> {
    return db
      .select({
        id: discussionReplies.id,
        content: discussionReplies.content,
        createdAt: discussionReplies.createdAt,
        user: users,
      })
      .from(discussionReplies)
      .leftJoin(users, eq(discussionReplies.userId, users.id))
      .where(eq(discussionReplies.discussionId, discussionId))
      .orderBy(discussionReplies.createdAt);
  }

  async createDiscussionReply(replyData: any): Promise<DiscussionReply> {
    const [reply] = await db.insert(discussionReplies).values(replyData).returning();
    return reply;
  }

  // Assignment operations
  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(desc(assignments.createdAt));
  }

  async createAssignment(assignmentData: any): Promise<Assignment> {
    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    return assignment;
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<any[]> {
    return db
      .select({
        id: submissions.id,
        content: submissions.content,
        fileUrl: submissions.fileUrl,
        score: submissions.score,
        submittedAt: submissions.submittedAt,
        user: users,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submissionData: any): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(submissionData).returning();
    return submission;
  }

  // Progress tracking
  async updateLessonProgress(userId: string, lessonId: number, completed: boolean): Promise<void> {
    await db
      .insert(lessonProgress)
      .values({
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
  }

  async getUserProgress(userId: string, courseId: number): Promise<any> {
    // This would calculate overall progress for a user in a course
    const result = await db
      .select({
        totalLessons: count(lessons.id),
        completedLessons: sql<number>`COUNT(CASE WHEN ${lessonProgress.completed} = true THEN 1 END)`,
      })
      .from(lessons)
      .leftJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .leftJoin(lessonProgress, and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId)
      ))
      .where(eq(courseModules.courseId, courseId));

    return result[0];
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async createNotification(notificationData: any): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  // Analytics
  async getInstructorStats(instructorId: string): Promise<any> {
    const [courseCount] = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.instructorId, instructorId));

    const [enrollmentCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId));

    return {
      activeCourses: courseCount.count,
      totalStudents: enrollmentCount.count,
    };
  }

  async getCourseAnalytics(courseId: number): Promise<any> {
    const [enrollmentCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    return {
      totalEnrollments: enrollmentCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
