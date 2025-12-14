import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    photoURL: {
      type: String,
    },
    type: {
      type: String,
      enum: ["USER", "ORGANIZATION"],
      default: "USER",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
