jest.mock("../utils/fileStore", () => ({
  readFile: jest.fn(),
}));

jest.mock("../models/Referral", () => ({
  find: jest.fn(),
}));

jest.mock("../models/User", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../models/Job", () => ({
  find: jest.fn(),
}));

const express = require("express");
const request = require("supertest");
const Referral = require("../models/Referral");
const User = require("../models/User");
const { readFile } = require("../utils/fileStore");
const metricsController = require("../controllers/metrics");

describe("recruiter dashboard metrics", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.get("/metrics", (req, _res, next) => {
      req.user = { id: "freelancer-1" };
      next();
    }, metricsController.recruiterDashboard);
  });

  test("calculates referral, review, confirmed, and in-progress commissions for local accounts", async () => {
    readFile.mockImplementation((filename) => {
      if (filename === "users.json") {
        return [{ _id: "freelancer-1", email: "recruiter@example.com" }];
      }
      if (filename === "referrals.json") {
        return [
          { recruiter: "freelancer-1", status: "submitted", bonus: 100 },
          { recruiter: "RECRUITER@example.com", status: "under_review", bonus: 200 },
          { recruiter: "freelancer-1", status: "hired", bonus: 0, job: "job-1" },
          { recruiter: "freelancer-1", status: "onboard", bonus: 450, finalized: true },
          { recruiter: "freelancer-1", status: "rejected", bonus: 900, finalized: true },
          { recruiter: "another-user", status: "onboard", bonus: 500 },
        ];
      }
      if (filename === "jobs.json") {
        return [{ _id: "job-1", rewardCandidateUSD: 300 }];
      }
      return [];
    });

    const response = await request(app).get("/metrics").expect(200);

    expect(response.body).toEqual({
      referralCredits: 5,
      toReview: 2,
      confirmedAmount: 450,
      inProgressAmount: 300,
    });
    expect(Referral.find).not.toHaveBeenCalled();
  });

  test("loads MongoDB referrals by authenticated recruiter id", async () => {
    readFile.mockImplementation((filename) =>
      filename === "users.json" ? [] : []
    );
    const recruiter = { _id: "mongo-recruiter-id" };
    User.findById.mockReturnValue({
      select: () => ({ lean: async () => recruiter }),
    });
    Referral.find.mockReturnValue({
      select: () => ({
        lean: async () => [
          { status: "submitted", bonus: 100 },
          { status: "onboard", bonus: 0 },
          { status: "onboard", bonus: 250, finalized: true },
        ],
      }),
    });

    const response = await request(app).get("/metrics").expect(200);

    expect(User.findById).toHaveBeenCalledWith("freelancer-1");
    expect(Referral.find).toHaveBeenCalledWith({ recruiter: recruiter._id });
    expect(response.body).toEqual({
      referralCredits: 3,
      toReview: 1,
      confirmedAmount: 250,
      inProgressAmount: 100,
    });
  });
});
