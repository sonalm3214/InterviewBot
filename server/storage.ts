import { 
  type Candidate, 
  type InsertCandidate,
  type Question,
  type InsertQuestion,
  type Answer,
  type InsertAnswer,
  type ChatMessage,
  type InsertChatMessage,
  type CandidateWithProgress,
  type InterviewStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Candidate operations
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate>;
  getAllCandidates(): Promise<Candidate[]>;
  getCandidateWithProgress(id: string): Promise<CandidateWithProgress | undefined>;

  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByCandidate(candidateId: string): Promise<Question[]>;
  getCurrentQuestion(candidateId: string): Promise<Question | undefined>;

  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByCandidate(candidateId: string): Promise<Answer[]>;
  getAnswerByQuestion(questionId: string): Promise<Answer | undefined>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(candidateId: string): Promise<ChatMessage[]>;

  // Stats
  getInterviewStats(): Promise<InterviewStats>;
}

export class MemStorage implements IStorage {
  private candidates: Map<string, Candidate>;
  private questions: Map<string, Question>;
  private answers: Map<string, Answer>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.candidates = new Map();
    this.questions = new Map();
    this.answers = new Map();
    this.chatMessages = new Map();
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(c => c.email === email);
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = randomUUID();
    const candidate: Candidate = {
      ...insertCandidate,
      id,
      startedAt: new Date(),
      completedAt: null,
      pausedAt: null,
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const existing = this.candidates.get(id);
    if (!existing) {
      throw new Error(`Candidate with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.candidates.set(id, updated);
    return updated;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).sort((a, b) => 
      new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
    );
  }

  async getCandidateWithProgress(id: string): Promise<CandidateWithProgress | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;

    const questions = await this.getQuestionsByCandidate(id);
    const messages = await this.getChatMessages(id);
    const currentQuestion = await this.getCurrentQuestion(id);

    return {
      ...candidate,
      totalQuestions: 6, // Fixed number of questions
      completedQuestions: questions.length,
      currentQuestion,
      messages,
    };
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: new Date(),
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsByCandidate(candidateId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.candidateId === candidateId)
      .sort((a, b) => a.questionIndex - b.questionIndex);
  }

  async getCurrentQuestion(candidateId: string): Promise<Question | undefined> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return undefined;

    return Array.from(this.questions.values()).find(
      q => q.candidateId === candidateId && q.questionIndex === candidate.currentQuestionIndex
    );
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const id = randomUUID();
    const answer: Answer = {
      ...insertAnswer,
      id,
      submittedAt: new Date(),
    };
    this.answers.set(id, answer);
    return answer;
  }

  async getAnswersByCandidate(candidateId: string): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(a => a.candidateId === candidateId)
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());
  }

  async getAnswerByQuestion(questionId: string): Promise<Answer | undefined> {
    return Array.from(this.answers.values()).find(a => a.questionId === questionId);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(candidateId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.candidateId === candidateId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getInterviewStats(): Promise<InterviewStats> {
    const candidates = Array.from(this.candidates.values());
    const completed = candidates.filter(c => c.status === "completed");
    const active = candidates.filter(c => ["interviewing", "info_collection"].includes(c.status));
    
    const scores = completed.filter(c => c.score).map(c => c.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      totalCandidates: candidates.length,
      completedInterviews: completed.length,
      activeInterviews: active.length,
      averageScore: Math.round(averageScore * 10) / 10,
    };
  }
}

export const storage = new MemStorage();
