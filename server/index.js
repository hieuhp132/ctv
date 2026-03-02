require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

/* ================= TRUST PROXY (Render / Vercel) ================= */
app.set("trust proxy", 1);

/* ================= CORS ================= */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

/* ================= RATE LIMIT (PROD ONLY) ================= */
if (process.env.NODE_ENV === "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many requests, please try again later.",
      },
      skip: (req) => req.method === "OPTIONS",
    }),
  );
}

/* ================= BODY PARSER ================= */
app.use(express.json());

/* ================= ROUTES ================= */
app.use("/spb", require("./routes/supabase"));
app.use("/analytics", require("./routes/analytics"));
app.use("/local", require("./routes/local"));
app.use("/api/messaging", require("./routes/messaging"));
app.use("/api/comments", require("./routes/comments"));

/* ================= HEALTH CHECK ================= */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/* ================= SERVER ================= */
const server = http.createServer(app);

server.listen(port, hostname, () => {
  console.log(`🚀 Server running at http://${hostname}:${port}`);
});

module.exports = app;
