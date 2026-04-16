const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  bedNumber: String,
  type: String,
  isOccupied: { type: Boolean, default: false },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }
});

module.exports = mongoose.model("Bed", bedSchema);