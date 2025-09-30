import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  resumeText: text("resume_text"),
  status: text("status").notNull().default("pending"), // pending, info_collection, interviewing, paused, completed
  currentQuestionIndex: integer("current_question_index").default(0),
  score: integer("score"), // final score out of 10
  summary: text("summary"), // AI-generated summary
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  pausedAt: timestamp("paused_at"),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  questionText: text("question_text").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  timeLimit: integer("time_limit").notNull(), // in seconds
  questionIndex: integer("question_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  answerText: text("answer_text").notNull(),
  score: integer("score"), // AI score out of 10
  timeSpent: integer("time_spent"), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  sender: text("sender").notNull(), // ai, candidate
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // text, question, answer, info_request
  metadata: jsonb("metadata"), // additional data like question info, scores, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  pausedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  submittedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Response types for API
export type CandidateWithProgress = Candidate & {
  totalQuestions: number;
  completedQuestions: number;
  currentQuestion?: Question;
  messages: ChatMessage[];
};

export type InterviewStats = {
  totalCandidates: number;
  completedInterviews: number;
  activeInterviews: number;
  averageScore: number;
};
