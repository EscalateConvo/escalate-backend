import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    initialEmotion: {
      type: String,
      enum: ["neutral", "happy", "angry", "confused", "sad"],
      default: "neutral",
    },
    audioConfig: {
      voiceId: {
        type: String,
        required: true,
      },
      modelId: {
        type: String,
        default: "eleven_turbo_v2",
      },
      stability: {
        type: Number,
        default: 0.5,
        min: 0.0,
        max: 1.0,
      },
    },
    firstMessage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Module = mongoose.model("Module", moduleSchema);
export default Module;
