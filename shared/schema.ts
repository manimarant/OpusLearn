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

// Chapters within modules
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  content: text("content"), // Rich text content
  // New: structured block content for block-based editor (Articulate-style)
  contentJson: jsonb("content_json"),
  contentType: varchar("content_type").notNull().default("text"), // text, video, interactive
  duration: integer("duration"), // in minutes
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"), // Generated video URL
  videoThumbnailUrl: text("video_thumbnail_url"), // Video thumbnail URL
  videoJobId: text("video_job_id"), // AI video generation job ID
  videoStatus: varchar("video_status").default("none"), // none, generating, completed, failed
  videoProvider: varchar("video_provider"), // runway, pika, mock
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
export const chapterProgress = pgTable("chapter_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
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
  chapterId: integer("chapter_id"),
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

// Rubrics
export const rubrics = pgTable("rubrics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // assignment, quiz
  assignmentId: integer("assignment_id"), // null for quiz rubrics
  quizId: integer("quiz_id"), // null for assignment rubrics
  maxPoints: integer("max_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rubric criteria
export const rubricCriteria = pgTable("rubric_criteria", {
  id: serial("id").primaryKey(),
  rubricId: integer("rubric_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  maxPoints: integer("max_points").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rubric levels
export const rubricLevels = pgTable("rubric_levels", {
  id: serial("id").primaryKey(),
  rubricId: integer("rubric_id").notNull(),
  title: text("title").notNull(), // e.g., "Excellent", "Good", "Fair", "Poor"
  description: text("description"),
  points: integer("points").notNull(),
  color: varchar("color").default("#3B82F6"), // hex color for UI
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rubric evaluations
export const rubricEvaluations = pgTable("rubric_evaluations", {
  id: serial("id").primaryKey(),
  rubricId: integer("rubric_id").notNull(),
  submissionId: integer("submission_id"), // for assignments
  quizAttemptId: integer("quiz_attempt_id"), // for quizzes
  evaluatorId: varchar("evaluator_id").notNull(), // instructor who evaluated
  criteriaScores: jsonb("criteria_scores"), // {criteriaId: {levelId: number, points: number, feedback: string}}
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
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
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [chapters.moduleId],
    references: [courseModules.id],
  }),
  progress: many(chapterProgress),
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

// Rubric relations
export const rubricsRelations = relations(rubrics, ({ many }) => ({
  criteria: many(rubricCriteria),
  levels: many(rubricLevels),
  evaluations: many(rubricEvaluations),
}));

export const rubricCriteriaRelations = relations(rubricCriteria, ({ one }) => ({
  rubric: one(rubrics, {
    fields: [rubricCriteria.rubricId],
    references: [rubrics.id],
  }),
}));

export const rubricLevelsRelations = relations(rubricLevels, ({ one }) => ({
  rubric: one(rubrics, {
    fields: [rubricLevels.rubricId],
    references: [rubrics.id],
  }),
}));

export const rubricEvaluationsRelations = relations(rubricEvaluations, ({ one }) => ({
  rubric: one(rubrics, {
    fields: [rubricEvaluations.rubricId],
    references: [rubrics.id],
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

export const insertChapterSchema = createInsertSchema(chapters).pick({
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

// Rubric schemas
export const insertRubricSchema = createInsertSchema(rubrics).pick({
  title: true,
  description: true,
  type: true,
  assignmentId: true,
  quizId: true,
  maxPoints: true,
});

export const insertRubricCriteriaSchema = createInsertSchema(rubricCriteria).pick({
  rubricId: true,
  title: true,
  description: true,
  maxPoints: true,
  orderIndex: true,
});

export const insertRubricLevelSchema = createInsertSchema(rubricLevels).pick({
  rubricId: true,
  title: true,
  description: true,
  points: true,
  color: true,
  orderIndex: true,
});

export const insertRubricEvaluationSchema = createInsertSchema(rubricEvaluations).pick({
  rubricId: true,
  submissionId: true,
  quizAttemptId: true,
  evaluatorId: true,
  criteriaScores: true,
  totalScore: true,
  feedback: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type Rubric = typeof rubrics.$inferSelect;
export type RubricCriteria = typeof rubricCriteria.$inferSelect;
export type RubricLevel = typeof rubricLevels.$inferSelect;
export type RubricEvaluation = typeof rubricEvaluations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
