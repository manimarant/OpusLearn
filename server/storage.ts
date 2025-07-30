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
  quizAttempts,
  notifications,
  certificates,
  lessonProgress,
  rubrics,
  rubricCriteria,
  rubricLevels,
  rubricEvaluations,
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
  type QuizQuestion,
  type Notification,
  type Rubric,
  type RubricCriteria,
  type RubricLevel,
  type RubricEvaluation,
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
  
  // Rubric operations
  getRubrics(type?: string, assignmentId?: string, quizId?: string): Promise<Rubric[]>;
  getRubricWithDetails(rubricId: number): Promise<any>;
  createRubric(rubric: any): Promise<Rubric>;
  updateRubric(id: number, updates: any): Promise<Rubric>;
  deleteRubric(id: number): Promise<void>;
  createRubricCriteria(criteria: any): Promise<RubricCriteria>;
  createRubricLevel(level: any): Promise<RubricLevel>;
  createRubricEvaluation(evaluation: any): Promise<RubricEvaluation>;
  getRubricEvaluation(evaluationId: number): Promise<any>;
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
    console.log('Getting courses with instructorId:', instructorId);
    let query;
    if (instructorId) {
      query = db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          difficulty: courses.difficulty,
          status: courses.status,
          thumbnail: courses.thumbnail,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
          instructorId: courses.instructorId,
          instructor: users,
        })
        .from(courses)
        .leftJoin(users, eq(courses.instructorId, users.id))
        .where(eq(courses.instructorId, instructorId));
    } else {
      query = db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          difficulty: courses.difficulty,
          status: courses.status,
          thumbnail: courses.thumbnail,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
          instructorId: courses.instructorId,
          instructor: users,
        })
        .from(courses)
        .leftJoin(users, eq(courses.instructorId, users.id))
        .where(eq(courses.status, "published"));
    }
    
    console.log('SQL Query:', query.toSQL());
    const result = await query;
    console.log('Query result:', result);
    return result;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        category: courses.category,
        difficulty: courses.difficulty,
        status: courses.status,
        thumbnail: courses.thumbnail,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        instructorId: courses.instructorId,
        instructor: users,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.id, id));
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
      .select({
        id: courseModules.id,
        title: courseModules.title,
        description: courseModules.description,
        orderIndex: courseModules.orderIndex,
        courseId: courseModules.courseId,
        createdAt: courseModules.createdAt,
      })
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
    console.log('Fetching assignments for course:', courseId);
    const query = db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(desc(assignments.createdAt));
    
    console.log('SQL Query:', query.toSQL());
    const result = await query;
    console.log('Query result:', result);
    return result;
  }

  async createAssignment(assignmentData: any): Promise<Assignment> {
    console.log('Creating assignment with data:', assignmentData);
    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    console.log('Created assignment:', assignment);
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

  // Quiz operations
  async getCourseQuizzes(courseId: number): Promise<Quiz[]> {
    console.log('Fetching quizzes for course:', courseId);
    const query = db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId))
      .orderBy(desc(quizzes.createdAt));
    
    console.log('SQL Query:', query.toSQL());
    const result = await query;
    console.log('Query result:', result);
    return result;
  }

  async createQuiz(quizData: any): Promise<Quiz> {
    console.log('Creating quiz with data:', quizData);
    const [quiz] = await db.insert(quizzes).values(quizData).returning();
    console.log('Created quiz:', quiz);
    return quiz;
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    const questions = await db
      .select({
        id: quizQuestions.id,
        quizId: quizQuestions.quizId,
        question: quizQuestions.question,
        type: quizQuestions.type,
        options: quizQuestions.options,
        correctAnswer: quizQuestions.correctAnswer,
        points: quizQuestions.points,
        orderIndex: quizQuestions.orderIndex,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);

    return questions;
  }

  async createQuizQuestion(questionData: any): Promise<QuizQuestion> {
    const [question] = await db.insert(quizQuestions).values(questionData).returning();
    return question;
  }

  async updateQuizQuestion(id: number, updates: any): Promise<QuizQuestion> {
    const [question] = await db
      .update(quizQuestions)
      .set(updates)
      .where(eq(quizQuestions.id, id))
      .returning();
    return question;
  }

  async getQuizAttempts(quizId: number, userId: string): Promise<any[]> {
    return db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.userId, userId)
      ))
      .orderBy(desc(quizAttempts.startedAt));
  }

  async createQuizAttempt(attemptData: any): Promise<any> {
    const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return attempt;
  }

  async updateQuizAttempt(id: number, updates: any): Promise<any> {
    const [attempt] = await db
      .update(quizAttempts)
      .set(updates)
      .where(eq(quizAttempts.id, id))
      .returning();
    return attempt;
  }

  async getQuiz(id: number): Promise<Quiz> {
    const [quiz] = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        description: quizzes.description,
        timeLimit: quizzes.timeLimit,
        attempts: quizzes.attempts,
        passingScore: quizzes.passingScore,
        courseId: quizzes.courseId,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .where(eq(quizzes.id, id));

    if (!quiz) {
      throw new Error("Quiz not found");
    }
    return quiz;
  }

  async getQuizAttempt(id: number): Promise<any | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    return db
      .select({
        id: lessons.id,
        title: lessons.title,
        content: lessons.content,
        contentType: lessons.contentType,
        duration: lessons.duration,
        moduleId: lessons.moduleId,
        orderIndex: lessons.orderIndex,
        createdAt: lessons.createdAt,
      })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId))
      .orderBy(lessons.orderIndex);
  }

  // Rubric operations
  async getRubrics(type?: string, assignmentId?: string, quizId?: string): Promise<Rubric[]> {
    let whereConditions = [];
    
    if (type) {
      whereConditions.push(eq(rubrics.type, type));
    }
    
    if (assignmentId) {
      whereConditions.push(eq(rubrics.assignmentId, parseInt(assignmentId)));
    }
    
    if (quizId) {
      whereConditions.push(eq(rubrics.quizId, parseInt(quizId)));
    }
    
    return db
      .select()
      .from(rubrics)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(rubrics.createdAt));
  }

  async getRubricWithDetails(rubricId: number): Promise<any> {
    const [rubric] = await db
      .select()
      .from(rubrics)
      .where(eq(rubrics.id, rubricId));

    if (!rubric) {
      return null;
    }

    const criteria = await db
      .select()
      .from(rubricCriteria)
      .where(eq(rubricCriteria.rubricId, rubricId))
      .orderBy(rubricCriteria.orderIndex);

    const levels = await db
      .select()
      .from(rubricLevels)
      .where(eq(rubricLevels.rubricId, rubricId))
      .orderBy(rubricLevels.orderIndex);

    return {
      ...rubric,
      criteria,
      levels,
    };
  }

  async createRubric(rubricData: any): Promise<Rubric> {
    const [rubric] = await db.insert(rubrics).values(rubricData).returning();
    return rubric;
  }

  async updateRubric(id: number, updates: any): Promise<Rubric> {
    const [rubric] = await db
      .update(rubrics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rubrics.id, id))
      .returning();
    return rubric;
  }

  async deleteRubric(id: number): Promise<void> {
    // Delete related records first
    await db.delete(rubricCriteria).where(eq(rubricCriteria.rubricId, id));
    await db.delete(rubricLevels).where(eq(rubricLevels.rubricId, id));
    await db.delete(rubricEvaluations).where(eq(rubricEvaluations.rubricId, id));
    
    // Delete the rubric
    await db.delete(rubrics).where(eq(rubrics.id, id));
  }

  async createRubricCriteria(criteriaData: any): Promise<RubricCriteria> {
    const [criteria] = await db.insert(rubricCriteria).values(criteriaData).returning();
    return criteria;
  }

  async createRubricLevel(levelData: any): Promise<RubricLevel> {
    const [level] = await db.insert(rubricLevels).values(levelData).returning();
    return level;
  }

  async createRubricEvaluation(evaluationData: any): Promise<RubricEvaluation> {
    const [evaluation] = await db.insert(rubricEvaluations).values(evaluationData).returning();
    return evaluation;
  }

  async getRubricEvaluation(evaluationId: number): Promise<any> {
    const [evaluation] = await db
      .select()
      .from(rubricEvaluations)
      .where(eq(rubricEvaluations.id, evaluationId));
    
    return evaluation;
  }
}

export const storage = new DatabaseStorage();
