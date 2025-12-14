import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Module = mongoose.model("Module", moduleSchema);
export default Module;
