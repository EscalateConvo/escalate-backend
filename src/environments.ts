import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI || "",
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || "",
};
