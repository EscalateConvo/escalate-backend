import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyDescription: {
    type: String,
  },
  companyType: {
    type: String,
  },
});

const Company = mongoose.model("Company", companySchema);
export default Company;
