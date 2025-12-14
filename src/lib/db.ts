import mongoose from "mongoose";
import environments from "../environments";

export const connectDB = async () => {
  try {
    await mongoose.connect(environments.MONGO_URI as string);
    console.log("🟢 Connected to MongoDB");
  } catch (error) {
    console.log("🔴 Error connecting to MongoDB", error);
    process.exit(1);
  }
};
