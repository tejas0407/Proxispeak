const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    radius: { type: Number, required: true, min: 80, max: 600, default: 250 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
