const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  totalBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  latitude: { type: Number, default: 17.3850 },
  longitude: { type: Number, default: 78.4867 },
  departments: [{
    name: { type: String, required: true },
    doctorsCount: { type: Number, default: 0 },
    bedsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  }],
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  description: { type: String, default: "" },
  established: { type: Date, default: null },
  website: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Hospital", HospitalSchema);