require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Job = require("../models/Job");
const Referral = require("../models/Referral");

const db = require("../configs/db");

async function seed() {
  try {
    await db();

    // Xoá dữ liệu cũ
    await User.deleteMany({});
    await Job.deleteMany({});
    await Referral.deleteMany({});

    // Tạo password đơn giản cho admin và recruiter
    const adminPassword = "admin123";

    const recruiterPassword = "123456";
    const candidatePassword = "123456";

    // === Users ===
    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
      credit: 10000,
    });

    const recruiter = await User.create({
      name: "This Is Me",
      email: "ctv1@example.com",
      password: recruiterPassword,
      role: "recruiter",
      connections: [admin._id],
    });

    const candidate = await User.create({
      name: "Iam Potential",
      email: "candidate@example.com",
      password: candidatePassword,
      role: "candidate",
      connections: [recruiter._id, admin._id],
    });

    // === Jobs ===
    const job1 = await Job.create({
      title: "Frontend Developer",
      company: "Tech Corp",
      location: "Remote",
      salary: "N/A", // Ensure salary is sent
      bonus: 500,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      jobsdetail: {
        description: "React, TailwindCSS, REST API",
        requirement: "2 năm kinh nghiệm React",
        benefits: "Remote + thưởng dự án",
      },
    });

    const job2 = await Job.create({
      title: "Backend Developer",
      company: "Data Systems",
      location: "Hà Nội",
      salary: "1000-1500 USD",
      bonus: 800,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      jobsdetail: {
        description: "Node.js, MongoDB, Microservices",
        requirement: "3 năm kinh nghiệm Node.js",
        benefits: "Chế độ tốt, 13 tháng lương",
      },
    });

    // Gán job cho admin & recruiter
    admin.jobs.push(job1._id, job2._id);
    recruiter.jobs.push(job1._id);
    await admin.save();
    await recruiter.save();

    // === Referral ===
    const referral = await Referral.create({
      recruiter: recruiter._id,
      admin: admin._id,
      candidate: candidate._id,
      candidateName: candidate.name, // Add required candidateName field
      job: job1._id,
      message: "Ứng viên này có kinh nghiệm React và rất phù hợp.",
      status: "submitted",
    });

    console.log("✅ Seed thành công!");
    console.log("=== Accounts ===");
    console.log("Admin:", admin.email, adminPassword);
    console.log("Recruiter:", recruiter.email, recruiterPassword);
    console.log("Candidate:", candidate.email, candidatePassword);
    console.log("=== Jobs ===");
    console.log("Job1:", job1.title);
    console.log("Job2:", job2.title);
    console.log("=== Referral ===");
    console.log("Referral ID:", referral._id, "status:", referral.status);

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi seed:", err);
    process.exit(1);
  }
}

seed();
