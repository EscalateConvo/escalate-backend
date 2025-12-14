import mongoose from "mongoose";

const orgSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orgDescription: {
    type: String,
  },
  orgType: {
    type: String,
  },
});

const Org = mongoose.model("Org", orgSchema);
export default Org;
