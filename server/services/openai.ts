import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface GeneratedQuestion {
  question: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
}

export interface AnswerScore {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewSummary {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export async function generateInterviewQuestion(
  questionIndex: number,
  resumeText: string,
  previousQuestions: string[] = []
): Promise<GeneratedQuestion> {
  // Define difficulty progression: 2 Easy (20s), 2 Medium (60s), 2 Hard (120s)
  const difficulties: Array<{ difficulty: "easy" | "medium" | "hard"; timeLimit: number }> = [
    { difficulty: "easy", timeLimit: 20 },
    { difficulty: "easy", timeLimit: 20 },
    { difficulty: "medium", timeLimit: 60 },
    { difficulty: "medium", timeLimit: 60 },
    { difficulty: "hard", timeLimit: 120 },
    { difficulty: "hard", timeLimit: 120 },
  ];

  const { difficulty, timeLimit } = difficulties[questionIndex];

  const prompt = `
You are an expert technical interviewer for a Full Stack Developer position (React/Node.js).

Candidate's Resume: ${resumeText}

Previous questions asked: ${previousQuestions.join(", ") || "None"}

Generate a ${difficulty} level technical question for question ${questionIndex + 1} of 6.

Guidelines:
- Easy: Basic concepts, syntax, fundamental understanding
- Medium: Practical application, problem-solving, best practices  
- Hard: Complex scenarios, architectural decisions, optimization

Requirements:
- Question should be relevant to Full Stack development (React/Node.js)
- Avoid repeating previous questions
- Make it specific and practical
- Appropriate for ${timeLimit} second time limit

Respond with JSON in this exact format:
{
  "question": "Your generated question here",
  "difficulty": "${difficulty}",
  "timeLimit": ${timeLimit}
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer. Generate practical, relevant interview questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      question: result.question || "Default question: Explain a technical concept you're comfortable with.",
      difficulty: result.difficulty || difficulty,
      timeLimit: result.timeLimit || timeLimit
    };
  } catch (error) {
    console.error("Error generating question:", error);
    // Fallback question
    return {
      question: `Describe your experience with ${difficulty === "easy" ? "React components" : difficulty === "medium" ? "state management" : "system architecture"}.`,
      difficulty,
      timeLimit
    };
  }
}

export async function scoreAnswer(
  question: string,
  answer: string,
  difficulty: "easy" | "medium" | "hard",
  timeSpent: number,
  timeLimit: number
): Promise<AnswerScore> {
  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer.

Question (${difficulty} level): ${question}
Candidate's Answer: ${answer}
Time spent: ${timeSpent}s out of ${timeLimit}s allowed

Evaluate this answer on:
1. Technical accuracy (40%)
2. Completeness (30%) 
3. Clarity of explanation (20%)
4. Time management (10%)

Provide a score from 1-10 and detailed feedback.

Respond with JSON in this exact format:
{
  "score": 8,
  "feedback": "Overall assessment of the answer",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system", 
          content: "You are an expert technical interviewer. Provide fair, constructive evaluations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      score: Math.max(1, Math.min(10, result.score || 5)),
      feedback: result.feedback || "Answer provided shows basic understanding.",
      strengths: result.strengths || [],
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error("Error scoring answer:", error);
    return {
      score: 5,
      feedback: "Unable to evaluate answer at this time.",
      strengths: [],
      improvements: []
    };
  }
}

export async function generateFinalSummary(
  candidateName: string,
  resumeText: string,
  questionsAndAnswers: Array<{
    question: string;
    answer: string;
    score: number;
    difficulty: string;
  }>
): Promise<InterviewSummary> {
  const overallScore = Math.round(
    (questionsAndAnswers.reduce((sum, qa) => sum + qa.score, 0) / questionsAndAnswers.length) * 10
  ) / 10;

  const prompt = `
You are an expert technical interviewer providing a final assessment.

Candidate: ${candidateName}
Resume: ${resumeText}

Interview Results:
${questionsAndAnswers.map((qa, i) => 
  `Q${i+1} (${qa.difficulty}): ${qa.question}\nAnswer: ${qa.answer}\nScore: ${qa.score}/10\n`
).join("\n")}

Overall Score: ${overallScore}/10

Provide a comprehensive summary including:
- Overall assessment
- Key strengths demonstrated
- Areas for improvement  
- Hiring recommendation

Respond with JSON in this exact format:
{
  "overallScore": ${overallScore},
  "summary": "Comprehensive assessment paragraph",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "Strong hire/Hire/Consider/No hire"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer providing final candidate assessments."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallScore: result.overallScore || overallScore,
      summary: result.summary || "Interview completed successfully.",
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || "Requires further review"
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return {
      overallScore,
      summary: "Interview assessment completed.",
      strengths: [],
      weaknesses: [],
      recommendation: "Requires manual review"
    };
  }
}
