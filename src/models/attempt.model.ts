import mongoose, { Schema } from "mongoose";

const attemptSchema = new Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attemptReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptReport",
    },
    attemptStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    elevenLabsSignedURL: {
      type: String,
    },
    conversationId: {
      type: String,
    },
  },
  { timestamps: true },
);

const Attempt = mongoose.model("Attempt", attemptSchema);
export default Attempt;
