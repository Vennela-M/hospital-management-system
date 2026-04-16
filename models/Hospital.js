const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  name: String,
  totalBeds: Number,
  availableBeds: Number,
  doctors: [String]
});

module.exports = mongoose.model("Hospital", HospitalSchema);