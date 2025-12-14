import mongoose from "mongoose";

const attemptReportSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
    },
    score: {
      type: Number,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true },
);

const AttemptReport = mongoose.model("AttemptReport", attemptReportSchema);
export default AttemptReport;
