import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
      validate: {
        validator: (value: string) => value.length <= 100,
        message: "Name must be less than 100 characters",
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Invalid email address",
      },
    },
    photoURL: {
      type: String,
    },
    type: {
      type: String,
      enum: ["USER", "ORGANIZATION"],
      default: "USER",
      required: true,
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
