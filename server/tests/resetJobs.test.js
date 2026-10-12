const request = require("supertest");
const app = require("../index"); // Assuming your Express app is exported from index.js

describe("DELETE /api/jobs/reset", () => {
  it("should reset all jobs in the database", async () => {
    const response = await request(app).delete("/api/jobs/reset");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("All jobs have been reset.");
  });

  it("should handle errors gracefully", async () => {
    jest.spyOn(global, "Job").mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app).delete("/api/jobs/reset");
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Failed to reset jobs");

    global.Job.mockRestore();
  });
});
