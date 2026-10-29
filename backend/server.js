require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const audioSpotRoutes = require("./routes/audioSpotRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ProxiSpeak API",
    health: "/api/health",
    audioSpots: "/api/audio-spots"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ProxiSpeak API" });
});

app.use("/api/audio-spots", audioSpotRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log("ProxiSpeak API running at http://localhost:" + PORT);
  });
}

start().catch((error) => {
  console.error("Could not start ProxiSpeak API:", error.message);
  process.exitCode = 1;
});
