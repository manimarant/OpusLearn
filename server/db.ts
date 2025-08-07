import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Mock database for development when DATABASE_URL is not set
let pool: Pool | null = null;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using mock database for development.");
  
  // Create a more comprehensive mock database that handles the specific operations needed
  const mockDb = {
    select: () => ({ 
      from: () => ({ 
        where: () => [], 
        limit: () => [], 
        orderBy: () => [],
        leftJoin: () => ({ where: () => [] })
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        onConflictDoUpdate: () => ({ returning: () => [{ id: 'dev-user-123', email: 'dev@example.com', firstName: 'Development', lastName: 'User', role: 'instructor', profileImageUrl: null, createdAt: new Date(), updatedAt: new Date() }] }), 
        returning: () => [] 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ returning: () => [] }) 
      }) 
    }),
    delete: () => ({ 
      from: () => ({ 
        where: () => ({ returning: () => [] }) 
      }) 
    }),
    query: {
      users: { findMany: () => [], findFirst: () => null },
      courses: { findMany: () => [], findFirst: () => null },
      courseModules: { findMany: () => [], findFirst: () => null },
      chapters: { findMany: () => [], findFirst: () => null },
      enrollments: { findMany: () => [], findFirst: () => null },
      discussions: { findMany: () => [], findFirst: () => null },
      assignments: { findMany: () => [], findFirst: () => null },
      submissions: { findMany: () => [], findFirst: () => null },
      notifications: { findMany: () => [], findFirst: () => null },
      certificates: { findMany: () => [], findFirst: () => null },
    }
  };
  
  pool = null;
  db = mockDb;
} else {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.warn("Falling back to mock database.");
    
    // Fallback to mock database if connection fails
    const mockDb = {
      select: () => ({ 
        from: () => ({ 
          where: () => [], 
          limit: () => [], 
          orderBy: () => [],
          leftJoin: () => ({ where: () => [] })
        }) 
      }),
      insert: () => ({ 
        values: () => ({ 
          onConflictDoUpdate: () => ({ returning: () => [{ id: 'dev-user-123', email: 'dev@example.com', firstName: 'Development', lastName: 'User', role: 'instructor', profileImageUrl: null, createdAt: new Date(), updatedAt: new Date() }] }), 
          returning: () => [] 
        }) 
      }),
      update: () => ({ 
        set: () => ({ 
          where: () => ({ returning: () => [] }) 
        }) 
      }),
      delete: () => ({ 
        from: () => ({ 
          where: () => ({ returning: () => [] }) 
        }) 
      }),
      query: {
        users: { findMany: () => [], findFirst: () => null },
        courses: { findMany: () => [], findFirst: () => null },
        courseModules: { findMany: () => [], findFirst: () => null },
        chapters: { findMany: () => [], findFirst: () => null },
        enrollments: { findMany: () => [], findFirst: () => null },
        discussions: { findMany: () => [], findFirst: () => null },
        assignments: { findMany: () => [], findFirst: () => null },
        submissions: { findMany: () => [], findFirst: () => null },
        notifications: { findMany: () => [], findFirst: () => null },
        certificates: { findMany: () => [], findFirst: () => null },
      }
    };
    
    pool = null;
    db = mockDb;
  }
}


import { eq } from "drizzle-orm";
import {
  courses,
  courseModules,
  chapters,
  discussions,
  assignments,
  users,
  enrollments,
  chapterProgress,
  submissions,
  notifications,
  quizzes,
  quizQuestions,
  quizAttempts,
  rubrics,
  rubricCriteria,
  rubricLevels,
  rubricEvaluations,
  type Course,
  type CourseModule,
  type Chapter,
  type Discussion,
  type Assignment,
  type User,
  type Enrollment,
  type Notification,
  type Quiz,
  type QuizQuestion,
  type QuizAttempt,
  type Rubric,
  type RubricCriteria,
  type RubricLevel,
  type RubricEvaluation,
} from "@shared/schema";

export { pool, db };

