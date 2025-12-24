import mongoose from "mongoose";

const attemptReportSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recommendation: {
      type: String,
      enum: ["HIRE", "NO_HIRE", "MAYBE"],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    areasForImprovement: {
      type: [String],
      default: [],
    },
    detailedFeedback: {
      communication: {
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
      },
      problemSolving: {
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
      },
      professionalism: {
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
      },
      empathy: {
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
      },
      productKnowledge: {
        score: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
      },
    },
    transcriptAnalysis: {
      totalMessages: { type: Number },
      userMessages: { type: Number },
      agentMessages: { type: Number },
      callDurationSecs: { type: Number },
    },
  },
  { timestamps: true },
);

const AttemptReport = mongoose.model("AttemptReport", attemptReportSchema);
export default AttemptReport;
