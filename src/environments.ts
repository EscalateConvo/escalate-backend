import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI || "",
};
