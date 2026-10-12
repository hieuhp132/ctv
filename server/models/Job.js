const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  salary: { type: String, default: "N/A" },
  company: { type: String, required: true },
  location: { type: String, required: true },
  bonus: { type: String},
  deadline: { type: Date },
  rewardCandidateUSD: { type: Number, default: 0 },
  rewardInterviewUSD: { type: Number, default: 0 },
  vacancies: { type: Number, default: 0 },
  applicants: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  keywords: [{ type: String }],
  jobsdetail: {
    description: { type: String, default: "" },
    requirement: { type: String, default: "" },
    benefits: { type: String, default: "" }
  },
  other: { type: String, default: "" },
  jdLink: { type: String, default: "" },
  jdFileName: { type: String, default: "" },
  savedBy: [{ type: String }] // array of userId/email who saved this job
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
