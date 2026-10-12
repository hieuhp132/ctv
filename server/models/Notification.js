const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["admin", "recruiter", "recruiter_freelancer", "recruiter_fulltime", "candidate", "all"], default: "all" },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
























