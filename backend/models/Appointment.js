const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",   // ⚠️ MUST match Patient model name
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",      // ⚠️ your doctor comes from User model
    required: true
  },

  date: String,
  time: String,
  notes: String,

  nextVisitDate: Date

}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);