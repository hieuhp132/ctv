const request = require("supertest");
const app = require("../index"); // export app từ server.js thay vì http.createServer

let adminToken, recruiterToken, candidateId, jobId, referralId;

describe("Recruiter-Admin-Candidate System", () => {
  // ====== AUTH ======
  test("Register admin", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@example.com",
      password: "StrongPassword@123",
      role: "admin"
    });
    expect(res.statusCode).toBe(201);
  });

  test("Register recruiter", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Recruiter User",
      email: "recruiter@example.com",
      password: "StrongPassword@123",
      role: "recruiter"
    });
    expect(res.statusCode).toBe(201);
  });

  test("Register candidate", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Candidate User",
      email: "candidate@example.com",
      password: "StrongPassword@123",
      role: "candidate"
    });
    candidateId = res.body._id;
    expect(res.statusCode).toBe(201);
  });

  test("Login admin", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "StrongPassword@123"
    });
    adminToken = res.body.token;
    expect(res.statusCode).toBe(200);
  });

  test("Login recruiter", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "recruiter@example.com",
      password: "StrongPassword@123"
    });
    recruiterToken = res.body.token;
    expect(res.statusCode).toBe(200);
  });

  // ====== JOB ======
  test("Admin create job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Frontend Developer",
        company: "Tech Corp",
        location: "Remote",
        bonus: 500,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 tuần sau
        jobsdetail: {
          description: "React + Node",
          requirement: "2 năm kinh nghiệm",
          benefits: "Thưởng + remote"
        }
      });
    jobId = res.body._id;
    expect(res.statusCode).toBe(201);
  });

  test("Recruiter can view jobs", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // ====== REFERRAL ======
  test("Recruiter create referral", async () => {
    const res = await request(app)
      .post("/api/referrals")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        candidateId,
        jobId,
        adminId: res.body?._id, // giả sử admin id lấy từ login hoặc DB
        message: "Ứng viên tiềm năng"
      });
    referralId = res.body._id;
    expect(res.statusCode).toBe(201);
  });

  test("Admin get referrals", async () => {
    const res = await request(app)
      .get("/api/referrals")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("Admin approve referral", async () => {
    const res = await request(app)
      .put(`/api/referrals/${referralId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("approved");
  });
});