// Data access layer
export const storage = {
  // User operations
  async getUser(userId: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  },

  // Course operations
  async getCourses(instructorId?: string): Promise<Course[]> {
    if (instructorId) {
      return db.query.courses.findMany({
        where: eq(courses.instructorId, instructorId),
      });
    }
    return db.query.courses.findMany();
  },

  async getCourse(courseId: number): Promise<Course | undefined> {
    return db.query.courses.findFirst({ where: eq(courses.id, courseId) });
  },

  async createCourse(courseData: Omit<Course, "id" | "createdAt" | "updatedAt" | "status">): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(courseData).returning();
    return newCourse;
  },

  async updateCourse(courseId: number, updates: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses).set(updates).where(eq(courses.id, courseId)).returning();
    return updatedCourse;
  },

  async deleteCourse(courseId: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, courseId));
  },

  // Course Module operations
  async getCourseModules(courseId: number): Promise<CourseModule[]> {
    return db.query.courseModules.findMany({
      where: eq(courseModules.courseId, courseId),
      orderBy: courseModules.orderIndex,
    });
  },

  async createModule(moduleData: Omit<CourseModule, "id" | "createdAt">): Promise<CourseModule> {
    const [newModule] = await db.insert(courseModules).values(moduleData).returning();
    return newModule;
  },

  async updateModule(moduleId: number, updates: Partial<CourseModule>): Promise<CourseModule | undefined> {
    const [updatedModule] = await db.update(courseModules).set(updates).where(eq(courseModules.id, moduleId)).returning();
    return updatedModule;
  },

  async deleteModule(moduleId: number): Promise<void> {
    await db.delete(courseModules).where(eq(courseModules.id, moduleId));
  },

  // Chapter operations
  async getModuleChapters(moduleId: number): Promise<Chapter[]> {
    return db.query.chapters.findMany({
      where: eq(chapters.moduleId, moduleId),
      orderBy: chapters.orderIndex,
    });
  },

  async getCourseChapters(courseId: number): Promise<Chapter[]> {
    return db.query.chapters.findMany({
      where: eq(chapters.moduleId, courseModules.id), // This needs to be a join
      with: {
        module: {
          where: eq(courseModules.courseId, courseId),
        },
      },
      orderBy: chapters.orderIndex,
    });
  },

  async createChapter(chapterData: Omit<Chapter, "id" | "createdAt">): Promise<Chapter> {
    const [newChapter] = await db.insert(chapters).values(chapterData).returning();
    return newChapter;
  },

  async updateChapter(chapterId: number, updates: Partial<Chapter>): Promise<Chapter | undefined> {
    const [updatedChapter] = await db.update(chapters).set(updates).where(eq(chapters.id, chapterId)).returning();
    return updatedChapter;
  },

  async deleteChapter(chapterId: number): Promise<void> {
    await db.delete(chapters).where(eq(chapters.id, chapterId));
  },

  // Enrollment operations
  async enrollInCourse(userId: string, courseId: number): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values({ userId, courseId }).returning();
    return enrollment;
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      with: {
        course: true,
      },
    });
  },

  async getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
    return db.query.enrollments.findMany({
      where: eq(enrollments.courseId, courseId),
      with: {
        user: true,
      },
    });
  },

  // Discussion operations
  async getCourseDiscussions(courseId: number): Promise<Discussion[]> {
    return db.query.discussions.findMany({
      where: eq(discussions.courseId, courseId),
      with: {
        user: true,
      },
      orderBy: discussions.createdAt,
    });
  },

  async createDiscussion(discussionData: Omit<Discussion, "id" | "createdAt" | "updatedAt">): Promise<Discussion> {
    const [newDiscussion] = await db.insert(discussions).values(discussionData).returning();
    return newDiscussion;
  },

  async updateDiscussion(discussionId: number, updates: Partial<Discussion>): Promise<Discussion | undefined> {
    const [updatedDiscussion] = await db.update(discussions).set(updates).where(eq(discussions.id, discussionId)).returning();
    return updatedDiscussion;
  },

  async deleteDiscussion(discussionId: number): Promise<void> {
    await db.delete(discussions).where(eq(discussions.id, discussionId));
  },

  async getDiscussionReplies(discussionId: number): Promise<any[]> {
    return db.query.discussionReplies.findMany({
      where: eq(discussions.id, discussionId),
      with: {
        user: true,
      },
      orderBy: discussions.createdAt,
    });
  },

  async createDiscussionReply(replyData: any): Promise<any> {
    const [newReply] = await db.insert(schema.discussionReplies).values(replyData).returning();
    return newReply;
  },

  // Assignment operations
  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    return db.query.assignments.findMany({
      where: eq(assignments.courseId, courseId),
      orderBy: assignments.dueDate,
    });
  },

  async createAssignment(assignmentData: Omit<Assignment, "id" | "createdAt">): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();
    return newAssignment;
  },

  async updateAssignment(assignmentId: number, updates: Partial<Assignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db.update(assignments).set(updates).where(eq(assignments.id, assignmentId)).returning();
    return updatedAssignment;
  },

  async deleteAssignment(assignmentId: number): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, assignmentId));
  },

  async getAssignmentSubmissions(assignmentId: number): Promise<any[]> {
    return db.query.submissions.findMany({
      where: eq(submissions.assignmentId, assignmentId),
      with: {
        user: true,
      },
      orderBy: submissions.submittedAt,
    });
  },

  async createSubmission(submissionData: any): Promise<any> {
    const [newSubmission] = await db.insert(submissions).values(submissionData).returning();
    return newSubmission;
  },

  // Progress tracking
  async updateChapterProgress(userId: string, chapterId: number, completed: boolean): Promise<void> {
    await db.insert(chapterProgress)
      .values({ userId, chapterId, completed, completedAt: completed ? new Date() : null })
      .onConflictDoUpdate({
        target: [chapterProgress.userId, chapterProgress.chapterId],
        set: { completed, completedAt: completed ? new Date() : null },
      });
  },

  async getUserProgress(userId: string, courseId: number): Promise<any> {
    // This is a simplified example. A real implementation would aggregate progress across chapters/modules.
    return db.query.chapterProgress.findMany({
      where: eq(chapterProgress.userId, userId),
      with: {
        chapter: {
          with: {
            module: true,
          },
        },
      },
    });
  },

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: notifications.createdAt,
    });
  },

  async markNotificationRead(notificationId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  },

  // Quizzes
  async getCourseQuizzes(courseId: number): Promise<Quiz[]> {
    return db.query.quizzes.findMany({
      where: eq(quizzes.courseId, courseId),
      orderBy: quizzes.createdAt,
    });
  },

  async getQuiz(quizId: number): Promise<Quiz | undefined> {
    return db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
  },

  async createQuiz(quizData: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quizData).returning();
    return newQuiz;
  },

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quizId),
      orderBy: quizQuestions.orderIndex,
    });
  },

  async createQuizQuestion(questionData: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(questionData).returning();
    return newQuestion;
  },

  async updateQuizQuestion(questionId: number, updates: Partial<QuizQuestion>): Promise<QuizQuestion | undefined> {
    const [updatedQuestion] = await db.update(quizQuestions).set(updates).where(eq(quizQuestions.id, questionId)).returning();
    return updatedQuestion;
  },

  async createQuizAttempt(attemptData: Omit<QuizAttempt, "id">): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return newAttempt;
  },

  async updateQuizAttempt(attemptId: number, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> {
    const [updatedAttempt] = await db.update(quizAttempts).set(updates).where(eq(quizAttempts.id, attemptId)).returning();
    return updatedAttempt;
  },

  async getQuizAttempt(attemptId: number): Promise<QuizAttempt | undefined> {
    return db.query.quizAttempts.findFirst({ where: eq(quizAttempts.id, attemptId) });
  },

  async getQuizAttempts(quizId: number, userId: string): Promise<QuizAttempt[]> {
    return db.query.quizAttempts.findMany({
      where: (attempt, { and, eq }) => and(eq(attempt.quizId, quizId), eq(attempt.userId, userId)),
      orderBy: quizAttempts.startedAt,
    });
  },

  // Rubrics
  async getRubrics(type?: string, assignmentId?: number, quizId?: number): Promise<Rubric[]> {
    if (type === "assignment" && assignmentId) {
      return db.query.rubrics.findMany({ where: eq(rubrics.assignmentId, assignmentId) });
    }
    if (type === "quiz" && quizId) {
      return db.query.rubrics.findMany({ where: eq(rubrics.quizId, quizId) });
    }
    return db.query.rubrics.findMany();
  },

  async getRubricWithDetails(rubricId: number): Promise<Rubric | undefined> {
    return db.query.rubrics.findFirst({
      where: eq(rubrics.id, rubricId),
      with: {
        criteria: true,
        levels: true,
      },
    });
  },

  async createRubric(rubricData: Omit<Rubric, "id" | "createdAt" | "updatedAt">): Promise<Rubric> {
    const [newRubric] = await db.insert(rubrics).values(rubricData).returning();
    return newRubric;
  },

  async updateRubric(rubricId: number, updates: Partial<Rubric>): Promise<Rubric | undefined> {
    const [updatedRubric] = await db.update(rubrics).set(updates).where(eq(rubrics.id, rubricId)).returning();
    return updatedRubric;
  },

  async deleteRubric(rubricId: number): Promise<void> {
    await db.delete(rubrics).where(eq(rubrics.id, rubricId));
  },

  async createRubricCriteria(criteriaData: Omit<RubricCriteria, "id" | "createdAt">): Promise<RubricCriteria> {
    const [newCriteria] = await db.insert(rubricCriteria).values(criteriaData).returning();
    return newCriteria;
  },

  async createRubricLevel(levelData: Omit<RubricLevel, "id" | "createdAt">): Promise<RubricLevel> {
    const [newLevel] = await db.insert(rubricLevels).values(levelData).returning();
    return newLevel;
  },

  async createRubricEvaluation(evaluationData: Omit<RubricEvaluation, "id" | "evaluatedAt">): Promise<RubricEvaluation> {
    const [newEvaluation] = await db.insert(rubricEvaluations).values(evaluationData).returning();
    return newEvaluation;
  },

  async getRubricEvaluation(evaluationId: number): Promise<RubricEvaluation | undefined> {
    return db.query.rubricEvaluations.findFirst({ where: eq(rubricEvaluations.id, evaluationId) });
  },
};

