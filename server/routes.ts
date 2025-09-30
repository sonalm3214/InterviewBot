import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseResume, getMissingFields, getMissingFieldsList } from "./services/resumeParser";
import { generateInterviewQuestion, scoreAnswer, generateFinalSummary } from "./services/openai";
import { insertCandidateSchema, insertChatMessageSchema, insertAnswerSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload resume and create candidate
  app.post("/api/candidates", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Parse the resume
      const resumeData = await parseResume(req.file.buffer);
      const missingFields = getMissingFields(resumeData);
      const missingList = getMissingFieldsList(missingFields);

      // Create candidate
      const candidateData = insertCandidateSchema.parse({
        name: resumeData.name || "",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        resumeText: resumeData.text,
        status: missingList.length > 0 ? "info_collection" : "interviewing",
        currentQuestionIndex: 0,
      });

      const candidate = await storage.createCandidate(candidateData);

      // Create initial chat message
      if (missingList.length > 0) {
        const message = `I've successfully extracted your resume information. However, I need some additional details: ${missingList.join(", ")}. Could you please provide the missing information?`;
        
        await storage.createChatMessage({
          candidateId: candidate.id,
          sender: "ai",
          message,
          messageType: "info_request",
          metadata: { missingFields: missingList }
        });
      } else {
        // Start interview immediately
        const question = await generateInterviewQuestion(0, resumeData.text);
        
        const questionRecord = await storage.createQuestion({
          candidateId: candidate.id,
          questionText: question.question,
          difficulty: question.difficulty,
          timeLimit: question.timeLimit,
          questionIndex: 0,
        });

        await storage.createChatMessage({
          candidateId: candidate.id,
          sender: "ai",
          message: question.question,
          messageType: "question",
          metadata: { 
            questionId: questionRecord.id,
            difficulty: question.difficulty,
            timeLimit: question.timeLimit 
          }
        });
      }

      const candidateWithProgress = await storage.getCandidateWithProgress(candidate.id);
      res.json(candidateWithProgress);
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).json({ message: "Failed to process resume" });
    }
  });

  // Update candidate info (for missing fields)
  app.patch("/api/candidates/:id/info", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      // Update candidate with provided info
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;

      const updatedCandidate = await storage.updateCandidate(id, updates);

      // Check if all required info is now available
      const hasAllInfo = updatedCandidate.name && updatedCandidate.email && updatedCandidate.phone;
      
      if (hasAllInfo && candidate.status === "info_collection") {
        // Start the interview
        await storage.updateCandidate(id, { status: "interviewing" });
        
        const question = await generateInterviewQuestion(0, candidate.resumeText || "");
        
        const questionRecord = await storage.createQuestion({
          candidateId: id,
          questionText: question.question,
          difficulty: question.difficulty,
          timeLimit: question.timeLimit,
          questionIndex: 0,
        });

        await storage.createChatMessage({
          candidateId: id,
          sender: "ai",
          message: `Thank you! Now let's begin the interview. ${question.question}`,
          messageType: "question",
          metadata: { 
            questionId: questionRecord.id,
            difficulty: question.difficulty,
            timeLimit: question.timeLimit 
          }
        });
      }

      const candidateWithProgress = await storage.getCandidateWithProgress(id);
      res.json(candidateWithProgress);
    } catch (error) {
      console.error("Error updating candidate info:", error);
      res.status(500).json({ message: "Failed to update candidate information" });
    }
  });

  // Submit answer
  app.post("/api/candidates/:id/answers", async (req, res) => {
    try {
      const { id } = req.params;
      const { questionId, answerText, timeSpent } = req.body;

      const candidate = await storage.getCandidate(id);
      const question = await storage.getCurrentQuestion(id);
      
      if (!candidate || !question) {
        return res.status(404).json({ message: "Candidate or question not found" });
      }

      // Score the answer using AI
      const scoring = await scoreAnswer(
        question.questionText,
        answerText,
        question.difficulty as "easy" | "medium" | "hard",
        timeSpent,
        question.timeLimit
      );

      // Save the answer
      const answer = await storage.createAnswer({
        questionId,
        candidateId: id,
        answerText,
        score: scoring.score,
        timeSpent,
      });

      // Add chat messages for the answer and score
      await storage.createChatMessage({
        candidateId: id,
        sender: "candidate",
        message: answerText,
        messageType: "answer",
        metadata: { 
          questionId,
          score: scoring.score,
          timeSpent 
        }
      });

      // Move to next question or complete interview
      const nextQuestionIndex = (candidate.currentQuestionIndex || 0) + 1;
      
      if (nextQuestionIndex >= 6) {
        // Interview completed - generate final summary
        const answers = await storage.getAnswersByCandidate(id);
        const questions = await storage.getQuestionsByCandidate(id);
        
        const questionsAndAnswers = questions.map(q => {
          const answer = answers.find(a => a.questionId === q.id);
          return {
            question: q.questionText,
            answer: answer?.answerText || "",
            score: answer?.score || 0,
            difficulty: q.difficulty
          };
        });

        const summary = await generateFinalSummary(
          candidate.name,
          candidate.resumeText || "",
          questionsAndAnswers
        );

        await storage.updateCandidate(id, {
          status: "completed",
          completedAt: new Date(),
          score: summary.overallScore,
          summary: summary.summary,
          currentQuestionIndex: nextQuestionIndex
        });

        await storage.createChatMessage({
          candidateId: id,
          sender: "ai",
          message: `Interview completed! Your final score is ${summary.overallScore}/10. ${summary.summary}`,
          messageType: "text",
          metadata: { 
            finalScore: summary.overallScore,
            summary: summary.summary 
          }
        });
      } else {
        // Generate next question
        const previousQuestions = await storage.getQuestionsByCandidate(id);
        const nextQuestion = await generateInterviewQuestion(
          nextQuestionIndex,
          candidate.resumeText || "",
          previousQuestions.map(q => q.questionText)
        );

        const nextQuestionRecord = await storage.createQuestion({
          candidateId: id,
          questionText: nextQuestion.question,
          difficulty: nextQuestion.difficulty,
          timeLimit: nextQuestion.timeLimit,
          questionIndex: nextQuestionIndex,
        });

        await storage.updateCandidate(id, {
          currentQuestionIndex: nextQuestionIndex
        });

        await storage.createChatMessage({
          candidateId: id,
          sender: "ai",
          message: nextQuestion.question,
          messageType: "question",
          metadata: { 
            questionId: nextQuestionRecord.id,
            difficulty: nextQuestion.difficulty,
            timeLimit: nextQuestion.timeLimit 
          }
        });
      }

      const candidateWithProgress = await storage.getCandidateWithProgress(id);
      res.json(candidateWithProgress);
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get candidate with progress
  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const candidate = await storage.getCandidateWithProgress(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      res.json(candidate);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  // Get all candidates for dashboard
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Get interview stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getInterviewStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Pause/Resume interview
  app.patch("/api/candidates/:id/pause", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // "pause" or "resume"

      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const updates: any = {};
      if (action === "pause") {
        updates.status = "paused";
        updates.pausedAt = new Date();
      } else if (action === "resume") {
        updates.status = "interviewing";
        updates.pausedAt = null;
      }

      const updatedCandidate = await storage.updateCandidate(id, updates);
      res.json(updatedCandidate);
    } catch (error) {
      console.error("Error pausing/resuming interview:", error);
      res.status(500).json({ message: "Failed to update interview status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
