import {
  BadRequestError,
  NotFoundError,
} from "../middlewares/error.middleware";
import Attempt from "../models/attempt.model";
import AttemptReport from "../models/attemptReport.model";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import environments from "../environments";
import Module from "../models/module.model";
import { generatePerformanceReport } from "../ai/generateReport";

const elevenlabs = new ElevenLabsClient({
  apiKey: environments.ELEVENLABS_API_KEY,
});

interface TranscriptMessage {
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
}

interface FormattedConversation {
  conversation_id: string;
  agent_id: string;
  status: string;
  transcript: TranscriptMessage[];
  metadata: {
    call_duration_secs: number;
    start_time: number;
    main_language: string;
  };
  analysis: {
    call_successful: string;
    transcript_summary: string;
    call_summary_title: string;
  };
}

const getConversation = async (conversationId: string): Promise<FormattedConversation> => {
  if (!conversationId) {
    throw new BadRequestError("Conversation ID is required");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      method: "GET",
      headers: {
        "xi-api-key": environments.ELEVENLABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError("Conversation not found");
    }
    throw new BadRequestError(`Failed to fetch conversation: ${response.statusText}`);
  }

  const data = await response.json();

  // Format the transcript to only include essential information
  const formattedTranscript: TranscriptMessage[] = data.transcript.map(
    (item: { role: "agent" | "user"; message: string; time_in_call_secs: number }) => ({
      role: item.role,
      message: item.message,
      time_in_call_secs: item.time_in_call_secs,
    })
  );

  const formattedConversation: FormattedConversation = {
    conversation_id: data.conversation_id,
    agent_id: data.agent_id,
    status: data.status,
    transcript: formattedTranscript,
    metadata: {
      call_duration_secs: data.metadata?.call_duration_secs,
      start_time: data.metadata?.start_time_unix_secs,
      main_language: data.metadata?.main_language,
    },
    analysis: {
      call_successful: data.analysis?.call_successful,
      transcript_summary: data.analysis?.transcript_summary,
      call_summary_title: data.analysis?.call_summary_title,
    },
  };

  return formattedConversation;
};

const startAttempt = async ({
  userEmail,
  userId,
  moduleId,
}: {
  userEmail: string;
  userId: string;
  moduleId: string;
}) => {
  // Check if user is allowed to access the module
  const module = await Module.findOne({
    _id: moduleId,
    active: true,
    userEmails: { $in: [userEmail] },
  });

  if (!module) {
    throw new NotFoundError("Module not found or you don't have access");
  }

  const existingAttempt = await Attempt.findOne({
    user: userId,
    module: module._id,
  });

  if (existingAttempt?.attemptStatus === "COMPLETED") {
    throw new BadRequestError("You have already completed this module");
  }

  const elevenLabsSignedURL =
    await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId: module.agentId as string,
      includeConversationId: true,
    });

  if (existingAttempt?.attemptStatus === "PENDING") {
    existingAttempt.elevenLabsSignedURL = elevenLabsSignedURL.signedUrl;
    await existingAttempt.save();
    return existingAttempt;
  }

  console.log("Elevenlabs signed URL", elevenLabsSignedURL);

  const attempt = await Attempt.create({
    user: userId,
    module: moduleId,
    elevenLabsSignedURL: elevenLabsSignedURL.signedUrl,
  });
  return attempt;
};

const generateAttemptReport = async ({
  attemptId,
  conversationId,
}: {
  attemptId: string;
  conversationId: string;
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

  // Get the conversation from ElevenLabs
  const conversation = await getConversation(conversationId);

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
    conversation.transcript,
    moduleContext
  );

  // Calculate transcript analysis
  const userMessages = conversation.transcript.filter((m) => m.role === "user").length;
  const agentMessages = conversation.transcript.filter((m) => m.role === "agent").length;

  // Create and save the report
  const report = await AttemptReport.create({
    attempt: attemptId,
    conversationId: conversationId,
    overallScore: performanceReport.overallScore,
    recommendation: performanceReport.recommendation,
    summary: performanceReport.summary,
    strengths: performanceReport.strengths,
    areasForImprovement: performanceReport.areasForImprovement,
    detailedFeedback: performanceReport.detailedFeedback,
    transcriptAnalysis: {
      totalMessages: conversation.transcript.length,
      userMessages,
      agentMessages,
      callDurationSecs: conversation.metadata.call_duration_secs,
    },
  });

  // Update the attempt with the report reference and mark as completed
  attempt.attemptReport = report._id as typeof attempt.attemptReport;
  attempt.attemptStatus = "COMPLETED";
  await attempt.save();

  return report;
};

export { startAttempt, getConversation, generateAttemptReport };
