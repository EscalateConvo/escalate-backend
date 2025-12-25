import { GoogleGenerativeAI } from "@google/generative-ai";
import environments from "../environments";

const genAI = new GoogleGenerativeAI(environments.GEMINI_API_KEY);

interface TranscriptMessage {
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
}

interface ModuleContext {
  title: string;
  topic: string;
  difficulty: string;
  aiRole: string;
  userRole: string;
  problemStatement: string;
  systemPrompt: string;
}

interface DetailedScore {
  score: number;
  feedback: string;
}

export interface PerformanceReport {
  overallScore: number;
  recommendation: "HIRE" | "NO_HIRE" | "MAYBE";
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: {
    communication: DetailedScore;
    problemSolving: DetailedScore;
    professionalism: DetailedScore;
    empathy: DetailedScore;
    productKnowledge: DetailedScore;
  };
}

const HIRE_THRESHOLD = 80;

export const generatePerformanceReport = async (
  transcript: TranscriptMessage[],
  moduleContext: ModuleContext
): Promise<PerformanceReport> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const formattedTranscript = transcript
    .map(
      (msg) =>
        `[${msg.time_in_call_secs}s] ${msg.role.toUpperCase()}: ${msg.message}`
    )
    .join("\n");

  const prompt = `You are an expert HR evaluator analyzing a candidate's performance in a simulated customer service/sales conversation. 

## Module Context
- **Title**: ${moduleContext.title}
- **Topic**: ${moduleContext.topic}
- **Difficulty Level**: ${moduleContext.difficulty}
- **AI's Role in Conversation**: ${moduleContext.aiRole}
- **Candidate's Role**: ${moduleContext.userRole}
- **Problem Statement/Scenario**: ${moduleContext.problemStatement}
- **Context/Background**: ${moduleContext.systemPrompt}

## Conversation Transcript
The "USER" in the transcript is the CANDIDATE being evaluated. The "AGENT" is an AI simulating a customer/caller.

${formattedTranscript}

## Evaluation Instructions
Analyze the candidate's (USER's) performance and provide a comprehensive evaluation. Consider:
1. How well did the candidate handle the situation given the module context?
2. Did they follow appropriate protocols while showing empathy?
3. How was their communication clarity and professionalism?
4. Did they attempt to solve the problem effectively?
5. Were they knowledgeable about policies/products?

## Response Format
Respond ONLY with a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence summary of the candidate's overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "detailedFeedback": {
    "communication": {
      "score": <number 0-100>,
      "feedback": "<specific feedback on communication skills>"
    },
    "problemSolving": {
      "score": <number 0-100>,
      "feedback": "<specific feedback on problem-solving approach>"
    },
    "professionalism": {
      "score": <number 0-100>,
      "feedback": "<specific feedback on professional conduct>"
    },
    "empathy": {
      "score": <number 0-100>,
      "feedback": "<specific feedback on empathy and understanding>"
    },
    "productKnowledge": {
      "score": <number 0-100>,
      "feedback": "<specific feedback on product/policy knowledge>"
    }
  }
}

Be fair but critical. Consider the difficulty level when scoring. Provide actionable feedback.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse the JSON response
  let reportData: Omit<PerformanceReport, "recommendation">;
  try {
    // Clean the response - remove any potential markdown code blocks
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    reportData = JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to parse AI response. Please try again.");
  }

  // Determine recommendation based on threshold
  let recommendation: "HIRE" | "NO_HIRE" | "MAYBE";
  if (reportData.overallScore >= HIRE_THRESHOLD) {
    recommendation = "HIRE";
  } else if (reportData.overallScore >= HIRE_THRESHOLD - 15) {
    recommendation = "MAYBE";
  } else {
    recommendation = "NO_HIRE";
  }

  return {
    ...reportData,
    recommendation,
  };
};

