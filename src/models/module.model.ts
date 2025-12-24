import mongoose from "mongoose";
import validator from "validator";
import crypto from "crypto";
import { TtsConversationalModel } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalModel";
import {
  DEFAULT_MODEL_ID,
  DEFAULT_VOICE_ID,
  DEFAULT_STABILITY,
} from "../ai/createAgent";

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
    userEmails: {
      type: [String],
      validate: [
        (v: string[]) => v.every((email) => validator.isEmail(email)),
        "Invalid email addresses",
      ],
      default: [],
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
      required: true,
    },
    maxDurationSeconds: {
      type: Number,
      default: 180,
      min: 60,
      max: 300,
    },
    aiFields: {
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
          default: DEFAULT_VOICE_ID,
          required: true,
        },
        modelId: {
          type: String,
          enum: Object.values(TtsConversationalModel),
          required: true,
          default: DEFAULT_MODEL_ID,
        },
        stability: {
          type: Number,
          default: DEFAULT_STABILITY,
          min: 0.0,
          max: 1.0,
        },
      },
      firstMessage: {
        type: String,
        required: true,
      },
    },
    userFields: {
      role: {
        type: String,
        required: true,
      },
      problemStatement: {
        type: String,
        required: true,
      },
    },
    shareURL: {
      type: String,
      sparse: true,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    shareTokenExpiry: {
      type: Date,
      default: null,
    },
    agentId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true },
);

moduleSchema.methods.generateShareToken = function (expiryDays?: number) {
  this.shareToken = crypto.randomBytes(32).toString("hex");
  if (expiryDays) {
    this.shareTokenExpiry = new Date(
      Date.now() + expiryDays * 24 * 60 * 60 * 1000,
    );
  } else {
    this.shareTokenExpiry = null;
  }
  return this.shareToken;
};

moduleSchema.methods.revokeShareToken = function () {
  this.shareToken = undefined;
  this.shareTokenExpiry = null;
  this.shareURL = undefined;
};

moduleSchema.methods.isShareTokenValid = function () {
  if (!this.shareToken) {
    return false;
  }
  if (this.shareTokenExpiry && new Date() > this.shareTokenExpiry) {
    return false;
  }
  return true;
};

moduleSchema.methods.getAIData = function () {
  return this.aiFields;
};

const Module = mongoose.model("Module", moduleSchema);
export default Module;
