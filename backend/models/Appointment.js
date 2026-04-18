const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hospital: { type: String, default: "" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
  prescription: { type: String, default: "" },
  nextVisitDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);