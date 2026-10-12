jest.mock("../utils/fileStore", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { readFile, writeFile } = require("../utils/fileStore");
const adminOnly = require("../middlewares/admin");
const roleMiddleware = require("../middlewares/role");
const userManagement = require("../controllers/userManagement");

process.env.JWT_SECRET = "user-management-test-secret";

const initialUsers = () => [
  {
    _id: "admin-1",
    name: "Admin",
    email: "admin@example.com",
    password: "admin-hash",
    role: "admin",
    status: "Active",
  },
  {
    _id: "recruiter-1",
    name: "Recruiter",
    email: "recruiter@example.com",
    password: "recruiter-hash",
    role: "recruiter",
    status: "Active",
  },
  {
    _id: "lower-admin-1",
    name: "Lower Admin",
    email: "lower-admin@example.com",
    password: "lower-admin-hash",
    role: "lower_admin",
    status: "Active",
  },
];

const tokenFor = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe("admin user management API", () => {
  let users;
  let app;

  beforeEach(() => {
    users = initialUsers();
    readFile.mockImplementation(() => users);
    writeFile.mockImplementation((_filename, nextUsers) => {
      users = nextUsers;
    });

    app = express();
    app.use(express.json());
    app.get("/users", ...adminOnly, userManagement.getUsers);
    app.post("/users", ...adminOnly, userManagement.createUser);
    app.patch("/users/:userId/role", ...adminOnly, userManagement.updateRole);
    app.patch("/users/:userId/status", ...adminOnly, userManagement.updateStatus);
    app.put("/users/:userId/password", ...adminOnly, userManagement.resetPassword);
    app.post("/legacy/users/reset", ...adminOnly, userManagement.resetPasswordByEmail);
    app.post("/legacy/users/update-status", ...adminOnly, userManagement.updateStatus);
    app.delete("/users/:userId", ...adminOnly, userManagement.deleteUser);
    app.get("/recruiter-only", require("../middlewares/auth"), roleMiddleware(["recruiter"]), (_req, res) => {
      res.sendStatus(204);
    });
    app.get("/admin-feature", require("../middlewares/auth"), roleMiddleware(["admin", "lower_admin"]), (_req, res) => {
      res.sendStatus(204);
    });
  });

  test("requires an authenticated, currently active admin", async () => {
    await request(app).get("/users").expect(401);
    await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenFor("recruiter-1", "admin")}`)
      .expect(403);

    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "recruiter")}`)
      .expect(200);

    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0]).not.toHaveProperty("password");

    users[0].status = "Pending";
    await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .expect(403);
  });

  test("includes only confirmed referral bonuses in recruiter commission earned", async () => {
    const recruiter = {
      _id: "recruiter-1",
      name: "Recruiter",
      email: "recruiter@example.com",
      password: "recruiter-hash",
      role: "recruiter",
      status: "Active",
    };
    readFile.mockImplementation((filename) => {
      if (filename === "users.json") return [...users, recruiter];
      if (filename === "jobs.json") return [{ _id: "job-1", rewardCandidateUSD: 400 }];
      if (filename === "referrals.json") {
        return [
          { recruiter: "recruiter-1", status: "hired", bonus: 300 },
          { recruiter: "RECRUITER@example.com", status: "onboard", bonus: 0, job: "job-1" },
          { recruiter: "recruiter-1", status: "rejected", bonus: 900 },
        ];
      }
      return [];
    });

    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .expect(200);

    const result = response.body.data.find((user) => user._id === "recruiter-1");
    expect(result.commissionEarned).toBe(300);
    expect(result).not.toHaveProperty("password");
  });

  test("creates users with a hashed password and rejects duplicate emails", async () => {
    const response = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({
        name: "New Recruiter",
        email: "NEW@example.com",
        password: "temporary-pass",
        role: "recruiter",
        status: "Pending",
      })
      .expect(201);

    expect(response.body.user.email).toBe("new@example.com");
    expect(response.body.user).not.toHaveProperty("password");
    expect(users[3].password).not.toBe("temporary-pass");

    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({
        name: "Duplicate",
        email: "NEW@example.com",
        password: "temporary-pass",
      })
      .expect(409);
  });

  test("allows role and status changes but preserves the last active admin", async () => {
    await request(app)
      .patch("/users/recruiter-1/role")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ role: "candidate" })
      .expect(200);
    expect(users[1].role).toBe("candidate");

    await request(app)
      .patch("/users/recruiter-1/status")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ status: "Rejected" })
      .expect(200);
    expect(users[1].status).toBe("Rejected");

    await request(app)
      .patch("/users/admin-1/role")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ role: "recruiter" })
      .expect(400);

    await request(app)
      .patch("/users/admin-1/status")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ status: "Rejected" })
      .expect(400);
  });

  test("prevents admins from deleting or deactivating themselves", async () => {
    await request(app)
      .delete("/users/admin-1")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .expect(400);

    await request(app)
      .patch("/users/admin-1/status")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ status: "Pending" })
      .expect(400);
  });

  test("resets a user password only through the admin API and stores a hash", async () => {
    await request(app)
      .put("/users/recruiter-1/password")
      .send({ password: "temporary-pass" })
      .expect(401);

    const response = await request(app)
      .put("/users/recruiter-1/password")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ password: "temporary-pass" })
      .expect(200);

    expect(response.body.user).not.toHaveProperty("password");
    expect(await bcrypt.compare("temporary-pass", users[1].password)).toBe(true);
  });

  test("applies role changes immediately to existing tokens", async () => {
    const recruiterToken = tokenFor("recruiter-1", "recruiter");
    await request(app)
      .get("/recruiter-only")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .expect(204);

    await request(app)
      .patch("/users/recruiter-1/role")
      .set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`)
      .send({ role: "candidate" })
      .expect(200);

    await request(app)
      .get("/recruiter-only")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .expect(403);
  });

  test("lower admins can manage recruiter and candidate accounts but not admin roles", async () => {
    const lowerAdminToken = tokenFor("lower-admin-1", "lower_admin");
    const listed = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .expect(200);
    expect(listed.body.data.map((user) => user.role)).toEqual(["recruiter"]);
    expect(listed.body.data.some((user) => user.role === "admin" || user.role === "lower_admin")).toBe(false);

    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({
        name: "New Admin",
        email: "new-admin@example.com",
        password: "temporary-pass",
        role: "admin",
      })
      .expect(403);

    await request(app)
      .post("/legacy/users/reset")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ email: "admin@example.com", newPassword: "another-pass" })
      .expect(403);

    await request(app)
      .post("/legacy/users/update-status")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ userId: "admin-1", newStatus: "Pending" })
      .expect(403);

    const createdCandidate = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({
        name: "New Candidate",
        email: "new-candidate@example.com",
        password: "temporary-pass",
        role: "candidate",
      })
      .expect(201);

    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({
        name: "New Lower Admin",
        email: "new-lower-admin@example.com",
        password: "temporary-pass",
        role: "lower_admin",
      })
      .expect(403);

    await request(app)
      .patch("/users/admin-1/role")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ role: "recruiter" })
      .expect(403);

    await request(app)
      .patch("/users/lower-admin-1/role")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ role: "candidate" })
      .expect(403);

    await request(app)
      .delete("/users/admin-1")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .expect(403);

    await request(app)
      .patch("/users/recruiter-1/role")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ role: "candidate" })
      .expect(200);

    await request(app)
      .put(`/users/${createdCandidate.body.user._id}/password`)
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .send({ password: "another-pass" })
      .expect(200);

    await request(app)
      .delete(`/users/${createdCandidate.body.user._id}`)
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .expect(200);

    await request(app)
      .get("/admin-feature")
      .set("Authorization", `Bearer ${lowerAdminToken}`)
      .expect(204);
  });
});
