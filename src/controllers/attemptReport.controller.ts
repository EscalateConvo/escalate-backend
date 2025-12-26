import AttemptReport from "../models/attemptReport.model";
import { generatePerformanceReport } from "../ai/generateReport";
import Attempt from "../models/attempt.model";
import { ForbiddenError, NotFoundError } from "../middlewares/error.middleware";

interface TranscriptMessage {
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
}

interface ConversationData {
  conversation_id: string;
  transcript: TranscriptMessage[];
  metadata: {
    call_duration_secs: number;
  };
}

const generateAttemptReport = async ({
  attemptId,
  conversationData,
}: {
  attemptId: string;
  conversationData: ConversationData;
}) => {
  // Find the attempt and populate the module
  const attempt = await Attempt.findById(attemptId).populate("module");
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  // Check if report already exists
  if (attempt.attemptReport) {
    const existingReport = await AttemptReport.findById(attempt.attemptReport);
    if (existingReport) {
      return existingReport;
    }
  }

  // Get module context
  const module = attempt.module as unknown as {
    title: string;
    topic: string;
    difficulty: string;
    aiFields: {
      role: string;
      systemPrompt: string;
    };
    userFields: {
      role: string;
      problemStatement: string;
    };
  };

  const moduleContext = {
    title: module.title,
    topic: module.topic,
    difficulty: module.difficulty,
    aiRole: module.aiFields.role,
    userRole: module.userFields.role,
    problemStatement: module.userFields.problemStatement,
    systemPrompt: module.aiFields.systemPrompt,
  };

  // Generate the performance report using Gemini
  const performanceReport = await generatePerformanceReport(
    conversationData.transcript,
    moduleContext,
  );

  // Calculate transcript analysis
  const userMessages = conversationData.transcript.filter(
    (m) => m.role === "user",
  ).length;
  const agentMessages = conversationData.transcript.filter(
    (m) => m.role === "agent",
  ).length;

  // Create and save the report
  const report = await AttemptReport.create({
    attempt: attemptId,
    conversationId: conversationData.conversation_id,
    overallScore: performanceReport.overallScore,
    recommendation: performanceReport.recommendation,
    summary: performanceReport.summary,
    strengths: performanceReport.strengths,
    areasForImprovement: performanceReport.areasForImprovement,
    detailedFeedback: performanceReport.detailedFeedback,
    transcriptAnalysis: {
      totalMessages: conversationData.transcript.length,
      userMessages,
      agentMessages,
      callDurationSecs: conversationData.metadata.call_duration_secs,
    },
  });

  // Update the attempt with the report reference and mark as completed
  attempt.attemptReport = report._id as typeof attempt.attemptReport;
  attempt.attemptStatus = "COMPLETED";
  await attempt.save();

  return report;
};

const getAttemptReport = async ({
  attemptReportId,
  userId,
}: {
  attemptReportId: string;
  userId: string;
}) => {
  const attemptReport = await AttemptReport.findById(attemptReportId).populate({
    path: "attempt",
    populate: {
      path: "module",
    },
  });

  if (!attemptReport) {
    throw new NotFoundError("Attempt report not found");
  }

  const attempt = attemptReport.attempt as unknown as {
    user: { _id: string };
    module: { createdBy: { _id: string } };
  };

  const isModuleCreator = attempt.module.createdBy.toString() === userId;

  if (!isModuleCreator) {
    throw new ForbiddenError("You don't have access to this report");
  }

  return attemptReport;
};

export { generateAttemptReport, getAttemptReport };
