const mongoose = require("mongoose");

const audioSpotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    audioFilename: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AudioSpot", audioSpotSchema);
