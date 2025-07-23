import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  jsonb, 
  index, 
  serial, 
  integer, 
  boolean, 
  decimal 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom Zod transformers
const dateStringToDate = z.string().datetime().transform((str) => new Date(str));
const nullableDateStringToDate = z.string().datetime().nullable().transform((str) => str ? new Date(str) : null);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // student, instructor, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category"),
  difficulty: varchar("difficulty"), // beginner, intermediate, advanced
  instructorId: varchar("instructor_id").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  thumbnail: varchar("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course modules/chapters
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lessons within modules
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  content: text("content"), // Rich text content
  contentType: varchar("content_type").notNull().default("text"), // text, video, interactive
  duration: integer("duration"), // in minutes
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"),
  completedAt: timestamp("completed_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// Student progress tracking
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent").default(0), // in seconds
  completedAt: timestamp("completed_at"),
});

// Assignments
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("due_date"),
  maxPoints: integer("max_points").default(100),
  status: varchar("status").notNull().default("active"), // active, closed
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignment submissions
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content"),
  fileUrl: varchar("file_url"),
  score: decimal("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
});

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  lessonId: integer("lesson_id"),
  title: text("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit"), // in minutes
  attempts: integer("attempts").default(1),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz questions
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  question: text("question").notNull(),
  type: varchar("type").notNull(), // multiple_choice, true_false, short_answer
  options: jsonb("options"), // Array of options for multiple choice
  correctAnswer: text("correct_answer"),
  points: integer("points").default(1),
  orderIndex: integer("order_index").notNull(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: varchar("user_id").notNull(),
  answers: jsonb("answers"), // User's answers
  score: decimal("score", { precision: 5, scale: 2 }),
  completed: boolean("completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Discussion forums
export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  pinned: boolean("pinned").default(false),
  locked: boolean("locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Discussion replies
export const discussionReplies = pgTable("discussion_replies", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"), // For nested replies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // info, success, warning, error
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  certificateUrl: varchar("certificate_url"),
  issuedAt: timestamp("issued_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  discussions: many(discussions),
  submissions: many(submissions),
  notifications: many(notifications),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  modules: many(courseModules),
  enrollments: many(enrollments),
  assignments: many(assignments),
  discussions: many(discussions),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [lessons.moduleId],
    references: [courseModules.id],
  }),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  user: one(users, {
    fields: [discussions.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [discussions.courseId],
    references: [courses.id],
  }),
  replies: many(discussionReplies),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one }) => ({
  user: one(users, {
    fields: [discussionReplies.userId],
    references: [users.id],
  }),
  discussion: one(discussions, {
    fields: [discussionReplies.discussionId],
    references: [discussions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  thumbnail: true,
});

export const insertModuleSchema = createInsertSchema(courseModules).pick({
  courseId: true,
  title: true,
  description: true,
  orderIndex: true,
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  moduleId: true,
  title: true,
  content: true,
  contentType: true,
  duration: true,
  orderIndex: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).pick({
  courseId: true,
  userId: true,
  title: true,
  content: true,
  pinned: true,
  locked: true,
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).pick({
  discussionId: true,
  content: true,
  parentId: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments)
  .pick({
    courseId: true,
    title: true,
    description: true,
    instructions: true,
    dueDate: true,
    maxPoints: true,
  })
  .extend({
    dueDate: nullableDateStringToDate,
  });

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  content: true,
  fileUrl: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  courseId: true,
  title: true,
  description: true,
  timeLimit: true,
  attempts: true,
  passingScore: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  quizId: true,
  question: true,
  type: true,
  options: true,
  correctAnswer: true,
  points: true,
  orderIndex: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  quizId: true,
  userId: true,
  answers: true,
  score: true,
  completed: true,
  startedAt: true,
  completedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
