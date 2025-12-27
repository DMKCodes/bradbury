const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const entriesRoutes = require("./routes/entries");
const statsRoutes = require("./routes/stats");

const app = express();

/**
 * Configuration
 */
const PORT = Number(process.env.PORT) || 5050;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "[FATAL] Missing MONGODB_URI in environment. Create apps/api/.env and set MONGODB_URI."
  );
  process.exit(1);
}

/**
 * Middleware
 */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/**
 * Routes
 */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "bradbury-api",
    time: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/entries", entriesRoutes);
app.use("/stats", statsRoutes);

/**
 * Boot
 */
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("[API] MongoDB connected");
    console.log(`[API] Listening on http://localhost:${PORT}`);

    app.listen(PORT);
  } catch (err) {
    console.error("[FATAL] Failed to start API:", err);
    process.exit(1);
  }
}

start();