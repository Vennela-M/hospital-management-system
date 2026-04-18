const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Hospital", HospitalSchema);