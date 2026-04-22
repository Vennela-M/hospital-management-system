const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: false },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String, default: "" }
  }],
  diagnosis: { type: String, default: "" },
  instructions: { type: String, default: "" },
  followUpDate: { type: Date, default: null },
  status: { type: String, enum: ["active", "completed", "discontinued"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Prescription", prescriptionSchema);
