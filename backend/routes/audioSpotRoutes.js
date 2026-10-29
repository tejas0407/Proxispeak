const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const AudioSpot = require("../models/AudioSpot");

const router = express.Router();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "audio/ogg", "audio/mp4", "audio/webm"
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".mp3", ".wav", ".ogg", ".m4a", ".webm"].includes(ext) ? ext : ".audio";
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported audio type. Try MP3, WAV, OGG, M4A or WebM."));
    }
    cb(null, true);
  }
});

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function serializeSpot(spot, distance) {
  const result = {
    id: spot._id,
    title: spot.title,
    description: spot.description,
    latitude: spot.latitude,
    longitude: spot.longitude,
    audioUrl: `/uploads/${spot.audioFilename}`,
    createdAt: spot.createdAt
  };
  if (distance !== undefined) result.distanceKm = Number(distance.toFixed(3));
  return result;
}

function parseCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    const error = new Error("Valid latitude (-90 to 90) and longitude (-180 to 180) are required.");
    error.status = 400;
    throw error;
  }
  return { lat, lon };
}

// POST /api/audio-spots — create a location-linked audio item
router.post("/", upload.single("audio"), async (req, res, next) => {
  let savedFilename;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "An audio file is required in the 'audio' field." });
    }
    savedFilename = req.file.filename;

    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title) {
      fs.unlink(path.join(uploadDir, savedFilename), () => {});
      return res.status(400).json({ message: "Title is required." });
    }
    if (title.length > 120 || description.length > 500) {
      fs.unlink(path.join(uploadDir, savedFilename), () => {});
      return res.status(400).json({ message: "Title max is 120 characters; description max is 500." });
    }

    const { lat, lon } = parseCoordinates(req.body.latitude, req.body.longitude);
    const spot = await AudioSpot.create({
      title, description, latitude: lat, longitude: lon,
      audioFilename: savedFilename
    });

    res.status(201).json(serializeSpot(spot));
  } catch (error) {
    if (savedFilename) fs.unlink(path.join(uploadDir, savedFilename), () => {});
    next(error);
  }
});

// GET /api/audio-spots — list newest first
router.get("/", async (req, res, next) => {
  try {
    const spots = await AudioSpot.find().sort({ createdAt: -1 }).limit(500);
    res.json(spots.map((spot) => serializeSpot(spot)));
  } catch (error) {
    next(error);
  }
});

// GET /api/audio-spots/nearby?latitude=...&longitude=...&radiusKm=5
router.get("/nearby", async (req, res, next) => {
  try {
    const { lat, lon } = parseCoordinates(req.query.latitude, req.query.longitude);
    const radiusKm = Number(req.query.radiusKm || 5);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      return res.status(400).json({ message: "radiusKm must be greater than 0 and at most 100." });
    }

    // Starter implementation scans up to 5000 entries. Add a MongoDB 2dsphere index
    // and GeoJSON Point field before production-scale use.
    const spots = await AudioSpot.find().sort({ createdAt: -1 }).limit(5000);
    const matches = spots
      .map((spot) => ({ spot, distance: distanceKm(lat, lon, spot.latitude, spot.longitude) }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json(matches.map((item) => serializeSpot(item.spot, item.distance)));
  } catch (error) {
    next(error);
  }
});

// GET /api/audio-spots/:id — one audio item
router.get("/:id", async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid audio spot ID." });
    }
    const spot = await AudioSpot.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: "Audio spot not found." });
    res.json(serializeSpot(spot));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
