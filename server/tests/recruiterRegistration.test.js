jest.mock("../utils/fileStore", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("../utils/supabaseClient", () => ({
  callSupabaseFunction: jest.fn(),
}));

jest.mock("../utils/authLogger", () => ({
  logLogin: jest.fn(),
}));

jest.mock("../controllers/comments.js", () => ({
  logActivityInternal: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");
const { readFile, writeFile } = require("../utils/fileStore");
const localController = require("../controllers/local");

describe("recruiter registration portals", () => {
  let users;
  let app;

  beforeEach(() => {
    users = [];
    readFile.mockImplementation(() => users);
    writeFile.mockImplementation((_filename, nextUsers) => {
      users = nextUsers;
    });

    app = express();
    app.use(express.json());
    app.post("/register", localController.doRegister);
    app.post("/register/recruiter-fulltime", localController.doRegisterFulltime);
  });

  test("keeps the standard portal on the freelancer role", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        name: "Freelancer Recruiter",
        email: "freelancer@example.com",
        password: "secret123",
        role: "admin",
      })
      .expect(200);

    expect(response.body.user.role).toBe("recruiter_freelancer");
    expect(response.body.user.status).toBe("Pending");
    expect(users).toHaveLength(1);
    expect(await bcrypt.compare("secret123", users[0].password)).toBe(true);
  });

  test("creates full-time accounts with the requested company and fixed role", async () => {
    const response = await request(app)
      .post("/register/recruiter-fulltime")
      .send({
        name: "Full-time Recruiter",
        email: "fulltime@example.com",
        password: "secret123",
        company: "Ant Tech",
        role: "admin",
      })
      .expect(200);

    expect(response.body.user.role).toBe("recruiter_fulltime");
    expect(response.body.user.company).toBe("Ant Tech");
    expect(response.body.user.status).toBe("Pending");
  });

  test("requires a company and prevents reusing an existing account email", async () => {
    await request(app)
      .post("/register/recruiter-fulltime")
      .send({
        name: "Full-time Recruiter",
        email: "fulltime@example.com",
        password: "secret123",
      })
      .expect(400);

    await request(app)
      .post("/register/recruiter-fulltime")
      .send({
        name: "Full-time Recruiter",
        email: "fulltime@example.com",
        password: "secret123",
        company: "Ant Tech",
      })
      .expect(200);

    await request(app)
      .post("/register/recruiter-fulltime")
      .send({
        name: "Different User",
        email: "FULLTIME@example.com",
        password: "secret123",
        company: "Other Company",
      })
      .expect(400);
    expect(users).toHaveLength(1);
  });
});
