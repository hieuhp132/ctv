require("dotenv").config();

const http = require('http');
const db = require('./configs/db');
const express = require('express');
const cors = require('cors');


const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = express(); 
/* db(); */

// Trust proxy for Render deployment
app.set('trust proxy', 1);

const rateLimit = require("express-rate-limit");

const corsOptions = {
  origin: true, // reflect request origin to support multiple domains & production
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." },
  skip: (req) => req.method === 'OPTIONS'
});

if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
}

app.use(express.json());
app.use("/db", require("./routes/db"));
app.use("/spb", require("./routes/supabase"));
app.use("/api/auth", require("./routes/auth"));

app.use("/api/referrals", require("./routes/referral")); // ✅ thêm
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/metrics", require("./routes/metrics"));
app.use("/local", require("./routes/local"));
app.use("/api/messaging", require("./routes/messaging"));
app.use("/analytics", require("./routes/analytics"));
app.use("/api/comments", require("./routes/comments"));


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);;
})

module.exports = app;