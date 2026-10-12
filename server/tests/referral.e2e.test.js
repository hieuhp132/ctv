const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); // export app từ server.js
const User = require("../models/User");
const Job = require("../models/Job");
const Referral = require("../models/Referral");
const bcrypt = require("bcryptjs");

let adminToken, recruiterToken, candidateId, jobId, referralId;

describe("Referral Flow E2E", () => {
  beforeAll(async () => {
    // Xoá dữ liệu cũ
    await User.deleteMany({});
    await Job.deleteMany({});
    await Referral.deleteMany({});

    // Hash password
    const password = "StrongPassword@123";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Tạo admin, recruiter, candidate
    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: hashed,
      role: "admin"
    });

    const recruiter = await User.create({
      name: "Recruiter",
      email: "recruiter@test.com",
      password: hashed,
      role: "recruiter"
    });

    const candidate = await User.create({
      name: "Candidate",
      email: "candidate@test.com",
      password: hashed,
      role: "candidate"
    });
    candidateId = candidate._id.toString();

    // Tạo job
    const job = await Job.create({
      title: "Frontend Dev",
      company: "Tech Corp",
      location: "Remote",
      bonus: 500,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      jobsdetail: {
        description: "React, Node",
        requirement: "2 năm",
        benefits: "Thưởng"
      }
    });
    jobId = job._id.toString();

    // Login admin
    const resAdmin = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: password
    });
    adminToken = resAdmin.body.token;

    // Login recruiter
    const resRecruiter = await request(app).post("/api/auth/login").send({
      email: "recruiter@test.com",
      password: password
    });
    recruiterToken = resRecruiter.body.token;

    // Lưu adminId để recruiter tạo referral
    global.adminId = admin._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("Recruiter gửi referral", async () => {
    const res = await request(app)
      .post("/api/referrals")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        candidateId,
        jobId,
        adminId: global.adminId,
        message: "Ứng viên có skill React"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("submitted");
    referralId = res.body._id;
  });

  test("Admin xem referral", async () => {
    const res = await request(app)
      .get("/api/referrals")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]._id).toBe(referralId);
  });

  test("Admin approve referral", async () => {
    const res = await request(app)
      .put(`/api/referrals/${referralId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  test("Verify referral trong DB", async () => {
    const referral = await Referral.findById(referralId);
    expect(referral).not.toBeNull();
    expect(referral.status).toBe("approved");
  });
});
