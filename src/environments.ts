import dotenv from "dotenv";

dotenv.config();

export default {
  ORIGIN_URL: process.env.ORIGIN_URL || "http://localhost:5173",
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI || "",
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};
