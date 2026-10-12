const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    candidateName: { type: String, required: true },
    candidateEmail: { type: String, default: "" },
    candidatePhone: { type: String, default: "" },

    // CV lưu trên Supabase
    cvFileName: { type: String, default: "" }, // tên gốc khi recruiter upload
    cvKey: { type: String, default: "" },      // tên file duy nhất trong bucket
    cvUrl: { type: String, default: "" },      // public URL để download

    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    suitability: { type: String, default: "" },

    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["submitted", "under_review","interviewing", "offer", "hired", "onboard", "rejected"],
      default: "submitted",
    },
    bonus: { type: Number, default: 0 },
    message: { type: String, default: "" },

    finalized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
  },
  { timestamps: true }
);

const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;
